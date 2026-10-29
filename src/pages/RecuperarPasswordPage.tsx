import { useState, type FormEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Car,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  WifiOff,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { HttpError } from '../services/httpClient'
import { authService } from '../services/authService'

export function RecuperarPasswordPage() {
  const [correo, setCorreo] = useState('')
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviadoExitoso, setEnviadoExitoso] = useState(false)
  const [mensajeRespuesta, setMensajeRespuesta] = useState('')

  const validarFormatoCorreo = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault()
    setErrorCorreo(null)
    setErrorGlobal(null)

    if (!navigator.onLine) {
      setErrorGlobal(
        'Se requiere conexión a internet para solicitar el restablecimiento de contraseña.',
      )
      return
    }

    const correoLimpio = correo.trim()

    if (!correoLimpio) {
      setErrorCorreo('El correo electrónico es obligatorio')
      return
    }

    if (!validarFormatoCorreo(correoLimpio)) {
      setErrorCorreo('Ingresa un correo electrónico válido')
      return
    }

    setEnviando(true)

    try {
      const respuesta = await authService.solicitarRecuperacionPassword(correoLimpio)
      setMensajeRespuesta(
        respuesta.mensaje ||
          'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña',
      )
      setEnviadoExitoso(true)
    } catch (err) {
      if (err instanceof HttpError) {
        setErrorGlobal(err.message)
      } else if (err instanceof Error) {
        setErrorGlobal(err.message)
      } else {
        setErrorGlobal('Ocurrió un error al procesar tu solicitud. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <section className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          {/* Encabezado */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md mb-3">
              <Car className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-black text-slate-900">AutoStock</h1>
            <h2 className="mt-2 text-base font-bold text-slate-800">
              Recuperar mi contraseña
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Ingresa el correo registrado con tu cuenta para recibir un enlace de restablecimiento.
            </p>
          </div>

          {!navigator.onLine && (
            <div
              role="alert"
              className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-900"
            >
              <WifiOff className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Se requiere conexión a internet para continuar.</span>
            </div>
          )}

          {errorGlobal && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="font-bold">Atención</p>
                <p className="mt-0.5 text-red-700">{errorGlobal}</p>
              </div>
            </div>
          )}

          {enviadoExitoso ? (
            /* Vista de confirmación (CA 2, CA 3) */
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900">
                  Solicitud enviada
                </h3>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  {mensajeRespuesta}
                </p>
                <p className="text-[11px] text-slate-400">
                  El enlace es de un solo uso y vencerá en 30 minutos.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Regresar al inicio de sesión
                </Link>
              </div>
            </div>
          ) : (
            /* Formulario para capturar correo (CA 1, CA 4) */
            <form onSubmit={manejarEnvio} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="correo-recuperacion"
                  className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="correo-recuperacion"
                    name="correo"
                    type="email"
                    autoComplete="email"
                    disabled={enviando}
                    value={correo}
                    onChange={(e) => {
                      setCorreo(e.target.value)
                      setErrorCorreo(null)
                      setErrorGlobal(null)
                    }}
                    placeholder="ejemplo@autostock.com"
                    className={`w-full rounded-xl border pl-11 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs transition focus:outline-none focus:ring-2 ${
                      errorCorreo
                        ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                </div>
                {errorCorreo && (
                  <p
                    role="alert"
                    className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-600"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorCorreo}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Enviando enlace...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Enviar enlace
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Regresar al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          AutoStock · Sistema de Gestión de Inventario para Concesionarias
        </p>
      </section>
    </main>
  )
}
