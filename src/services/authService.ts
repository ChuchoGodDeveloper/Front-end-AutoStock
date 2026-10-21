import { apiFetch } from './httpClient'

export interface RespuestaLoginBackend {
  token: string
  nombreCompleto?: string
  rol?: string
  correo?: string
  id?: string | number
  empleadoId?: string
  requiereCambioPassword?: boolean
}

export const authService = {
  iniciarSesion: (credencial: string, password: string) =>
    apiFetch<RespuestaLoginBackend>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ credencial, password }),
    }),

  cerrarSesion: () =>
    apiFetch<void>('/auth/logout', {
      method: 'POST',
    }),
}
