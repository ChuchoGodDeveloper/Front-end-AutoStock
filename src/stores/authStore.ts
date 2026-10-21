import { create } from 'zustand'
import { MENSAJES } from '../config/mensajes'
import { authService, type RespuestaLoginBackend } from '../services/authService'
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
  hidratarSesion: () => Promise<boolean>
  iniciarSesion: (credencial: string, password: string) => Promise<UsuarioSesion>
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

function construirUsuarioDesdeLogin(
  respuesta: RespuestaLoginBackend,
  credencial: string,
  claims: Record<string, unknown>,
): UsuarioSesion {
  const esCorreo = credencial.includes('@')
  const nombreSugerido = esCorreo ? (credencial.split('@')[0] ?? credencial) : credencial

  return {
    id: comoTexto(respuesta.id) || comoTexto(claims.sub) || comoTexto(claims.id) || credencial,
    empleadoId:
      comoTexto(respuesta.empleadoId) ||
      comoTexto(claims.empleadoId) ||
      (esCorreo ? '' : credencial),
    nombreCompleto:
      comoTexto(respuesta.nombreCompleto) ||
      comoTexto(claims.nombreCompleto) ||
      nombreSugerido,
    correo:
      comoTexto(respuesta.correo) || comoTexto(claims.correo) || (esCorreo ? credencial : ''),
    rol: comoTexto(respuesta.rol) || comoTexto(claims.rol) || 'Usuario',
  }
}

function construirSesionDesdeLogin(
  respuesta: RespuestaLoginBackend,
  credencial: string,
): SesionActiva {
  const ahora = Date.now()
  const claims = decodificarPayloadJwt(respuesta.token)

  return {
    token: respuesta.token,
    expiraEn: new Date(ahora + DURACION_SESION_HORAS * MILISEGUNDOS_POR_HORA).toISOString(),
    usuario: construirUsuarioDesdeLogin(respuesta, credencial, claims),
    guardadoEn: new Date(ahora).toISOString(),
  }
}

function traducirErrorSesion(error: unknown): Error {
  if (error instanceof HttpError) {
    switch (error.status) {
      case 401:
        return new Error(MENSAJES.credencialesIncorrectas)
      case 403:
        return new Error(MENSAJES.cuentaDesactivada)
      case 423:
        return new Error(MENSAJES.cuentaBloqueada)
      default:
        return new Error(error.message || MENSAJES.errorInesperado)
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

  hidratarSesion: async () => {
    const sesionGuardada = await leerSesion()

    if (esSesionVigente(sesionGuardada)) {
      setAccessToken(sesionGuardada.token)
      set({
        token: sesionGuardada.token,
        usuario: sesionGuardada.usuario,
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
    })
    return false
  },

  iniciarSesion: async (credencial, password) => {
    if (!hayConexion()) {
      throw new Error(MENSAJES.sinConexionLogin)
    }

    set({ iniciandoSesion: true })

    try {
      const respuesta = await authService.iniciarSesion(credencial, password)
      const sesion = construirSesionDesdeLogin(respuesta, credencial)

      setAccessToken(sesion.token)
      await guardarSesion(sesion)

      set({
        token: sesion.token,
        usuario: sesion.usuario,
        expiraEn: sesion.expiraEn,
        estaAutenticado: true,
        sesionCargada: true,
      })

      return sesion.usuario
    } catch (error) {
      throw traducirErrorSesion(error)
    } finally {
      set({ iniciandoSesion: false })
    }
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
    })
  },
}))
