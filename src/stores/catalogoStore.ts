import { create } from 'zustand'
import { MENSAJES } from '../config/mensajes'
import { vehiculosService } from '../services/vehiculosService'
import {
  guardarInventarioLocal,
  leerInventarioLocal,
  leerMetaInventario,
  type MetaInventario,
} from '../services/offlineDb'
import type { ConteosRapidos, FiltrosCatalogo, Vehiculo, VehiculoDetalle } from '../types/vehiculo'

export const TAMANO_PAGINA_CATALOGO = 15

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

function filtrarVehiculosLocales(
  vehiculos: Vehiculo[],
  busqueda: string,
  filtros: FiltrosCatalogo,
): Vehiculo[] {
  let resultado = vehiculos

  if (busqueda && busqueda.trim()) {
    const q = busqueda.trim().toLowerCase().replace(/[-\s]/g, '')
    resultado = resultado.filter((v) => {
      const matchMarca = v.marca.toLowerCase().replace(/[-\s]/g, '').includes(q)
      const matchModelo = v.modelo.toLowerCase().replace(/[-\s]/g, '').includes(q)
      const matchPlaca = v.placa?.toLowerCase().replace(/[-\s]/g, '').includes(q) ?? false
      return matchMarca || matchModelo || matchPlaca
    })
  }

  if (filtros.estados.length > 0) {
    resultado = resultado.filter((v) => filtros.estados.includes(v.estado))
  }

  if (filtros.tipo != null) {
    resultado = resultado.filter((v) => v.tipo === filtros.tipo)
  }

  if (filtros.precioMin != null) {
    resultado = resultado.filter((v) => v.precio >= (filtros.precioMin ?? 0))
  }

  if (filtros.precioMax != null) {
    resultado = resultado.filter((v) => v.precio <= (filtros.precioMax ?? Infinity))
  }

  return resultado
}

interface EstadoCatalogo {
  vehiculos: Vehiculo[]
  totalUnidades: number
  paginaActual: number
  totalPaginas: number
  hayMas: boolean
  cargando: boolean
  error: string | null
  terminoBusqueda: string
  filtros: FiltrosCatalogo
  conteos: ConteosRapidos
  metaOffline: MetaInventario | null
  esModoOffline: boolean
  irAPagina: (pagina: number) => Promise<void>
  cargarMasVehiculos: (resetear?: boolean) => Promise<void>
  setTerminoBusqueda: (busqueda: string) => Promise<void>
  setFiltros: (nuevosFiltros: FiltrosCatalogo) => Promise<void>
  cargarConteosRapidos: () => Promise<void>
  invalidarCatalogo: () => void
  actualizarVehiculoEnCatalogo: (actualizado: VehiculoDetalle) => void
  sincronizarCacheCompleta: () => Promise<void>
}

export const useCatalogoStore = create<EstadoCatalogo>()((set, get) => {
  let solicitudActual = 0

  return {
    vehiculos: [],
    totalUnidades: 0,
    paginaActual: 1,
    totalPaginas: 1,
    hayMas: false,
    cargando: false,
    error: null,
    terminoBusqueda: '',
    filtros: FILTROS_VACIOS,
    conteos: { todos: 0, disponibles: 0, seminuevos: 0, nuevos: 0 },
    metaOffline: null,
    esModoOffline: false,

    irAPagina: async (pagina: number) => {
      const paginaSolicitada = Math.max(1, pagina)
      const { terminoBusqueda, filtros } = get()

      solicitudActual += 1
      const solicitud = solicitudActual

      set({ cargando: true, error: null })

      try {
        const respuesta = await vehiculosService.obtenerCatalogo(
          paginaSolicitada,
          TAMANO_PAGINA_CATALOGO,
          terminoBusqueda || undefined,
          filtros,
        )

        if (solicitud !== solicitudActual) return

        const itemsPagina = respuesta.items ?? []
        const totalUnidades = respuesta.totalCount ?? itemsPagina.length
        const paginaResultante = respuesta.page ?? paginaSolicitada
        const totalPaginas = Math.max(1, Math.ceil(totalUnidades / TAMANO_PAGINA_CATALOGO))

        set({
          vehiculos: itemsPagina,
          totalUnidades,
          paginaActual: paginaResultante,
          totalPaginas,
          hayMas: paginaResultante < totalPaginas,
          cargando: false,
          esModoOffline: false,
        })

        // Guardar silenciosamente en cache local
        void guardarInventarioLocal(itemsPagina)
      } catch {
        if (solicitud !== solicitudActual) return

        // Fallback a IndexedDB
        const cache = await leerInventarioLocal()
        const meta = await leerMetaInventario()

        if (cache.length > 0) {
          const filtrados = filtrarVehiculosLocales(cache, terminoBusqueda, filtros)
          const totalUnidades = filtrados.length
          const totalPaginas = Math.max(1, Math.ceil(totalUnidades / TAMANO_PAGINA_CATALOGO))
          const paginaSegura = Math.min(paginaSolicitada, totalPaginas)
          const inicio = (paginaSegura - 1) * TAMANO_PAGINA_CATALOGO
          const paginados = filtrados.slice(inicio, inicio + TAMANO_PAGINA_CATALOGO)

          set({
            vehiculos: paginados,
            totalUnidades,
            paginaActual: paginaSegura,
            totalPaginas,
            hayMas: paginaSegura < totalPaginas,
            cargando: false,
            error: null,
            esModoOffline: true,
            metaOffline: meta,
          })
        } else {
          set({
            cargando: false,
            esModoOffline: true,
            error: MENSAJES.offlinePrimeraDescarga,
          })
        }
      }
    },

    cargarMasVehiculos: async (resetear = false) => {
      await get().irAPagina(resetear ? 1 : get().paginaActual || 1)
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
        const cache = await leerInventarioLocal()
        if (cache.length > 0) {
          const disponibles = cache.filter((v) => v.estado === 'Disponible').length
          const seminuevos = cache.filter((v) => v.tipo === 2).length
          const nuevos = cache.filter((v) => v.tipo === 1).length
          set({
            conteos: {
              todos: cache.length,
              disponibles,
              seminuevos,
              nuevos,
            },
          })
        } else {
          set({ conteos: { todos: 0, disponibles: 0, seminuevos: 0, nuevos: 0 } })
        }
      }
    },

    invalidarCatalogo: () => {
      solicitudActual += 1
      set({ vehiculos: [], paginaActual: 1, totalPaginas: 1, hayMas: false, cargando: false })
    },

    actualizarVehiculoEnCatalogo: (actualizado) => {
      const { vehiculos, filtros } = get()
      const cumpleFiltroEstados =
        filtros.estados.length === 0 || filtros.estados.includes(actualizado.estado)

      if (!cumpleFiltroEstados) {
        set({
          vehiculos: vehiculos.filter((item) => item.id !== actualizado.id),
        })
      } else {
        set({
          vehiculos: vehiculos.map((item) =>
            item.id === actualizado.id
              ? {
                  ...item,
                  estado: actualizado.estado,
                  fotoPrincipalUrl: actualizado.fotoPrincipalUrl,
                  zonaLote: actualizado.zonaLote,
                  cajonLote: actualizado.cajonLote,
                  kilometraje: actualizado.kilometraje,
                }
              : item,
          ),
        })
      }

      void get().cargarConteosRapidos()
    },

    sincronizarCacheCompleta: async () => {
      try {
        const respuesta = await vehiculosService.obtenerCatalogo(1, 100)
        if (respuesta.items && respuesta.items.length > 0) {
          await guardarInventarioLocal(respuesta.items)
          const meta = await leerMetaInventario()
          set({ metaOffline: meta })
        }
      } catch {
        // Ignorar si falla en segundo plano
      }
    },
  }
})
