export interface UsuarioSesion {
  id: number | string
  empleadoId: string
  nombreCompleto: string
  correo: string
  rol: string
}

export interface SesionActiva {
  token: string
  expiraEn: string
  usuario: UsuarioSesion
  guardadoEn: string
}
