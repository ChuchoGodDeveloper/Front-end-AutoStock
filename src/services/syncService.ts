import { create } from 'zustand'
import { HttpError } from './httpClient'
import {
  actualizarOperacionOffline,
  contarOperacionesPendientes,
  eliminarOperacionOffline,
  encolarOperacionOffline,
  leerColaOffline,
  type OperacionOffline,
  type TipoOperacionOffline,
} from './offlineDb'
import { vehiculosService } from './vehiculosService'
import { useCatalogoStore } from '../stores/catalogoStore'
import type {
  ActualizarKilometrajePayload,
  CambiarEstadoOperativoDto,
  GuardarFotografiaDto,
  RegistrarVehiculoDto,
  ReubicarVehiculoPayload,
} from '../types/vehiculo'

interface EstadoSync {
  cola: OperacionOffline[]
  totalPendientes: number
  sincronizando: boolean
  ultimoResultado: string | null
  cargarCola: () => Promise<void>
  encolar: (
    tipo: TipoOperacionOffline,
    descripcion: string,
    datos: unknown,
    vehiculoId?: string,
  ) => Promise<void>
  sincronizarTodo: () => Promise<{ exito: number; fallidos: number }>
  descartarOperacion: (id: string) => Promise<void>
}

export const useSyncStore = create<EstadoSync>()((set, get) => ({
  cola: [],
  totalPendientes: 0,
  sincronizando: false,
  ultimoResultado: null,

  cargarCola: async () => {
    const cola = await leerColaOffline()
    const total = await contarOperacionesPendientes()
    set({ cola, totalPendientes: total })
  },

  encolar: async (tipo, descripcion, datos, vehiculoId) => {
    const op: OperacionOffline = {
      id: crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}-${Math.random()}`,
      tipo,
      descripcion,
      datos,
      vehiculoId,
      creadoEn: new Date().toISOString(),
      estado: 'Esperando conexión',
      intentos: 0,
    }
    await encolarOperacionOffline(op)
    await get().cargarCola()
  },

  descartarOperacion: async (id: string) => {
    await eliminarOperacionOffline(id)
    await get().cargarCola()
  },

  sincronizarTodo: async () => {
    if (get().sincronizando || !navigator.onLine) {
      return { exito: 0, fallidos: 0 }
    }

    set({ sincronizando: true, ultimoResultado: null })
    const operaciones = await leerColaOffline()
    let exito = 0
    let fallidos = 0

    for (const op of operaciones) {
      try {
        op.estado = 'Sincronizando'
        op.intentos += 1
        await actualizarOperacionOffline(op)

        if (op.tipo === 'CAMBIO_ESTADO' && op.vehiculoId) {
          await vehiculosService.cambiarEstadoOperativo(
            op.vehiculoId,
            op.datos as CambiarEstadoOperativoDto,
          )
        } else if (op.tipo === 'REUBICACION' && op.vehiculoId) {
          await vehiculosService.reubicarVehiculo(
            op.vehiculoId,
            op.datos as ReubicarVehiculoPayload,
          )
        } else if (op.tipo === 'ACTUALIZAR_KM_NOTAS' && op.vehiculoId) {
          await vehiculosService.actualizarKilometrajeYNotas(
            op.vehiculoId,
            op.datos as ActualizarKilometrajePayload,
          )
        } else if (op.tipo === 'REGISTRAR_VEHICULO') {
          await vehiculosService.registrarVehiculo(op.datos as RegistrarVehiculoDto)
        } else if (op.tipo === 'SUBIR_FOTO' && op.vehiculoId) {
          await vehiculosService.guardarFotografia(
            op.vehiculoId,
            op.datos as GuardarFotografiaDto,
          )
        }

        await eliminarOperacionOffline(op.id)
        exito += 1
      } catch (err: unknown) {
        if (!(err instanceof HttpError)) {
          // Corte de red temporal: dejar lista para reintento automático al estabilizarse la conexión
          op.estado = 'Esperando conexión'
          op.error = 'Sin conexión a internet o conexión interrumpida; se reintentará automáticamente.'
          await actualizarOperacionOffline(op)
          fallidos += 1
          continue
        }

        fallidos += 1
        op.estado = 'No se pudo sincronizar'
        if (err.status === 401 || err.status === 403) {
          op.error = `Sesión expirada o sin permisos suficientes (${err.status}): ${err.message}`
        } else if (err.status >= 500) {
          op.error = `Error temporal del servidor (${err.status}): ${err.message}`
        } else {
          op.error = err.message || 'Conflicto o error de validación en el servidor'
        }
        await actualizarOperacionOffline(op)
      }
    }

    await get().cargarCola()

    if (exito > 0) {
      const catalogo = useCatalogoStore.getState()
      void catalogo.cargarMasVehiculos(true)
      void catalogo.cargarConteosRapidos()
      void catalogo.sincronizarCacheCompleta()
    }

    set({
      sincronizando: false,
      ultimoResultado:
        exito === 0 && fallidos === 0
          ? null
          : fallidos === 0
            ? `Se sincronizaron ${exito} ${exito === 1 ? 'cambio' : 'cambios'} automáticamente`
            : `Se sincronizaron ${exito} cambios. ${fallidos} requirieron revisión.`,
    })

    return { exito, fallidos }
  },
}))

