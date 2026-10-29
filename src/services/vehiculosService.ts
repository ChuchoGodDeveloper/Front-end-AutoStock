import { apiFetch } from './httpClient'
import type {
  CambiarEstadoOperativoDto,
  ConteosRapidos,
  FiltrosCatalogo,
  GuardarFotografiaDto,
  OcupanteCajonRespuesta,
  PaginaCatalogo,
  ActualizarKilometrajePayload,
  RegistrarVehiculoDto,
  ReubicarVehiculoPayload,
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

  guardarFotografia: (vehiculoId: string, datos: GuardarFotografiaDto) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/fotografias`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  eliminarFotografia: (vehiculoId: string, imagenId: string) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/fotografias/${imagenId}`, {
      method: 'DELETE',
    }),

  cambiarEstadoOperativo: (vehiculoId: string, datos: CambiarEstadoOperativoDto) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    }),

  reubicarVehiculo: (vehiculoId: string, datos: ReubicarVehiculoPayload) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/reubicar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  obtenerZonas: () => apiFetch<string[]>('/vehiculos/zonas'),

  validarCajonDisponible: (zona: string, cajon: string, ignorarVehiculoId?: string) => {
    const params = new URLSearchParams({ zona, cajon })
    if (ignorarVehiculoId) {
      params.set('ignorarVehiculoId', ignorarVehiculoId)
    }
    return apiFetch<OcupanteCajonRespuesta>(`/vehiculos/cajon-disponible?${params.toString()}`)
  },

  actualizarKilometrajeYNotas: (vehiculoId: string, datos: ActualizarKilometrajePayload) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/kilometraje-notas`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),
}
