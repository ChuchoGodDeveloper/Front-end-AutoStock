import { useState, type FormEvent } from 'react'
import {
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { MENSAJES } from '../config/mensajes'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'

interface ErroresCampo {
  credencial?: string
  password?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const mensajeExito = (location.state as { mensajeExito?: string } | null)?.mensajeExito
  const estaAutenticado = useAuthStore((estado) => estado.estaAutenticado)
  const sesionCargada = useAuthStore((estado) => estado.sesionCargada)
  const usuario = useAuthStore((estado) => estado.usuario)
  const iniciarSesion = useAuthStore((estado) => estado.iniciarSesion)
  const iniciandoSesion = useAuthStore((estado) => estado.iniciandoSesion)
  const tema = useThemeStore((estado) => estado.tema)
  const alternarTema = useThemeStore((estado) => estado.alternarTema)

  const [credencial, setCredencial] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [erroresCampo, setErroresCampo] = useState<ErroresCampo>({})
  const [mensajeError, setMensajeError] = useState('')

  if (sesionCargada && estaAutenticado) {
    return (
      <Navigate
        to={usuario?.requiereCambioPassword ? '/cambiar-password' : '/dashboard'}
        replace
      />
    )
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
      const usuarioAutenticado = await iniciarSesion(credencial.trim(), password)
      navigate(
        usuarioAutenticado.requiereCambioPassword ? '/cambiar-password' : '/dashboard',
        { replace: true },
      )
    } catch (error) {
      setMensajeError(error instanceof Error ? error.message : MENSAJES.errorInesperado)
    }
  }

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={alternarTema}
        className="v-glass v-glass--chrome icon-orb btn-squish fixed right-5 top-5 z-20"
        title={
          tema === 'dark'
            ? 'Cambiar a Agencia de Día (Modo Claro)'
            : 'Cambiar a Showroom Nocturno (Modo Oscuro)'
        }
        aria-label="Alternar ambiente de iluminación"
      >
        {tema === 'dark' ? (
          <Sun className="h-4 w-4 text-amber-300" />
        ) : (
          <Moon className="h-4 w-4 text-slate-700" />
        )}
      </button>

      <section className="w-full max-w-md">
        <SpotlightCard thickness="thick" className="p-6 sm:p-8 shadow-2xl">
          <header className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 p-3.5 text-white shadow-lg ring-2 ring-white/25">
              <Car className="h-7 w-7" aria-hidden="true" />
            </div>

            <p
              className="text-xs font-extrabold uppercase tracking-[0.22em]"
              style={{ color: 'var(--champagne)' }}
            >
              PORTAL DE CONCESIONARIA
            </p>
            <SplitTitle
              text="AutoStock"
              className="mt-1 text-3xl font-black tracking-tight"
            />

            <p className="mt-5 text-lg font-bold" style={{ color: 'var(--ink)' }}>
              Bienvenido de nuevo
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
              Inicia sesión para acceder al inventario
            </p>
          </header>

          {mensajeExito && (
            <div
              role="status"
              className="v-glass tone--green mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
              style={{ color: 'var(--ink)' }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{mensajeExito}</span>
            </div>
          )}

          <form
            onSubmit={manejarEnvio}
            noValidate
            aria-busy={iniciandoSesion}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="credencial"
                className="mb-1.5 block text-sm font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                ID de empleado o correo{' '}
                <span className="text-rose-400" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative flex items-center">
                <UserRound
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-sky-400"
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
                  className={`campo-base pl-10 pr-4 ${
                    erroresCampo.credencial ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
              </div>
              {erroresCampo.credencial && (
                <p
                  id="credencial-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-rose-400"
                >
                  {erroresCampo.credencial}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                Contraseña{' '}
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
                  className={`campo-base pl-10 pr-10 ${
                    erroresCampo.password ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((valor) => !valor)}
                  aria-pressed={verPassword}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3.5 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-lg p-1 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  style={{ color: 'var(--ink-2)' }}
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
                  className="mt-1.5 text-sm font-medium text-rose-400"
                >
                  {erroresCampo.password}
                </p>
              )}
              <div className="mt-2 flex justify-end">
                <Link
                  to="/recuperar-password"
                  className="text-xs font-bold text-sky-400 transition hover:text-sky-300 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
              disabled={iniciandoSesion}
              className="btn-squish flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3.5 text-base font-extrabold text-white shadow-lg transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
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
        </SpotlightCard>

        <p className="mt-6 text-center text-xs font-semibold" style={{ color: 'var(--ink-3)' }}>
          La sesión se conserva por 8 horas, con o sin conexión · AutoStock
        </p>
      </section>
    </main>
  )
}
