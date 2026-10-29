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

export interface CrearUsuarioBackend {
  empleadoId?: string
  nombreCompleto: string
  correo: string
  fechaNacimiento: string
  rolId: number
}

export interface UsuarioCreadoBackend extends UsuarioBackend {
  requiereCambioPassword: boolean
  passwordTemporal: string
}

export const usuariosService = {
  obtenerUsuarios: () => apiFetch<UsuarioBackend[]>('/usuarios'),

  crearUsuario: (datos: CrearUsuarioBackend) =>
    apiFetch<UsuarioCreadoBackend>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
}
