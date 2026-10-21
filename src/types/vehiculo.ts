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
  url: string
  esPrincipal: boolean
  orden: number
}

export interface VehiculoDetalle extends Vehiculo {
  vin: string
  numeroStock: string
  motor: string | null
  potencia: string | null
  transmision: string | null
  colorExterior: string | null
  colorInterior: string | null
  equipamiento: string | null
  notasInspeccion: string | null
  imagenes: ImagenVehiculo[]
}
