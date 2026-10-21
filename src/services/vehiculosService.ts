import { apiFetch } from './httpClient'
import type { PaginaCatalogo, VehiculoDetalle } from '../types/vehiculo'

export const vehiculosService = {
  obtenerCatalogo: (page: number, pageSize: number, busqueda?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })

    if (busqueda && busqueda.trim()) {
      params.set('busqueda', busqueda.trim())
    }

    return apiFetch<PaginaCatalogo>(`/vehiculos/catalogo?${params.toString()}`)
  },

  obtenerVehiculoPorId: (id: string) => apiFetch<VehiculoDetalle>(`/vehiculos/${id}`),
}
