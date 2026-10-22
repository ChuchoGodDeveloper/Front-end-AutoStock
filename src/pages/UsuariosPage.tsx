import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, IdCard, Mail, RefreshCw, Shield, UserPlus, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { OfflineBanner } from '../components/OfflineBanner'
import { MENSAJES } from '../config/mensajes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { HttpError } from '../services/httpClient'
import { usuariosService, type UsuarioBackend } from '../services/usuariosService'

export function UsuariosPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()

  const [usuarios, setUsuarios] = useState<UsuarioBackend[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarUsuarios = useCallback(async () => {
    setCargando(true)
    setError(null)

    try {
      const lista = await usuariosService.obtenerUsuarios()
      setUsuarios(lista)
    } catch (err) {
      if (err instanceof HttpError && err.message.trim()) {
        setError(err.message.trim())
      } else {
        setError(MENSAJES.errorUsuarios)
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarUsuarios()
  }, [cargarUsuarios])

  return (
    <main className="min-h-screen bg-slate-100 pb-10">
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
        <OfflineBanner visible={!enLinea} />

        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                AUTOSTOCK PRO
              </p>
              <h1 className="text-2xl font-black text-slate-900">
                Administración de usuarios
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {`${usuarios.length} ${usuarios.length === 1 ? 'usuario registrado' : 'usuarios registrados'}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Menú
            </button>
          </div>

          <div className="mt-4">
            <Link
              to="/usuarios/nuevo"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              Nuevo usuario
            </Link>
          </div>
        </header>

        {cargando && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Users className="h-10 w-10 animate-pulse text-blue-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">Cargando usuarios...</p>
          </section>
        )}

        {error && !cargando && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-center text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void cargarUsuarios()}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </section>
        )}

        {!cargando && !error && usuarios.length === 0 && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Users className="h-10 w-10 text-slate-400" aria-hidden="true" />
            <p className="text-center text-sm font-semibold text-slate-700">
              No hay usuarios registrados
            </p>
          </section>
        )}

        {!cargando && !error && usuarios.length > 0 && (
          <section aria-label="Lista de usuarios" className="space-y-3">
            {usuarios.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-black text-slate-900">
                      {item.nombreCompleto}
                    </h2>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <IdCard className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <span>{item.empleadoId}</span>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                      item.activo
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-slate-300 bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-blue-800">
                    <Shield className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
                    {item.rol}
                  </span>

                  <span className="inline-flex items-center gap-1.5 truncate text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    {item.correo}
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
