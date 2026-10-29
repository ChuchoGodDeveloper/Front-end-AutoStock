export enum EstadoOperativo {
  Disponible = 'Disponible',
  TestDrive = 'TestDrive',
  EnTaller = 'EnTaller',
  EnLavado = 'EnLavado',
  Reservado = 'Reservado',
  Vendido = 'Vendido',
}

export enum TipoVehiculo {
  Nuevo = 1,
  Seminuevo = 2,
}

export type TipoTomaFotografica =
  | 'Frontal'
  | 'LateralDerecha'
  | 'Trasera'
  | 'TableroOdometro'
  | 'Adicional1'
  | 'Adicional2'

export interface Vehiculo {
  id: string
  marca: string
  modelo: string
  anio: number
  precio: number
  kilometraje: number
  placa: string | null
  zonaLote: string
  cajonLote: string
  fotoPrincipalUrl: string | null
  estado: EstadoOperativo
  tipo: TipoVehiculo
  fechaRegistro: string
}

export interface FiltrosCatalogo {
  estados: EstadoOperativo[]
  tipo: TipoVehiculo | null
  precioMin: number | null
  precioMax: number | null
}

export interface ConteosRapidos {
  todos: number
  disponibles: number
  seminuevos: number
  nuevos: number
}

export interface PaginaCatalogo {
  items: Vehiculo[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ImagenVehiculo {
  id: string
  url: string
  esPrincipal: boolean
  orden: number
  tipoToma: string
  fechaCaptura?: string
  capturadaPor?: string | null
}

export interface HistorialUbicacionVehiculo {
  id: string
  zonaAnterior: string
  cajonAnterior: string
  zonaNueva: string
  cajonNuevo: string
  usuarioId?: number | null
  reubicadoPor: string
  fechaMovimiento: string
}

export interface HistorialEstadoVehiculo {
  id: string
  estadoAnterior: EstadoOperativo
  estadoNuevo: EstadoOperativo
  usuarioId: number | null
  cambiadoPor: string
  fechaCambio: string
}

export interface VehiculoDetalle extends Vehiculo {
  vin: string
  numeroStock: string
  version: string | null
  motor: string | null
  potencia: string | null
  transmision: string | null
  colorExterior: string | null
  colorInterior: string | null
  equipamiento: string | null
  notasInspeccion: string | null
  registradoPor: string | null
  fechaCambioEstado?: string | null
  estadoActualizadoPor?: string | null
  estadoActualizadoPorUsuarioId?: number | null
  responsableTestDrive?: string | null
  reservadoPorUsuarioId?: number | null
  reservadoPorNombre?: string | null
  fechaReubicacion?: string | null
  reubicadoPor?: string | null
  reubicadoPorUsuarioId?: number | null
  fechaActualizacionKilometraje?: string | null
  kilometrajeActualizadoPor?: string | null
  kilometrajeActualizadoPorUsuarioId?: number | null
  historialKilometrajes?: HistorialKilometrajeVehiculo[]
  tomasObligatoriasCompletadas: number
  porcentajeEvidencia: number
  inspeccionCompleta: boolean
  imagenes: ImagenVehiculo[]
  historialEstados?: HistorialEstadoVehiculo[]
  historialUbicaciones?: HistorialUbicacionVehiculo[]
}

export interface RegistrarVehiculoDto {
  tipo: TipoVehiculo
  vin: string
  marca: string
  modelo: string
  version?: string | null
  anio: number
  placa?: string | null
  kilometraje: number
  transmision: string
  motor: string
  potencia?: string | null
  colorExterior: string
  colorInterior: string
  precio: number
  estado: EstadoOperativo
  zonaLote: string
  cajonLote: string
  equipamiento?: string | null
  notasInspeccion?: string | null
}

export interface GuardarFotografiaDto {
  tipoToma: string
  imagenBase64: string
}

export interface CambiarEstadoOperativoDto {
  nuevoEstado: EstadoOperativo
}

export function obtenerEtiquetaToma(tipoToma?: string | null): string {
  switch (tipoToma) {
    case 'Frontal':
      return 'Frontal'
    case 'LateralDerecha':
      return 'Lateral derecha'
    case 'Trasera':
      return 'Trasera'
    case 'TableroOdometro':
      return 'Tablero / odómetro'
    case 'Adicional1':
      return 'Adicional 1'
    case 'Adicional2':
      return 'Adicional 2'
    default:
      return tipoToma || 'Fotografía'
  }
}

export interface ReubicarVehiculoPayload {
  zona: string
  cajon: string
}

export interface OcupanteCajonRespuesta {
  ocupado: boolean
  marca?: string | null
  modelo?: string | null
  placa?: string | null
  mensaje?: string | null
}

export interface HistorialKilometrajeVehiculo {
  id: string
  kilometrajeAnterior: number
  kilometrajeNuevo: number
  notasInspeccion?: string | null
  motivoCorreccion?: string | null
  usuarioId?: number | null
  actualizadoPor: string
  fechaActualizacion: string
}

export interface ActualizarKilometrajePayload {
  kilometraje: number
  notasInspeccion?: string | null
  motivoCorreccion?: string | null
}
