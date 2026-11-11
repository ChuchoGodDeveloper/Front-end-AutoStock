import { apiFetch } from './httpClient'
import type {
  AgregarNotaAvancePayload,
  CerrarOrdenServicioPayload,
  CrearOrdenServicioPayload,
  OrdenServicio,
} from '../types/ordenServicio'

export const ordenesServicioService = {
  crearOrden: (vehiculoId: string, payload: CrearOrdenServicioPayload) =>
    apiFetch<OrdenServicio>(`/vehiculos/${vehiculoId}/ordenes-servicio`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  obtenerOrdenAbierta: (vehiculoId: string) =>
    apiFetch<OrdenServicio | null>(`/vehiculos/${vehiculoId}/orden-servicio-abierta`),

  agregarNota: (ordenId: string, payload: AgregarNotaAvancePayload) =>
    apiFetch<OrdenServicio>(`/ordenes-servicio/${ordenId}/notas`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  cerrarOrden: (ordenId: string, payload: CerrarOrdenServicioPayload) =>
    apiFetch<OrdenServicio>(`/ordenes-servicio/${ordenId}/cerrar`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  obtenerHistorial: (vehiculoId: string) =>
    apiFetch<OrdenServicio[]>(`/vehiculos/${vehiculoId}/mantenimiento`),
}
