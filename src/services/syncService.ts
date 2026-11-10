import { create } from 'zustand'
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
        fallidos += 1
        const mensajeError =
          err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'mensaje' in err
              ? String((err as { mensaje: unknown }).mensaje)
              : 'Error al enviar solicitud'

        op.estado = 'No se pudo sincronizar'
        op.error = mensajeError
        await actualizarOperacionOffline(op)
      }
    }

    await get().cargarCola()
    set({
      sincronizando: false,
      ultimoResultado:
        fallidos === 0
          ? 'Cambios sincronizados'
          : `Se sincronizaron ${exito} cambios. ${fallidos} requirieron revisión.`,
    })

    return { exito, fallidos }
  },
}))

