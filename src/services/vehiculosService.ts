import { normalizarPaginaCatalogo, normalizarVehiculoDetalle } from '../utils/imagenVehiculo'
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
  RegistrarVentaPayload,
  ReporteVentas,
  ReubicarVehiculoPayload,
  RevertirVentaPayload,
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

    filtros?.estados.forEach((estado) => params.append('estados', estado))

    if (filtros?.tipo != null) {
      params.set('tipo', String(filtros.tipo))
    }

    if (filtros?.precioMin != null) {
      params.set('precioMin', String(filtros.precioMin))
    }

    if (filtros?.precioMax != null) {
      params.set('precioMax', String(filtros.precioMax))
    }

    return apiFetch<PaginaCatalogo>(`/vehiculos?${params.toString()}`).then(
      normalizarPaginaCatalogo,
    )
  },

  obtenerConteosRapidos: () => apiFetch<ConteosRapidos>('/vehiculos/conteos-rapidos'),

  obtenerVehiculoPorId: (id: string) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${id}`).then(normalizarVehiculoDetalle),

  registrarVehiculo: (datos: RegistrarVehiculoDto) =>
    apiFetch<VehiculoDetalle>('/vehiculos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }).then(normalizarVehiculoDetalle),

  guardarFotografia: (vehiculoId: string, datos: GuardarFotografiaDto) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/fotografias`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }).then(normalizarVehiculoDetalle),

  eliminarFotografia: (vehiculoId: string, imagenId: string) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/fotografias/${imagenId}`, {
      method: 'DELETE',
    }).then(normalizarVehiculoDetalle),

  cambiarEstadoOperativo: (vehiculoId: string, datos: CambiarEstadoOperativoDto) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    }).then(normalizarVehiculoDetalle),

  reubicarVehiculo: (vehiculoId: string, datos: ReubicarVehiculoPayload) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/reubicar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }).then(normalizarVehiculoDetalle),

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
    }).then(normalizarVehiculoDetalle),

  marcarComoVendido: (vehiculoId: string, datos: RegistrarVentaPayload) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/marcar-vendido`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }).then(normalizarVehiculoDetalle),

  revertirVenta: (vehiculoId: string, datos: RevertirVentaPayload) =>
    apiFetch<VehiculoDetalle>(`/vehiculos/${vehiculoId}/revertir-venta`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }).then(normalizarVehiculoDetalle),

  obtenerReporteVentas: (params?: {
    periodo?: string
    fechaInicio?: string
    fechaFin?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.periodo) searchParams.set('periodo', params.periodo)
    if (params?.fechaInicio) searchParams.set('fechaInicio', params.fechaInicio)
    if (params?.fechaFin) searchParams.set('fechaFin', params.fechaFin)

    const query = searchParams.toString()
    return apiFetch<ReporteVentas>(`/ventas/reporte${query ? `?${query}` : ''}`)
  },
}
