export interface UsuarioSesion {
  id: number | string
  empleadoId: string
  nombreCompleto: string
  correo: string
  fechaNacimiento?: string
  rol: string
  permisos?: string[]
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

export interface SolicitarRecuperacionPayload {
  correo: string
}

export interface SolicitarRecuperacionRespuesta {
  mensaje: string
  tokenDev?: string
}

export interface ValidarTokenRespuesta {
  esValido: boolean
  mensaje: string
  correoEnmascarado?: string
}

export interface RestablecerPasswordPayload {
  token: string
  passwordNueva: string
  confirmarPassword: string
}
