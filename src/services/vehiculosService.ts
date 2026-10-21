import { apiFetch } from './httpClient'
import type { PaginaCatalogo } from '../types/vehiculo'

export const vehiculosService = {
  obtenerCatalogo: (page: number, pageSize: number) =>
    apiFetch<PaginaCatalogo>(`/vehiculos/catalogo?page=${page}&pageSize=${pageSize}`),
}
