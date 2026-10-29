import { apiFetch } from './httpClient'

export interface UsuarioBackend {
  id: number
  nombreCompleto: string
  empleadoId: string
  correo: string
  fechaNacimiento?: string
  rol: string
  activo: boolean
}

export interface UsuarioDetalleBackend extends UsuarioBackend {
  rolId: number
  fechaCreacion?: string
  requiereCambioPassword: boolean
}

export interface CrearUsuarioBackend {
  empleadoId?: string
  nombreCompleto: string
  correo: string
  fechaNacimiento: string
  rolId: number
}

export interface EditarUsuarioPayload {
  nombreCompleto: string
  correo: string
  rol: string
  fechaNacimiento?: string
}

export interface UsuarioCreadoBackend extends UsuarioBackend {
  requiereCambioPassword: boolean
  passwordTemporal: string
}

export interface PasswordTemporalRestablecidaBackend {
  id: number
  empleadoId: string
  nombreCompleto: string
  passwordTemporal: string
}

export const usuariosService = {
  obtenerUsuarios: () => apiFetch<UsuarioBackend[]>('/usuarios'),

  obtenerUsuarioPorId: (id: number) => apiFetch<UsuarioDetalleBackend>(`/usuarios/${id}`),

  crearUsuario: (datos: CrearUsuarioBackend) =>
    apiFetch<UsuarioCreadoBackend>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  editarUsuario: (id: number, datos: EditarUsuarioPayload) =>
    apiFetch<UsuarioBackend>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  cambiarEstatusUsuario: (id: number, activo: boolean) =>
    apiFetch<UsuarioBackend>(`/usuarios/${id}/estatus`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    }),

  restablecerPassword: (id: number) =>
    apiFetch<PasswordTemporalRestablecidaBackend>(`/usuarios/${id}/restablecer-password`, {
      method: 'POST',
    }),
}
