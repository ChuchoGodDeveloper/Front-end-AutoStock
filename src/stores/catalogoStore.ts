import { create } from 'zustand'
import { MENSAJES } from '../config/mensajes'
import { vehiculosService } from '../services/vehiculosService'
import type { Vehiculo } from '../types/vehiculo'

export const TAMANO_PAGINA_CATALOGO = 20

interface EstadoCatalogo {
  vehiculos: Vehiculo[]
  totalUnidades: number
  paginaActual: number
  hayMas: boolean
  cargando: boolean
  error: string | null
  terminoBusqueda: string
  cargarMasVehiculos: (resetear?: boolean) => Promise<void>
  setTerminoBusqueda: (busqueda: string) => Promise<void>
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

    cargarMasVehiculos: async (resetear = false) => {
      const { cargando, hayMas, paginaActual, vehiculos, terminoBusqueda } = get()

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
  }
})
