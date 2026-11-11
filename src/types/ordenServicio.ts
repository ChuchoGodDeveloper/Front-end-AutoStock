export interface NotaAvance {
  id: string
  nota: string
  fechaCreacion: string
  creadoPorUsuarioId: number
  creadoPorNombre: string
}

export interface OrdenServicio {
  id: string
  folio: string
  vehiculoId: string
  tipoTrabajo: string
  descripcion: string
  prioridad: string
  costoEstimado?: number | null
  responsable?: string | null
  fechaEstimada?: string | null
  estado: 'Abierta' | 'Cerrada'
  fechaCreacion: string
  creadoPorUsuarioId: number
  creadoPorNombre: string
  fechaCierre?: string | null
  cerradoPorNombre?: string | null
  costoFinal?: number | null
  estadoSalida?: string | null
  notasAvance: NotaAvance[]
}

export interface CrearOrdenServicioPayload {
  tipoTrabajo: string
  descripcion: string
  prioridad: string
  costoEstimado?: number | null
  responsable?: string
  fechaEstimada?: string | null
}

export interface CerrarOrdenServicioPayload {
  costoFinal: number
  estadoSalida: 'Disponible' | 'EnLavado'
}

export interface AgregarNotaAvancePayload {
  nota: string
}
