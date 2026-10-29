export interface UsuarioSesion {
  id: number | string
  empleadoId: string
  nombreCompleto: string
  correo: string
  fechaNacimiento?: string
  rol: string
  requiereCambioPassword: boolean
}

export type Usuario = UsuarioSesion

export interface LoginResponse {
  token: string
  expiraEn: string
  requiereCambioPassword: boolean
  usuario: UsuarioSesion
}

export interface SesionActiva {
  token: string
  expiraEn: string
  usuario: UsuarioSesion
  guardadoEn: string
}
