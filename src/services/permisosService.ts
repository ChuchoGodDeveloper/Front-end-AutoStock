import { apiFetch } from './httpClient'

export interface AccionPermisoBackend {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  modulo: string
  esFijo: boolean
}

export interface RolPermisosBackend {
  rolId: number
  nombreRol: string
  permisos: Record<string, boolean>
}

export interface MatrizPermisosBackend {
  acciones: AccionPermisoBackend[]
  roles: RolPermisosBackend[]
  ultimaModificacion?: string | null
  modificadoPorNombre?: string | null
}

export interface ActualizarRolPermisosPayload {
  rolId: number
  permisos: Record<string, boolean>
}

export interface GuardarMatrizPermisosPayload {
  roles: ActualizarRolPermisosPayload[]
}

export interface RespuestaOperacionBackend {
  mensaje: string
}

export const permisosService = {
  obtenerMatriz: () => apiFetch<MatrizPermisosBackend>('/permisos/matriz'),

  guardarMatriz: (payload: GuardarMatrizPermisosPayload) =>
    apiFetch<RespuestaOperacionBackend>('/permisos/matriz', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  restablecerValoresIniciales: () =>
    apiFetch<RespuestaOperacionBackend>('/permisos/restablecer', {
      method: 'POST',
    }),
}
