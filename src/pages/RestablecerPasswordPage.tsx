import { useEffect, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Car,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
  X,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { HttpError } from '../services/httpClient'
import { authService } from '../services/authService'

export function RestablecerPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [validandoToken, setValidandoToken] = useState(true)
  const [tokenValido, setTokenValido] = useState(false)
  const [correoEnmascarado, setCorreoEnmascarado] = useState<string | null>(null)
  const [mensajeInvalido, setMensajeInvalido] = useState<string | null>(null)

  const [passwordNueva, setPasswordNueva] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false)

  const [errorPassword, setErrorPassword] = useState<string | null>(null)
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | null>(null)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Validar vigencia del token al cargar la página
  useEffect(() => {
    if (!token.trim()) {
      setValidandoToken(false)
      setTokenValido(false)
      setMensajeInvalido('El enlace ya no es válido')
      return
    }

    setValidandoToken(true)
    void authService
      .validarTokenRecuperacion(token)
      .then((res) => {
        if (res.esValido) {
          setTokenValido(true)
          setCorreoEnmascarado(res.correoEnmascarado ?? null)
        } else {
          setTokenValido(false)
          setMensajeInvalido(res.mensaje || 'El enlace ya no es válido')
        }
      })
      .catch((err) => {
        setTokenValido(false)
        if (err instanceof HttpError) {
          setMensajeInvalido(err.message || 'El enlace ya no es válido')
        } else {
          setMensajeInvalido('El enlace ya no es válido')
        }
      })
      .finally(() => {
        setValidandoToken(false)
      })
  }, [token])

  // Reglas de validación reactivas
  const tieneLongitud = passwordNueva.length >= 8
  const tieneLetra = /[a-zA-Z]/.test(passwordNueva)
  const tieneNumero = /\d/.test(passwordNueva)
  const coinciden =
    passwordNueva.length > 0 &&
    confirmarPassword.length > 0 &&
    passwordNueva === confirmarPassword

  const manejarGuardar = async (e: FormEvent) => {
    e.preventDefault()
    setErrorPassword(null)
    setErrorConfirmacion(null)
    setErrorGlobal(null)

    let hayErrores = false

    if (!passwordNueva) {
      setErrorPassword('La nueva contraseña es obligatoria')
      hayErrores = true
    } else if (!tieneLongitud || !tieneLetra || !tieneNumero) {
      setErrorPassword(
        'La nueva contraseña debe tener al menos 8 caracteres, con letras y números',
      )
      hayErrores = true
    }

    if (!confirmarPassword) {
      setErrorConfirmacion('Confirma tu nueva contraseña')
      hayErrores = true
    } else if (passwordNueva !== confirmarPassword) {
      setErrorConfirmacion('Las contraseñas no coinciden')
      hayErrores = true
    }

    if (hayErrores) return

    setGuardando(true)

    try {
      await authService.restablecerPassword({
        token,
        passwordNueva,
        confirmarPassword,
      })

      // Redirigir al login con mensaje de éxito (CA 6)
      navigate('/login', {
        replace: true,
        state: { mensajeExito: 'Contraseña actualizada' },
      })
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.message.includes('enlace ya no es válido')) {
          setTokenValido(false)
          setMensajeInvalido('El enlace ya no es válido')
        } else {
          setErrorGlobal(err.message)
        }
      } else if (err instanceof Error) {
        setErrorGlobal(err.message)
      } else {
        setErrorGlobal('Ocurrió un error al actualizar la contraseña. Intenta nuevamente.')
      }
    } finally {
      setGuardando(false)
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
              Crear nueva contraseña
            </h2>
            {correoEnmascarado && (
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Cuenta: <strong className="text-slate-800">{correoEnmascarado}</strong>
              </p>
            )}
          </div>

          {validandoToken ? (
            /* Estado de carga verificando el enlace */
            <div className="py-8 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-slate-500">
                Verificando la validez del enlace...
              </p>
            </div>
          ) : !tokenValido ? (
            /* Enlace vencido o ya usado (CA 8) */
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
                <AlertTriangle className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900">
                  {mensajeInvalido || 'El enlace ya no es válido'}
                </h3>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Este enlace de recuperación ha expirado, ya fue utilizado o fue invalidado
                  por una nueva solicitud.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/recuperar-password"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Solicitar un nuevo enlace
                </Link>
              </div>

              <div className="pt-1">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          ) : (
            /* Formulario para restablecer contraseña (CA 5, CA 6, CA 7) */
            <form onSubmit={manejarGuardar} noValidate className="space-y-4">
              {errorGlobal && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-900"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div>
                    <p className="font-bold">Error</p>
                    <p className="mt-0.5 text-red-700">{errorGlobal}</p>
                  </div>
                </div>
              )}

              {/* Campo: Nueva contraseña */}
              <div>
                <label
                  htmlFor="input-password-nueva"
                  className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Nueva contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="input-password-nueva"
                    type={verPassword ? 'text' : 'password'}
                    disabled={guardando}
                    value={passwordNueva}
                    onChange={(e) => {
                      setPasswordNueva(e.target.value)
                      setErrorPassword(null)
                      setErrorGlobal(null)
                    }}
                    placeholder="Al menos 8 caracteres"
                    className={`w-full rounded-xl border pl-11 pr-11 py-2.5 text-sm font-semibold text-slate-900 shadow-xs transition focus:outline-none focus:ring-2 ${
                      errorPassword
                        ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errorPassword && (
                  <p
                    role="alert"
                    className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-600"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorPassword}</span>
                  </p>
                )}
              </div>

              {/* Campo: Confirmar contraseña */}
              <div>
                <label
                  htmlFor="input-confirmar-password"
                  className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Confirmar contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="input-confirmar-password"
                    type={verConfirmarPassword ? 'text' : 'password'}
                    disabled={guardando}
                    value={confirmarPassword}
                    onChange={(e) => {
                      setConfirmarPassword(e.target.value)
                      setErrorConfirmacion(null)
                      setErrorGlobal(null)
                    }}
                    placeholder="Repite la contraseña"
                    className={`w-full rounded-xl border pl-11 pr-11 py-2.5 text-sm font-semibold text-slate-900 shadow-xs transition focus:outline-none focus:ring-2 ${
                      errorConfirmacion
                        ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setVerConfirmarPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={
                      verConfirmarPassword
                        ? 'Ocultar confirmación'
                        : 'Ver confirmación'
                    }
                  >
                    {verConfirmarPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errorConfirmacion && (
                  <p
                    role="alert"
                    className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-600"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorConfirmacion}</span>
                  </p>
                )}
              </div>

              {/* Checklist de requisitos de seguridad */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 text-xs">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                  Requisitos de la contraseña:
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {tieneLongitud ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span
                      className={
                        tieneLongitud
                          ? 'font-bold text-emerald-800'
                          : 'text-slate-500 font-medium'
                      }
                    >
                      Mínimo 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tieneLetra ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span
                      className={
                        tieneLetra
                          ? 'font-bold text-emerald-800'
                          : 'text-slate-500 font-medium'
                      }
                    >
                      Al menos una letra
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tieneNumero ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span
                      className={
                        tieneNumero
                          ? 'font-bold text-emerald-800'
                          : 'text-slate-500 font-medium'
                      }
                    >
                      Al menos un número
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {coinciden ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span
                      className={
                        coinciden
                          ? 'font-bold text-emerald-800'
                          : 'text-slate-500 font-medium'
                      }
                    >
                      Las contraseñas coinciden
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  guardando ||
                  !tieneLongitud ||
                  !tieneLetra ||
                  !tieneNumero ||
                  !coinciden
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Guardando contraseña...
                  </>
                ) : (
                  <>
                    <span>Guardar contraseña</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Cancelar y volver al inicio de sesión
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
