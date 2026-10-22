import { EstadoOperativo } from '../types/vehiculo'

export interface EstiloEstado {
  etiqueta: string
  clases: string
}

export const ESTILOS_ESTADO: Partial<Record<EstadoOperativo, EstiloEstado>> = {
  [EstadoOperativo.Disponible]: {
    etiqueta: 'Disponible',
    clases: 'border-green-300 bg-green-100 text-green-800',
  },
  [EstadoOperativo.TestDrive]: {
    etiqueta: 'Test Drive',
    clases: 'border-blue-300 bg-blue-100 text-blue-800',
  },
  [EstadoOperativo.EnTaller]: {
    etiqueta: 'En Taller',
    clases: 'border-orange-300 bg-orange-100 text-orange-800',
  },
  [EstadoOperativo.EnLavado]: {
    etiqueta: 'En Lavado',
    clases: 'border-yellow-300 bg-yellow-100 text-yellow-800',
  },
  [EstadoOperativo.Reservado]: {
    etiqueta: 'Reservado',
    clases: 'border-red-300 bg-red-100 text-red-800',
  },
}
