import { create } from 'zustand'
import { MENSAJES } from '../config/mensajes'
import { vehiculosService } from '../services/vehiculosService'
import type { ConteosRapidos, FiltrosCatalogo, Vehiculo } from '../types/vehiculo'

export const TAMANO_PAGINA_CATALOGO = 20

export const FILTROS_VACIOS: FiltrosCatalogo = {
  estados: [],
  tipo: null,
  precioMin: null,
  precioMax: null,
}

export function hayFiltrosActivos(filtros: FiltrosCatalogo): boolean {
  return (
    filtros.estados.length > 0 ||
    filtros.tipo != null ||
    filtros.precioMin != null ||
    filtros.precioMax != null
  )
}

function filtrosIguales(a: FiltrosCatalogo, b: FiltrosCatalogo): boolean {
  return (
    a.tipo === b.tipo &&
    a.precioMin === b.precioMin &&
    a.precioMax === b.precioMax &&
    a.estados.length === b.estados.length &&
    a.estados.every((estado, indice) => estado === b.estados[indice])
  )
}

interface EstadoCatalogo {
  vehiculos: Vehiculo[]
  totalUnidades: number
  paginaActual: number
  hayMas: boolean
  cargando: boolean
  error: string | null
  terminoBusqueda: string
  filtros: FiltrosCatalogo
  conteos: ConteosRapidos
  cargarMasVehiculos: (resetear?: boolean) => Promise<void>
  setTerminoBusqueda: (busqueda: string) => Promise<void>
  setFiltros: (nuevosFiltros: FiltrosCatalogo) => Promise<void>
  cargarConteosRapidos: () => Promise<void>
}

export const useCatalogoStore = create<EstadoCatalogo>()((set, get) => {
  let solicitudActual = 0

  return {
    vehiculos: [],
    totalUnidades: 0,
    paginaActual: 0,
    hayMas: true,
    cargando: false,
    error: null,
    terminoBusqueda: '',
    filtros: FILTROS_VACIOS,
    conteos: { todos: 0, disponibles: 0, seminuevos: 0, nuevos: 0 },

    cargarMasVehiculos: async (resetear = false) => {
      const { cargando, hayMas, paginaActual, vehiculos, terminoBusqueda, filtros } = get()

      if (!resetear && (cargando || !hayMas)) return

      solicitudActual += 1
      const solicitud = solicitudActual

      if (resetear) {
        set({ vehiculos: [], paginaActual: 0, hayMas: true })
      }

      set({ cargando: true, error: null })

      try {
        const paginaSolicitada = resetear ? 1 : paginaActual + 1
        const respuesta = await vehiculosService.obtenerCatalogo(
          paginaSolicitada,
          TAMANO_PAGINA_CATALOGO,
          terminoBusqueda || undefined,
          filtros,
        )

        if (solicitud !== solicitudActual) return

        const base = resetear ? [] : vehiculos
        const idsConocidos = new Set(base.map((vehiculo) => vehiculo.id))
        const anexados = (respuesta.items ?? []).filter(
          (vehiculo) => !idsConocidos.has(vehiculo.id),
        )
        const acumulados = [...base, ...anexados]
        const totalUnidades = respuesta.totalCount ?? acumulados.length
        const paginaResultante = respuesta.page ?? paginaSolicitada

        set({
          vehiculos: acumulados,
          totalUnidades,
          paginaActual: paginaResultante,
          hayMas: acumulados.length < totalUnidades,
          cargando: false,
        })
      } catch {
        if (solicitud !== solicitudActual) return

        set({
          cargando: false,
          error: MENSAJES.errorCatalogo,
        })
      }
    },

    setTerminoBusqueda: async (busqueda) => {
      const terminoLimpio = busqueda.trim()

      if (terminoLimpio === get().terminoBusqueda) return

      set({ terminoBusqueda: terminoLimpio })
      await get().cargarMasVehiculos(true)
    },

    setFiltros: async (nuevosFiltros) => {
      if (filtrosIguales(nuevosFiltros, get().filtros)) return

      set({ filtros: nuevosFiltros })
      await get().cargarMasVehiculos(true)
    },

    cargarConteosRapidos: async () => {
      try {
        const conteos = await vehiculosService.obtenerConteosRapidos()
        set({ conteos })
      } catch {
        set({ conteos: { todos: 0, disponibles: 0, seminuevos: 0, nuevos: 0 } })
      }
    },
  }
})
