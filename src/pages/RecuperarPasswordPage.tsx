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
import { SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { authService } from '../services/authService'
import { HttpError } from '../services/httpClient'

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
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <section className="w-full max-w-md">
        <SpotlightCard thickness="thick" className="p-6 sm:p-8 shadow-2xl">
          {/* Encabezado */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-lg ring-2 ring-white/25 mb-3">
              <Car className="h-8 w-8" aria-hidden="true" />
            </div>
            <SplitTitle text="AutoStock" className="text-xl font-black" />
            <h2 className="mt-2 text-base font-bold" style={{ color: 'var(--ink)' }}>
              Recuperar mi contraseña
            </h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>
              Ingresa el correo registrado con tu cuenta para recibir un enlace de restablecimiento.
            </p>
          </div>

          {!navigator.onLine && (
            <div
              role="alert"
              className="v-glass tone--orange mb-5 flex items-center gap-2 rounded-2xl p-3.5 text-xs font-semibold"
              style={{ color: 'var(--ink)' }}
            >
              <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Se requiere conexión a internet para continuar.</span>
            </div>
          )}

          {errorGlobal && (
            <div
              role="alert"
              className="v-glass tone--coral mb-5 flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-semibold"
              style={{ color: 'var(--ink)' }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div>
                <p className="font-bold">Atención</p>
                <p className="mt-0.5 text-rose-300">{errorGlobal}</p>
              </div>
            </div>
          )}

          {enviadoExitoso ? (
            /* Vista de confirmación (CA 2, CA 3) */
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black" style={{ color: 'var(--ink)' }}>
                  Solicitud enviada
                </h3>
                <p
                  className="text-xs font-medium leading-relaxed"
                  style={{ color: 'var(--ink-2)' }}
                >
                  {mensajeRespuesta}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  El enlace es de un solo uso y vencerá en 30 minutos.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="btn-squish flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
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
                  className="mb-1 block text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--ink-2)' }}
                >
                  Correo electrónico <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400"
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
                    className={`campo-base pl-11 pr-3.5 py-2.5 text-sm font-semibold ${
                      errorCorreo ? 'campo-invalido' : 'campo-valido'
                    }`}
                  />
                </div>
                {errorCorreo && (
                  <p
                    role="alert"
                    className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorCorreo}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="btn-squish flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Regresar al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </SpotlightCard>

        <p className="mt-6 text-center text-xs font-semibold" style={{ color: 'var(--ink-3)' }}>
          AutoStock · Sistema de Gestión de Inventario para Concesionarias
        </p>
      </section>
    </main>
  )
}
