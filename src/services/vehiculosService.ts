import { apiFetch } from './httpClient'
import type { PaginaCatalogo, VehiculoDetalle } from '../types/vehiculo'

export const vehiculosService = {
  obtenerCatalogo: (page: number, pageSize: number) =>
    apiFetch<PaginaCatalogo>(`/vehiculos/catalogo?page=${page}&pageSize=${pageSize}`),

  obtenerVehiculoPorId: (id: string) => apiFetch<VehiculoDetalle>(`/vehiculos/${id}`),
}
