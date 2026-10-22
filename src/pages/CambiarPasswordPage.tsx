import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole, LogOut, ShieldCheck } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MENSAJES } from '../config/mensajes'
import { HttpError } from '../services/httpClient'
import { useAuthStore } from '../stores/authStore'

interface ErroresCambioPassword {
  passwordActual?: string
  passwordNueva?: string
  confirmarPassword?: string
}

function esPasswordAlfanumericaValida(valor: string): boolean {
  return valor.length >= 8 && /[A-Za-z]/.test(valor) && /\d/.test(valor)
}

export function CambiarPasswordPage() {
  const navigate = useNavigate()
  const usuario = useAuthStore((estado) => estado.usuario)
  const passwordTemporalEnMemoria = useAuthStore(
    (estado) => estado.passwordTemporalEnMemoria,
  )
  const cambiarPasswordPrimerAcceso = useAuthStore(
    (estado) => estado.cambiarPasswordPrimerAcceso,
  )
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion)

  const [passwordActual, setPasswordActual] = useState(passwordTemporalEnMemoria ?? '')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [verActual, setVerActual] = useState(false)
  const [verNueva, setVerNueva] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [erroresCampo, setErroresCampo] = useState<ErroresCambioPassword>({})
  const [mensajeError, setMensajeError] = useState('')

  if (usuario && !usuario.requiereCambioPassword) {
    return <Navigate to="/dashboard" replace />
  }

  const manejarSalir = async () => {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()

    const nuevosErrores: ErroresCambioPassword = {}

    if (!passwordActual.trim()) {
      nuevosErrores.passwordActual = MENSAJES.campoObligatorio
    }

    if (!passwordNueva) {
      nuevosErrores.passwordNueva = MENSAJES.campoObligatorio
    } else if (!esPasswordAlfanumericaValida(passwordNueva)) {
      nuevosErrores.passwordNueva = MENSAJES.formatoPasswordNueva
    } else if (passwordActual && passwordNueva === passwordActual.trim()) {
      nuevosErrores.passwordNueva = MENSAJES.passwordIgualTemporal
    }

    if (!confirmarPassword) {
      nuevosErrores.confirmarPassword = MENSAJES.campoObligatorio
    } else if (passwordNueva && confirmarPassword !== passwordNueva) {
      nuevosErrores.confirmarPassword = MENSAJES.passwordsNoCoinciden
    }

    if (
      nuevosErrores.passwordActual ||
      nuevosErrores.passwordNueva ||
      nuevosErrores.confirmarPassword
    ) {
      setErroresCampo(nuevosErrores)
      setMensajeError('')
      return
    }

    setErroresCampo({})
    setMensajeError('')
    setGuardando(true)

    try {
      await cambiarPasswordPrimerAcceso(passwordNueva, passwordActual.trim())
      navigate('/dashboard', { replace: true })
    } catch (error) {
      if (error instanceof HttpError && error.message.trim()) {
        setMensajeError(error.message.trim())
      } else if (error instanceof Error && error.message.trim()) {
        setMensajeError(error.message.trim())
      } else {
        setMensajeError(MENSAJES.errorCambiarPassword)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <header className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 p-3.5 text-white shadow-md">
              <KeyRound className="h-7 w-7" aria-hidden="true" />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              PRIMER ACCESO · AUTOSTOCK
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Actualiza tu contraseña
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {usuario?.nombreCompleto
                ? `Hola, ${usuario.nombreCompleto}. Por seguridad debes crear una contraseña personal antes de continuar al Menú Principal.`
                : 'Por seguridad debes reemplazar tu contraseña temporal antes de continuar.'}
            </p>
          </header>

          <form onSubmit={manejarEnvio} noValidate aria-busy={guardando} className="space-y-4">
            <div>
              <label
                htmlFor="password-actual"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Contraseña temporal actual{' '}
                <span className="text-red-600" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password-actual"
                  name="passwordActual"
                  type={verActual ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Contraseña temporal recibida"
                  value={passwordActual}
                  onChange={(evento) => {
                    setPasswordActual(evento.target.value)
                    setErroresCampo((prev) => ({ ...prev, passwordActual: undefined }))
                  }}
                  disabled={guardando}
                  aria-invalid={Boolean(erroresCampo.passwordActual)}
                  aria-describedby={
                    erroresCampo.passwordActual ? 'password-actual-error' : undefined
                  }
                  className={`campo-base pl-11 pr-12 ${
                    erroresCampo.passwordActual ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVerActual((valor) => !valor)}
                  aria-pressed={verActual}
                  aria-label={
                    verActual ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'
                  }
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {verActual ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {erroresCampo.passwordActual && (
                <p
                  id="password-actual-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {erroresCampo.passwordActual}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password-nueva"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Nueva contraseña{' '}
                <span className="text-red-600" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password-nueva"
                  name="passwordNueva"
                  type={verNueva ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres, letras y números"
                  value={passwordNueva}
                  onChange={(evento) => {
                    setPasswordNueva(evento.target.value)
                    setErroresCampo((prev) => ({ ...prev, passwordNueva: undefined }))
                  }}
                  disabled={guardando}
                  aria-invalid={Boolean(erroresCampo.passwordNueva)}
                  aria-describedby={
                    erroresCampo.passwordNueva ? 'password-nueva-error' : 'password-nueva-ayuda'
                  }
                  className={`campo-base pl-11 pr-12 ${
                    erroresCampo.passwordNueva ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVerNueva((valor) => !valor)}
                  aria-pressed={verNueva}
                  aria-label={verNueva ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {verNueva ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {erroresCampo.passwordNueva ? (
                <p
                  id="password-nueva-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {erroresCampo.passwordNueva}
                </p>
              ) : (
                <p id="password-nueva-ayuda" className="mt-1.5 text-xs text-slate-500">
                  Debe tener al menos 8 caracteres, combinar letras y números y ser distinta de la temporal.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmar-password"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Confirmar nueva contraseña{' '}
                <span className="text-red-600" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="confirmar-password"
                  name="confirmarPassword"
                  type={verConfirmar ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repite la nueva contraseña"
                  value={confirmarPassword}
                  onChange={(evento) => {
                    setConfirmarPassword(evento.target.value)
                    setErroresCampo((prev) => ({ ...prev, confirmarPassword: undefined }))
                  }}
                  disabled={guardando}
                  aria-invalid={Boolean(erroresCampo.confirmarPassword)}
                  aria-describedby={
                    erroresCampo.confirmarPassword ? 'confirmar-password-error' : undefined
                  }
                  className={`campo-base pl-11 pr-12 ${
                    erroresCampo.confirmarPassword ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVerConfirmar((valor) => !valor)}
                  aria-pressed={verConfirmar}
                  aria-label={
                    verConfirmar
                      ? 'Ocultar confirmación de contraseña'
                      : 'Mostrar confirmación de contraseña'
                  }
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {verConfirmar ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {erroresCampo.confirmarPassword && (
                <p
                  id="confirmar-password-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {erroresCampo.confirmarPassword}
                </p>
              )}
            </div>

            {mensajeError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {mensajeError}
              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Guardando contraseña...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  Guardar contraseña y continuar
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void manejarSalir()}
              disabled={guardando}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
