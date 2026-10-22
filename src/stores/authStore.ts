import { create } from 'zustand'
import { MENSAJES } from '../config/mensajes'
import { authService, type PerfilBackend, type RespuestaLoginBackend } from '../services/authService'
import { HttpError, setAccessToken } from '../services/httpClient'
import {
  borrarSesion,
  esSesionVigente,
  guardarSesion,
  leerSesion,
} from '../services/sessionDb'
import type { SesionActiva, UsuarioSesion } from '../types/sesion'

export const DURACION_SESION_HORAS = 8
const MILISEGUNDOS_POR_HORA = 60 * 60 * 1000

interface EstadoAuth {
  token: string | null
  usuario: UsuarioSesion | null
  expiraEn: string | null
  estaAutenticado: boolean
  sesionCargada: boolean
  iniciandoSesion: boolean
  passwordTemporalEnMemoria: string | null
  hidratarSesion: () => Promise<boolean>
  iniciarSesion: (identificador: string, password: string) => Promise<UsuarioSesion>
  actualizarUsuario: (usuario: UsuarioSesion) => Promise<void>
  cambiarPasswordPrimerAcceso: (passwordNueva: string, passwordActual?: string) => Promise<void>
  cerrarSesion: () => Promise<void>
}

function comoTexto(valor: unknown): string {
  if (typeof valor === 'string') return valor.trim()
  if (typeof valor === 'number') return String(valor)
  return ''
}

function decodificarPayloadJwt(token: string): Record<string, unknown> {
  try {
    const partes = token.split('.')
    if (partes.length < 2) return {}

    const payload = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const base64 = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((caracter) => `%${`00${caracter.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )

    const datos = JSON.parse(json) as unknown
    return datos && typeof datos === 'object' ? (datos as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function expiracionLocalDeRespuesta(valor: unknown): string {
  const fecha = new Date(typeof valor === 'string' || typeof valor === 'number' ? valor : '')
  const tiempo = fecha.getTime()

  if (Number.isFinite(tiempo) && tiempo > Date.now()) {
    return fecha.toISOString()
  }

  return new Date(Date.now() + DURACION_SESION_HORAS * MILISEGUNDOS_POR_HORA).toISOString()
}

function construirUsuarioDesdeLogin(
  respuesta: RespuestaLoginBackend,
  identificador: string,
  claims: Record<string, unknown>,
): UsuarioSesion {
  const usuario = respuesta.usuario
  const esCorreo = identificador.includes('@')
  const nombreSugerido = esCorreo ? (identificador.split('@')[0] ?? identificador) : identificador

  return {
    id: usuario?.id ?? comoTexto(claims.sub) ?? identificador,
    empleadoId:
      usuario?.empleadoId || comoTexto(claims.empleadoId) || (esCorreo ? '' : identificador),
    nombreCompleto: usuario?.nombreCompleto || comoTexto(claims.nombre) || nombreSugerido,
    correo: usuario?.correo || comoTexto(claims.email) || (esCorreo ? identificador : ''),
    rol: usuario?.rol || comoTexto(claims.role) || 'Usuario',
    requiereCambioPassword: Boolean(
      respuesta.requiereCambioPassword ?? usuario?.requiereCambioPassword ?? false,
    ),
  }
}

function construirSesionDesdeLogin(
  respuesta: RespuestaLoginBackend,
  identificador: string,
): SesionActiva {
  const ahora = Date.now()
  const claims = decodificarPayloadJwt(respuesta.token)

  return {
    token: respuesta.token,
    expiraEn: expiracionLocalDeRespuesta(respuesta.expiraEn),
    usuario: construirUsuarioDesdeLogin(respuesta, identificador, claims),
    guardadoEn: new Date(ahora).toISOString(),
  }
}

function traducirErrorSesion(error: unknown): Error {
  if (error instanceof HttpError) {
    const mensajeServidor = error.message.trim()

    switch (error.status) {
      case 400:
        return new Error(mensajeServidor || MENSAJES.errorInesperado)
      case 401:
        return new Error(mensajeServidor || MENSAJES.credencialesIncorrectas)
      case 403:
        return new Error(mensajeServidor || MENSAJES.cuentaDesactivada)
      case 423:
        return new Error(mensajeServidor || MENSAJES.cuentaBloqueada)
      default:
        return new Error(mensajeServidor || MENSAJES.errorInesperado)
    }
  }

  if (error instanceof TypeError) {
    return new Error(MENSAJES.sinConexionLogin)
  }

  if (error instanceof Error && error.message) {
    return error
  }

  return new Error(MENSAJES.errorInesperado)
}

function hayConexion(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export const useAuthStore = create<EstadoAuth>()((set, get) => ({
  token: null,
  usuario: null,
  expiraEn: null,
  estaAutenticado: false,
  sesionCargada: false,
  iniciandoSesion: false,
  passwordTemporalEnMemoria: null,

  hidratarSesion: async () => {
    const sesionGuardada = await leerSesion()

    if (esSesionVigente(sesionGuardada)) {
      const usuarioHidratado: UsuarioSesion = {
        ...sesionGuardada.usuario,
        requiereCambioPassword: Boolean(sesionGuardada.usuario.requiereCambioPassword),
      }
      setAccessToken(sesionGuardada.token)
      set({
        token: sesionGuardada.token,
        usuario: usuarioHidratado,
        expiraEn: sesionGuardada.expiraEn,
        estaAutenticado: true,
        sesionCargada: true,
      })
      return true
    }

    if (sesionGuardada) {
      await borrarSesion()
    }

    setAccessToken(null)
    set({
      token: null,
      usuario: null,
      expiraEn: null,
      estaAutenticado: false,
      sesionCargada: true,
      passwordTemporalEnMemoria: null,
    })
    return false
  },

  iniciarSesion: async (identificador, password) => {
    if (!hayConexion()) {
      throw new Error(MENSAJES.sinConexionLogin)
    }

    set({ iniciandoSesion: true })

    try {
      const respuesta = await authService.iniciarSesion(identificador, password)
      const sesion = construirSesionDesdeLogin(respuesta, identificador)

      setAccessToken(sesion.token)
      await guardarSesion(sesion)

      set({
        token: sesion.token,
        usuario: sesion.usuario,
        expiraEn: sesion.expiraEn,
        estaAutenticado: true,
        sesionCargada: true,
        passwordTemporalEnMemoria: sesion.usuario.requiereCambioPassword ? password : null,
      })

      return sesion.usuario
    } catch (error) {
      throw traducirErrorSesion(error)
    } finally {
      set({ iniciandoSesion: false })
    }
  },

  actualizarUsuario: async (usuario) => {
    const { token, expiraEn, usuario: actual } = get()

    if (!token) return

    const usuarioConservado: UsuarioSesion = {
      ...usuario,
      requiereCambioPassword: Boolean(
        usuario.requiereCambioPassword ?? actual?.requiereCambioPassword ?? false,
      ),
    }

    set({ usuario: usuarioConservado })
    await guardarSesion({
      token,
      expiraEn: expiraEn ?? expiracionLocalDeRespuesta(null),
      usuario: usuarioConservado,
      guardadoEn: new Date().toISOString(),
    })
  },

  cambiarPasswordPrimerAcceso: async (passwordNueva, passwordActual) => {
    const { token, expiraEn, usuario, passwordTemporalEnMemoria } = get()

    if (!token || !usuario) {
      throw new Error(MENSAJES.accesoRestringido)
    }

    const actual = (passwordActual ?? passwordTemporalEnMemoria ?? '').trim()
    await authService.cambiarPassword(actual, passwordNueva)

    const usuarioActualizado: UsuarioSesion = {
      ...usuario,
      requiereCambioPassword: false,
    }

    set({
      usuario: usuarioActualizado,
      passwordTemporalEnMemoria: null,
    })
    await guardarSesion({
      token,
      expiraEn: expiraEn ?? expiracionLocalDeRespuesta(null),
      usuario: usuarioActualizado,
      guardadoEn: new Date().toISOString(),
    })
  },

  cerrarSesion: async () => {
    const { token } = get()

    if (token && hayConexion()) {
      try {
        await authService.cerrarSesion()
      } catch {
        // El aviso al servidor es best-effort: la sesión local se elimina igual.
      }
    }

    await borrarSesion()
    setAccessToken(null)
    set({
      token: null,
      usuario: null,
      expiraEn: null,
      estaAutenticado: false,
      sesionCargada: true,
      passwordTemporalEnMemoria: null,
    })
  },
}))

export function usuarioDesdePerfil(
  perfil: PerfilBackend,
  requiereCambioPasswordActual = false,
): UsuarioSesion {
  return {
    id: perfil.id,
    empleadoId: perfil.empleadoId,
    nombreCompleto: perfil.nombreCompleto,
    correo: perfil.correo,
    rol: perfil.rol,
    requiereCambioPassword: Boolean(
      perfil.requiereCambioPassword ?? requiereCambioPasswordActual,
    ),
  }
}
