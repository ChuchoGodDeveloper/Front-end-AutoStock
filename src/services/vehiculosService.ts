import { apiFetch } from './httpClient'
import type {
  ConteosRapidos,
  FiltrosCatalogo,
  PaginaCatalogo,
  RegistrarVehiculoDto,
  VehiculoDetalle,
} from '../types/vehiculo'

export const vehiculosService = {
  obtenerCatalogo: (
    page: number,
    pageSize: number,
    busqueda?: string,
    filtros?: FiltrosCatalogo,
  ) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })

    if (busqueda && busqueda.trim()) {
      params.set('busqueda', busqueda.trim())
    }

    filtros?.estados.forEach((estado) => params.append('estados[]', estado))

    if (filtros?.tipo != null) {
      params.set('tipo', String(filtros.tipo))
    }

    if (filtros?.precioMin != null) {
      params.set('precioMin', String(filtros.precioMin))
    }

    if (filtros?.precioMax != null) {
      params.set('precioMax', String(filtros.precioMax))
    }

    return apiFetch<PaginaCatalogo>(`/vehiculos/catalogo?${params.toString()}`)
  },

  obtenerConteosRapidos: () => apiFetch<ConteosRapidos>('/vehiculos/conteos-rapidos'),

  obtenerVehiculoPorId: (id: string) => apiFetch<VehiculoDetalle>(`/vehiculos/${id}`),

  registrarVehiculo: (datos: RegistrarVehiculoDto) =>
    apiFetch<VehiculoDetalle>('/vehiculos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
}
