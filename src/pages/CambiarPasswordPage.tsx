import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole, LogOut, ShieldCheck } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { SplitTitle, SpotlightCard } from '../components/LiquidUI'
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
    <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md">
        <SpotlightCard thickness="thick" className="p-6 shadow-2xl sm:p-8">
          <header className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 p-3.5 text-white shadow-lg ring-2 ring-white/25">
              <KeyRound className="h-7 w-7" aria-hidden="true" />
            </div>

            <p
              className="text-xs font-extrabold uppercase tracking-[0.2em]"
              style={{ color: 'var(--champagne)' }}
            >
              PRIMER ACCESO · AUTOSTOCK
            </p>
            <SplitTitle
              text="Actualiza tu contraseña"
              className="mt-1 text-2xl font-black"
            />

            <p className="mt-2 text-sm" style={{ color: 'var(--ink-2)' }}>
              {usuario?.nombreCompleto
                ? `Hola, ${usuario.nombreCompleto}. Por seguridad debes crear una contraseña personal antes de continuar al Menú Principal.`
                : 'Por seguridad debes reemplazar tu contraseña temporal antes de continuar.'}
            </p>
          </header>

          <form onSubmit={manejarEnvio} noValidate aria-busy={guardando} className="space-y-4">
            <div>
              <label
                htmlFor="password-actual"
                className="mb-1.5 block text-sm font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                Contraseña temporal actual{' '}
                <span className="text-rose-400" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative flex items-center">
                <LockKeyhole
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-sky-400"
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
                  className={`campo-base pl-10 pr-10 ${
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
                  className="absolute right-3.5 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-lg p-1 hover:bg-white/10"
                  style={{ color: 'var(--ink-2)' }}
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
                  className="mt-1.5 text-sm font-medium text-rose-400"
                >
                  {erroresCampo.passwordActual}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password-nueva"
                className="mb-1.5 block text-sm font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                Nueva contraseña{' '}
                <span className="text-rose-400" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative flex items-center">
                <LockKeyhole
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-sky-400"
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
                  className={`campo-base pl-10 pr-10 ${
                    erroresCampo.passwordNueva ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVerNueva((valor) => !valor)}
                  aria-pressed={verNueva}
                  aria-label={verNueva ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                  className="absolute right-3.5 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-lg p-1 hover:bg-white/10"
                  style={{ color: 'var(--ink-2)' }}
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
                  className="mt-1.5 text-sm font-medium text-rose-400"
                >
                  {erroresCampo.passwordNueva}
                </p>
              ) : (
                <p
                  id="password-nueva-ayuda"
                  className="mt-1.5 text-xs"
                  style={{ color: 'var(--ink-2)' }}
                >
                  Debe tener al menos 8 caracteres, combinar letras y números y ser distinta de la temporal.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmar-password"
                className="mb-1.5 block text-sm font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                Confirmar nueva contraseña{' '}
                <span className="text-rose-400" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative flex items-center">
                <LockKeyhole
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-sky-400"
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
                  className={`campo-base pl-10 pr-10 ${
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
                  className="absolute right-3.5 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-lg p-1 hover:bg-white/10"
                  style={{ color: 'var(--ink-2)' }}
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
                  className="mt-1.5 text-sm font-medium text-rose-400"
                >
                  {erroresCampo.confirmarPassword}
                </p>
              )}
            </div>

            {mensajeError && (
              <div
                role="alert"
                className="v-glass tone--coral rounded-xl px-4 py-3 text-sm font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                {mensajeError}
              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="btn-squish flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3.5 text-base font-extrabold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="v-glass btn-squish flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60"
              style={{ color: 'var(--ink)' }}
            >
              <LogOut className="h-4 w-4 text-rose-400" aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </SpotlightCard>
      </section>
    </main>
  )
}
