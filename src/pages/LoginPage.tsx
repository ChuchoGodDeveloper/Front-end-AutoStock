import { useState, type FormEvent } from 'react'
import { Car, Eye, EyeOff, Loader2, LockKeyhole, LogIn, UserRound } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MENSAJES } from '../config/mensajes'
import { useAuthStore } from '../stores/authStore'

interface ErroresCampo {
  credencial?: string
  password?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const estaAutenticado = useAuthStore((estado) => estado.estaAutenticado)
  const sesionCargada = useAuthStore((estado) => estado.sesionCargada)
  const iniciarSesion = useAuthStore((estado) => estado.iniciarSesion)
  const iniciandoSesion = useAuthStore((estado) => estado.iniciandoSesion)

  const [credencial, setCredencial] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [erroresCampo, setErroresCampo] = useState<ErroresCampo>({})
  const [mensajeError, setMensajeError] = useState('')

  if (sesionCargada && estaAutenticado) {
    return <Navigate to="/dashboard" replace />
  }

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()

    const nuevosErrores: ErroresCampo = {}

    if (!credencial.trim()) {
      nuevosErrores.credencial = MENSAJES.campoObligatorio
    }

    if (!password) {
      nuevosErrores.password = MENSAJES.campoObligatorio
    }

    if (nuevosErrores.credencial || nuevosErrores.password) {
      setErroresCampo(nuevosErrores)
      setMensajeError('')
      return
    }

    setErroresCampo({})
    setMensajeError('')

    try {
      await iniciarSesion(credencial.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setMensajeError(error instanceof Error ? error.message : MENSAJES.errorInesperado)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <header className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 p-3.5 text-white shadow-md">
              <Car className="h-7 w-7" aria-hidden="true" />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              PORTAL DE CONCESIONARIA
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">AutoStock</h1>

            <p className="mt-5 text-lg font-bold text-slate-900">Bienvenido de nuevo</p>
            <p className="mt-1 text-sm text-slate-600">
              Inicia sesión para acceder al inventario
            </p>
          </header>

          <form onSubmit={manejarEnvio} noValidate aria-busy={iniciandoSesion} className="space-y-5">
            <div>
              <label
                htmlFor="credencial"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                ID de empleado o correo{' '}
                <span className="text-red-600" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="credencial"
                  name="credencial"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Ej. EMP-00001 o correo@autostock.com"
                  value={credencial}
                  onChange={(evento) => {
                    setCredencial(evento.target.value)
                    setErroresCampo((prev) => ({ ...prev, credencial: undefined }))
                  }}
                  disabled={iniciandoSesion}
                  aria-invalid={Boolean(erroresCampo.credencial)}
                  aria-describedby={erroresCampo.credencial ? 'credencial-error' : undefined}
                  className={`campo-base pl-11 ${
                    erroresCampo.credencial ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
              </div>
              {erroresCampo.credencial && (
                <p
                  id="credencial-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {erroresCampo.credencial}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Contraseña{' '}
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
                  id="password"
                  name="password"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(evento) => {
                    setPassword(evento.target.value)
                    setErroresCampo((prev) => ({ ...prev, password: undefined }))
                  }}
                  disabled={iniciandoSesion}
                  aria-invalid={Boolean(erroresCampo.password)}
                  aria-describedby={erroresCampo.password ? 'password-error' : undefined}
                  className={`campo-base pl-11 pr-12 ${
                    erroresCampo.password ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((valor) => !valor)}
                  aria-pressed={verPassword}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {verPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {erroresCampo.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {erroresCampo.password}
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
              disabled={iniciandoSesion}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {iniciandoSesion ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          La sesión se conserva por 8 horas, con o sin conexión · AutoStock
        </p>
      </section>
    </main>
  )
}
