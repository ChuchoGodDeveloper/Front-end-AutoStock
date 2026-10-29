import { useEffect, useState } from 'react'
import {
  Car,
  Clock,
  History,
  LogOut,
  PlusCircle,
  Search,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react'
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

const ROL_ADMINISTRADOR = 'Administrador'
const ROLES_CON_ALTA_VEHICULO = ['Encargado de Lote y Recepción', 'Administrador']

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

  useEffect(() => {
    if (!enLinea) return

    let vigente = true

    const refrescarPerfil = async () => {
      try {
        const perfil = await authService.obtenerPerfil()

        if (vigente && perfil?.id) {
          const rolActual = useAuthStore.getState().usuario?.rol
          const perfilAjustado: typeof perfil = {
            ...perfil,
            rol: perfil.rol?.trim() ? perfil.rol.trim() : rolActual || 'Usuario',
          }
          await actualizarUsuario(usuarioDesdePerfil(perfilAjustado))
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
  const rol = usuario?.rol?.trim() ? usuario.rol.trim() : 'Usuario'
  const esAdministrador = rol === ROL_ADMINISTRADOR
  const puedeRegistrarVehiculo = ROLES_CON_ALTA_VEHICULO.includes(rol)

  return (
    <main className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-12">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <OfflineBanner visible={!enLinea} />

        {/* Encabezado Responsivo */}
        <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm ring-4 ring-blue-50"
              >
                {obtenerIniciales(nombreCompleto)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    AutoStock Pro
                  </span>
                  <span className="inline-flex rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {rol}
                  </span>
                </div>
                <h1 className="truncate text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {`${obtenerSaludo()}, ${nombreCompleto}`}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void manejarCerrarSesion()}
              className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Grilla Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Accesos Rápidos y Métricas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Accesos Rápidos */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Módulos y Operaciones
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => navigate('/catalogo')}
                  className={`${
                    puedeRegistrarVehiculo ? '' : 'sm:col-span-2'
                  } flex items-center gap-3.5 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-left transition hover:bg-blue-100 hover:shadow-xs group`}
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Search className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Buscar Inventario</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Catálogo completo, filtros y fichas técnicas
                    </p>
                  </div>
                </button>

                {puedeRegistrarVehiculo && (
                  <button
                    type="button"
                    onClick={() => navigate('/registrar-vehiculo')}
                    className="flex items-center gap-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-left transition hover:bg-emerald-100 hover:shadow-xs group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <PlusCircle className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Registrar Unidad</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Alta de vehículos nuevos o seminuevos
                      </p>
                    </div>
                  </button>
                )}

                {esAdministrador && (
                  <button
                    type="button"
                    onClick={() => navigate('/usuarios')}
                    className="sm:col-span-2 flex items-center gap-3.5 rounded-xl border border-slate-300 bg-slate-900 p-4 text-left transition hover:bg-slate-800 hover:shadow-xs group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Users className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Directorio de Personal</h3>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">
                        Administración de accesos, roles y usuarios
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </section>

            {/* Métricas Rápidas */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-blue-600" />
                  Métricas de Inventario
                </h2>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${enLinea ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{enLinea ? 'En vivo' : 'Local'}</span>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-center">
                  <dt className="text-xs font-bold uppercase tracking-wider text-emerald-800">Disponibles</dt>
                  <dd className="mt-1.5 text-2xl sm:text-3xl font-black text-emerald-700">{resumen.disponibles}</dd>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-center">
                  <dt className="text-xs font-bold uppercase tracking-wider text-blue-800">Test Drive</dt>
                  <dd className="mt-1.5 text-2xl sm:text-3xl font-black text-blue-700">
                    {resumen.pruebaDeManejo}
                  </dd>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-center">
                  <dt className="text-xs font-bold uppercase tracking-wider text-amber-800">En Taller</dt>
                  <dd className="mt-1.5 text-2xl sm:text-3xl font-black text-amber-700">{resumen.enTaller}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Columna Derecha: Actividad y Estado de Conexión */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Actividad Reciente
              </h2>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-slate-600 border border-slate-100">
                <History className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Sin movimientos pendientes</p>
                  <p className="text-xs text-slate-500 mt-0.5">{MENSAJES.sinActividad}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
                Sincronización
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                AutoStock almacena la sesión de manera segura con cifrado offline en IndexedDB por hasta 8 horas continuas.
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                <span>Modo de sincronización activa</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
