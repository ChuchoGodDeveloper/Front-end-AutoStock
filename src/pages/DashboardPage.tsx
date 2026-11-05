import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Car,
  Clock,
  Gauge,
  History,
  LogOut,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatedCounter, SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { OfflineBanner } from '../components/OfflineBanner'
import { VehicleSilhouette } from '../components/ShowroomWall'
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
  const location = useLocation()
  const tienePermiso = useAuthStore((estado) => estado.tienePermiso)
  const estadoNavegacion = location.state as { mensajeNoAutorizado?: string } | null
  const [mensajeAlerta, setMensajeAlerta] = useState<string | null>(
    estadoNavegacion?.mensajeNoAutorizado ?? null,
  )

  useEffect(() => {
    if (estadoNavegacion?.mensajeNoAutorizado) {
      setMensajeAlerta(estadoNavegacion.mensajeNoAutorizado)
      window.history.replaceState({}, document.title)
    }
  }, [estadoNavegacion?.mensajeNoAutorizado])

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
  const puedeRegistrarVehiculo = tienePermiso('registrar_vehiculos')

  const totalFlotaActiva =
    resumen.disponibles + resumen.pruebaDeManejo + resumen.enTaller
  const porcentajeDisponibles =
    totalFlotaActiva > 0
      ? Math.round((resumen.disponibles / totalFlotaActiva) * 100)
      : 100
  const circunferencia = 2 * Math.PI * 42
  const dashOffset =
    circunferencia - (porcentajeDisponibles / 100) * circunferencia

  return (
    <main className="showroom-page">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <OfflineBanner visible={!enLinea} />

        {mensajeAlerta && (
          <div
            role="alert"
            className="v-glass tone--coral flex items-center justify-between gap-3 rounded-2xl p-4 text-sm font-semibold shadow-lg"
            style={{ color: 'var(--ink)' }}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" aria-hidden="true" />
              <span>{mensajeAlerta}</span>
            </div>
            <button
              type="button"
              onClick={() => setMensajeAlerta(null)}
              className="btn-squish rounded-lg p-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400"
              aria-label="Cerrar aviso de restricción"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Encabezado Principal Showroom Liquid Glass */}
        <SpotlightCard
          as="header"
          tone="ink"
          className="p-6 sm:p-7"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-base font-black text-white shadow-lg ring-2 ring-white/25"
              >
                {obtenerIniciales(nombreCompleto)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className="text-[11px] font-extrabold uppercase tracking-[0.2em]"
                    style={{ color: 'var(--champagne)' }}
                  >
                    AutoStock Pro · Showroom
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold">
                    {rol}
                  </span>
                </div>
                <SplitTitle
                  text={`${obtenerSaludo()}, ${nombreCompleto}`}
                  className="truncate text-xl sm:text-3xl font-black tracking-tight"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/catalogo')}
                className="btn-squish inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition hover:brightness-110"
              >
                <Car className="h-4 w-4" aria-hidden="true" />
                Explorar Flota
              </button>

              <button
                type="button"
                onClick={() => void manejarCerrarSesion()}
                className="v-glass btn-squish inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition hover:border-rose-400/50"
                style={{ color: 'var(--ink)' }}
              >
                <LogOut className="h-4 w-4 text-rose-400" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </SpotlightCard>

        {/* Fila Superior Bento: 3 KPIs Metálicos con Contadores Animados */}
        <section aria-label="Métricas principales de flota">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2
              className="text-xs font-extrabold uppercase tracking-[0.2em] flex items-center gap-2"
              style={{ color: 'var(--ink-2)' }}
            >
              <Car className="w-3.5 h-3.5 text-sky-400" />
              Métricas de Inventario
            </h2>
            <div
              className="flex items-center gap-2 text-xs font-bold"
              style={{ color: 'var(--ink-2)' }}
            >
              <span className={`live-dot ${enLinea ? '' : 'offline'}`} />
              <span>{enLinea ? 'En vivo' : 'Local'}</span>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SpotlightCard
              tone="green"
              interactive
              onClick={() => navigate('/catalogo')}
              className="p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <dt className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Disponibles
                </dt>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-400/30">
                  Piso de Venta
                </span>
              </div>
              <dd className="my-2 text-3xl sm:text-4xl font-black tracking-tight">
                <AnimatedCounter value={resumen.disponibles} />
              </dd>
              <div className="opacity-75 -mb-2">
                <VehicleSilhouette tipo="coupe" colorAcento="#2EE59D" className="w-full h-14" />
              </div>
            </SpotlightCard>

            <SpotlightCard
              tone="blue"
              interactive
              onClick={() => navigate('/catalogo')}
              className="p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <dt className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                  Test Drive
                </dt>
                <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-300 border border-sky-400/30">
                  Ruta Activa
                </span>
              </div>
              <dd className="my-2 text-3xl sm:text-4xl font-black tracking-tight">
                <AnimatedCounter value={resumen.pruebaDeManejo} />
              </dd>
              <div className="opacity-75 -mb-2">
                <VehicleSilhouette tipo="suv" colorAcento="#4DA6FF" className="w-full h-14" />
              </div>
            </SpotlightCard>

            <SpotlightCard
              tone="orange"
              interactive
              onClick={() => navigate('/catalogo')}
              className="p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <dt className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  En Taller
                </dt>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                  Servicio
                </span>
              </div>
              <dd className="my-2 text-3xl sm:text-4xl font-black tracking-tight">
                <AnimatedCounter value={resumen.enTaller} />
              </dd>
              <div className="opacity-75 -mb-2">
                <VehicleSilhouette tipo="pickup" colorAcento="#FFB020" className="w-full h-14" />
              </div>
            </SpotlightCard>
          </dl>
        </section>

        {/* Grilla Principal Bento: Operaciones + Telemetría Showroom */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda (2 cols): Módulos y Distribución */}
          <div className="lg:col-span-2 space-y-6">
            <SpotlightCard as="section" className="p-6">
              <h2
                className="text-xs font-extrabold uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
                style={{ color: 'var(--ink-2)' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Módulos y Operaciones
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/catalogo')}
                  className={`${
                    puedeRegistrarVehiculo ? '' : 'sm:col-span-2'
                  } v-glass tone--blue car-card btn-squish flex items-center justify-between gap-3.5 p-4 text-left group`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/25 border border-sky-400/40 text-sky-300 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <Search className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold" style={{ color: 'var(--ink)' }}>
                        Buscar Inventario
                      </h3>
                      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--ink-2)' }}>
                        Catálogo completo, filtros y fichas técnicas
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                {puedeRegistrarVehiculo && (
                  <button
                    type="button"
                    onClick={() => navigate('/registrar-vehiculo')}
                    className="v-glass tone--green car-card btn-squish flex items-center justify-between gap-3.5 p-4 text-left group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <PlusCircle className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold" style={{ color: 'var(--ink)' }}>
                          Registrar Unidad
                        </h3>
                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--ink-2)' }}>
                          Alta de vehículos nuevos o seminuevos
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                )}

                {esAdministrador && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate('/usuarios')}
                      className="v-glass tone--orange car-card btn-squish flex items-center justify-between gap-3.5 p-4 text-left group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/25 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                          <Users className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold" style={{ color: 'var(--ink)' }}>
                            Directorio de Personal
                          </h3>
                          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--ink-2)' }}>
                            Administración de accesos, roles y usuarios
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/permisos')}
                      className="v-glass tone--teal car-card btn-squish flex items-center justify-between gap-3.5 p-4 text-left group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold" style={{ color: 'var(--ink)' }}>
                            Permisos por Rol
                          </h3>
                          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--ink-2)' }}>
                            Matriz de control de facultades del sistema
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </>
                )}
              </div>
            </SpotlightCard>

            {/* Tacómetro SVG + Barras de Disponibilidad */}
            <SpotlightCard as="section" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xs font-extrabold uppercase tracking-[0.2em] flex items-center gap-2"
                  style={{ color: 'var(--ink-2)' }}
                >
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  Telemetría de Piso de Exhibición
                </h2>
                <span
                  className="text-xs font-bold"
                  style={{ color: 'var(--champagne)' }}
                >
                  {totalFlotaActiva} unidades monitoreadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* Tacómetro Circular SVG */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="var(--green)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circunferencia}
                        strokeDashoffset={dashOffset}
                        style={{
                          transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black">
                        <AnimatedCounter value={porcentajeDisponibles} suffix="%" />
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: 'var(--ink-3)' }}
                      >
                        Listos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barras Animadas por Estado */}
                <div className="sm:col-span-2 space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-400">Disponibles en Showroom</span>
                      <span>{resumen.disponibles} u.</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-1000"
                        style={{
                          width: `${
                            totalFlotaActiva > 0
                              ? Math.max(8, (resumen.disponibles / totalFlotaActiva) * 100)
                              : 65
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-sky-400">En Prueba de Manejo (Test Drive)</span>
                      <span>{resumen.pruebaDeManejo} u.</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-400 transition-all duration-1000"
                        style={{
                          width: `${
                            totalFlotaActiva > 0
                              ? Math.max(4, (resumen.pruebaDeManejo / totalFlotaActiva) * 100)
                              : 20
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-400">En Taller y Acondicionamiento</span>
                      <span>{resumen.enTaller} u.</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-1000"
                        style={{
                          width: `${
                            totalFlotaActiva > 0
                              ? Math.max(4, (resumen.enTaller / totalFlotaActiva) * 100)
                              : 15
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Columna Derecha: Actividad Reciente y Sincronización Offline */}
          <div className="space-y-6">
            <SpotlightCard as="section" className="p-6">
              <h2
                className="text-xs font-extrabold uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
                style={{ color: 'var(--ink-2)' }}
              >
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Actividad Reciente
              </h2>
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 border border-white/10">
                <History
                  className="h-5 w-5 shrink-0 text-sky-400 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                    Sin movimientos pendientes
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ink-2)' }}>
                    {MENSAJES.sinActividad}
                  </p>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard as="section" tone="ink" className="p-6">
              <h2
                className="text-xs font-extrabold uppercase tracking-[0.2em] mb-3"
                style={{ color: 'var(--champagne)' }}
              >
                Sincronización IndexedDB
              </h2>
              <p
                className="text-xs font-medium leading-relaxed"
                style={{ color: 'var(--ink-2)' }}
              >
                AutoStock almacena la sesión de manera segura con cifrado offline en
                IndexedDB por hasta 8 horas continuas.
              </p>
              <div
                className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-semibold"
                style={{ color: 'var(--ink-2)' }}
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modo de sincronización activa</span>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </main>
  )
}
