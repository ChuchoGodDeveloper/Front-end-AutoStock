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
  tomasObligatoriasCompletadas: number
  porcentajeEvidencia: number
  inspeccionCompleta: boolean
  imagenes: ImagenVehiculo[]
  historialEstados?: HistorialEstadoVehiculo[]
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
