import { apiFetch } from './httpClient'

export interface UsuarioLoginBackend {
  id: number | string
  empleadoId: string
  nombreCompleto: string
  correo: string
  rol: string
  permisos?: string[]
  requiereCambioPassword?: boolean
}

export interface RespuestaLoginBackend {
  token: string
  expiraEn: string
  requiereCambioPassword: boolean
  usuario: UsuarioLoginBackend
}

export interface PerfilBackend extends UsuarioLoginBackend {
  activo: boolean
  fechaCreacion: string
}

export interface RespuestaLogoutBackend {
  mensaje: string
}

export interface RespuestaCambioPasswordBackend {
  mensaje: string
}

export const authService = {
  iniciarSesion: (identificador: string, password: string) =>
    apiFetch<RespuestaLoginBackend>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identificador, password }),
    }),

  cerrarSesion: () =>
    apiFetch<RespuestaLogoutBackend>('/auth/logout', {
      method: 'POST',
    }),

  obtenerPerfil: () => apiFetch<PerfilBackend>('/auth/perfil'),

  cambiarPassword: (passwordActual: string, passwordNueva: string) =>
    apiFetch<RespuestaCambioPasswordBackend>('/auth/cambiar-password', {
      method: 'POST',
      body: JSON.stringify({ passwordActual, passwordNueva }),
    }),
}
