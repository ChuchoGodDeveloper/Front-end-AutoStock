import { useEffect, useState } from 'react'
import { Car, History, LogOut, PlusCircle, Search, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { OfflineBanner } from '../components/OfflineBanner'
import { MENSAJES } from '../config/mensajes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { authService } from '../services/authService'
import { apiFetch } from '../services/httpClient'
import { useAuthStore, usuarioDesdePerfil } from '../stores/authStore'

interface ResumenMetricas {
  disponibles: number
  pruebaDeManejo: number
  enTaller: number
}

const RESUMEN_VACIO: ResumenMetricas = {
  disponibles: 0,
  pruebaDeManejo: 0,
  enTaller: 0,
}

function obtenerSaludo(): string {
  const hora = new Date().getHours()

  if (hora < 12) return 'Buen día'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = partes[0]?.charAt(0) ?? ''
  const segunda = partes[1]?.charAt(0) ?? ''
  const iniciales = `${primera}${segunda}`.toUpperCase()

  return iniciales || 'US'
}

function aNumero(valor: unknown): number {
  const numero = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

export function DashboardPage() {
  const navigate = useNavigate()
  const usuario = useAuthStore((estado) => estado.usuario)
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion)
  const actualizarUsuario = useAuthStore((estado) => estado.actualizarUsuario)
  const enLinea = useOnlineStatus()

  const [resumen, setResumen] = useState<ResumenMetricas>(RESUMEN_VACIO)
  const [avisoAccion, setAvisoAccion] = useState('')

  useEffect(() => {
    if (!enLinea) return

    let vigente = true

    const refrescarPerfil = async () => {
      try {
        const perfil = await authService.obtenerPerfil()

        if (vigente && perfil?.id) {
          await actualizarUsuario(usuarioDesdePerfil(perfil))
        }
      } catch {
        // Sin conexión o con el token vencido se conserva la sesión local.
      }
    }

    void refrescarPerfil()

    return () => {
      vigente = false
    }
  }, [enLinea, actualizarUsuario])

  useEffect(() => {
    let vigente = true

    const cargarResumen = async () => {
      try {
        const datos = await apiFetch<Record<string, unknown>>('/metricas/resumen')

        if (!vigente) return

        setResumen({
          disponibles: aNumero(datos.disponibles ?? datos.autosDisponibles),
          pruebaDeManejo: aNumero(
            datos.pruebaDeManejo ?? datos.enPruebaDeManejo ?? datos.testDrive,
          ),
          enTaller: aNumero(datos.enTaller ?? datos.taller),
        })
      } catch {
        if (vigente) {
          setResumen(RESUMEN_VACIO)
        }
      }
    }

    void cargarResumen()

    return () => {
      vigente = false
    }
  }, [])

  const manejarCerrarSesion = async () => {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  const nombreCompleto = usuario?.nombreCompleto ?? 'Usuario'
  const rol = usuario?.rol ?? 'Usuario'

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
              <h1 className="text-2xl font-black text-slate-900">Menú Principal</h1>
            </div>

            <button
              type="button"
              onClick={() => void manejarCerrarSesion()}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-sm"
            >
              {obtenerIniciales(nombreCompleto)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900">
                {`${obtenerSaludo()}, ${nombreCompleto}`}
              </p>
              <span className="mt-1 inline-flex rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                {rol}
              </span>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Accesos rápidos
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAvisoAccion('Buscar Inventario: ' + MENSAJES.moduloProximamente)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-4 text-sm font-bold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Search className="h-6 w-6" aria-hidden="true" />
              Buscar Inventario
            </button>
            <button
              type="button"
              onClick={() =>
                setAvisoAccion('Registrar Vehículo: ' + MENSAJES.moduloProximamente)
              }
              className="flex flex-col items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-3 py-4 text-sm font-bold text-green-800 transition hover:bg-green-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            >
              <PlusCircle className="h-6 w-6" aria-hidden="true" />
              Registrar Vehículo
            </button>
          </div>
          {avisoAccion && (
            <p role="status" className="mt-3 text-center text-sm text-slate-600">
              {avisoAccion}
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            MÉTRICAS RÁPIDAS
          </h2>
          <dl className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-green-50 p-3 text-center">
              <dt className="text-xs font-semibold text-slate-700">Autos Disponibles</dt>
              <dd className="mt-1 text-2xl font-black text-green-700">{resumen.disponibles}</dd>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-center">
              <dt className="text-xs font-semibold text-slate-700">En Prueba de Manejo</dt>
              <dd className="mt-1 text-2xl font-black text-blue-700">
                {resumen.pruebaDeManejo}
              </dd>
            </div>
            <div className="rounded-2xl bg-orange-50 p-3 text-center">
              <dt className="text-xs font-semibold text-slate-700">En Taller</dt>
              <dd className="mt-1 text-2xl font-black text-orange-700">{resumen.enTaller}</dd>
            </div>
          </dl>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Car className="h-4 w-4" aria-hidden="true" />
            <Wrench className="h-4 w-4" aria-hidden="true" />
            <span>{enLinea ? 'Datos en vivo' : 'Datos locales'}</span>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            ACTIVIDAD RECIENTE
          </h2>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-slate-600">
            <History className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm">{MENSAJES.sinActividad}</p>
          </div>
        </section>
      </div>
    </main>
  )
}
