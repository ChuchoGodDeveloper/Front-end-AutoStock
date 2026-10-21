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
  cargarMasVehiculos: (resetear?: boolean) => Promise<void>
}

export const useCatalogoStore = create<EstadoCatalogo>()((set, get) => ({
  vehiculos: [],
  totalUnidades: 0,
  paginaActual: 0,
  hayMas: true,
  cargando: false,
  error: null,

  cargarMasVehiculos: async (resetear = false) => {
    const { cargando, hayMas, paginaActual, vehiculos } = get()

    if (cargando) return
    if (!resetear && !hayMas) return

    set({ cargando: true, error: null })

    try {
      const paginaSolicitada = resetear ? 1 : paginaActual + 1
      const respuesta = await vehiculosService.obtenerCatalogo(
        paginaSolicitada,
        TAMANO_PAGINA_CATALOGO,
      )

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
      set({
        cargando: false,
        error: MENSAJES.errorCatalogo,
      })
    }
  },
}))
