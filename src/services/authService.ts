import { apiFetch } from './httpClient'

export interface UsuarioLoginBackend {
  id: number | string
  empleadoId: string
  nombreCompleto: string
  correo: string
  rol: string
}

export interface RespuestaLoginBackend {
  token: string
  expiraEn: string
  usuario: UsuarioLoginBackend
}

export interface PerfilBackend extends UsuarioLoginBackend {
  activo: boolean
  fechaCreacion: string
}

export interface RespuestaLogoutBackend {
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
}
