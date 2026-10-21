export enum EstadoOperativo {
  Disponible = 'Disponible',
  TestDrive = 'TestDrive',
  EnTaller = 'EnTaller',
  EnLavado = 'EnLavado',
  Reservado = 'Reservado',
  Vendido = 'Vendido',
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
  fechaRegistro: string
}

export interface PaginaCatalogo {
  items: Vehiculo[]
  totalCount: number
  page: number
  pageSize: number
}
