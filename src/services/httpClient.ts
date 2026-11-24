import { ENV } from '../config/env'

export class HttpError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.body = body
  }
}

let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function construirUrlApi(ruta: string): string {
  if (!ENV.API_BASE_URL) {
    throw new Error(
      'Falta la variable de entorno VITE_API_URL. Configúrala en los archivos .env.* del proyecto.',
    )
  }

  const rutaLimpia = ruta.startsWith('/') ? ruta : `/${ruta}`
  return `${ENV.API_BASE_URL}${rutaLimpia}`
}

function extraerMensaje(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Error en la solicitud'

  const candidatos = body as Record<string, unknown>

  for (const llave of ['mensaje', 'message'] as const) {
    const valor = candidatos[llave]
    if (typeof valor === 'string' && valor.trim()) return valor
  }

  if (candidatos.errors && typeof candidatos.errors === 'object') {
    const detalles = Object.values(candidatos.errors as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)

    if (detalles.length > 0) {
      return detalles.join(' ')
    }
  }

  if (typeof candidatos.title === 'string' && candidatos.title.trim()) {
    return candidatos.title
  }

  return 'Error en la solicitud'
}

export async function apiFetch<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const respuesta = await fetch(construirUrlApi(ruta), { ...init, headers })

  if (!respuesta.ok) {
    let body: unknown = null
    try {
      body = await respuesta.json()
    } catch {
      body = null
    }
    throw new HttpError(respuesta.status, extraerMensaje(body), body)
  }

  if (respuesta.status === 204) {
    return undefined as T
  }

  const texto = await respuesta.text()

  if (!texto.trim()) {
    return undefined as T
  }

  return JSON.parse(texto) as T
}
