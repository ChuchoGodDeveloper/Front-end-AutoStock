import { useEffect, useMemo, useState } from 'react'
import {
  Car,
  LayoutGrid,
  LogOut,
  Moon,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useGlobalRippleAndSquish } from '../hooks/useShowroomEffects'
import { useAuthStore } from '../stores/authStore'
import { useSyncStore } from '../services/syncService'
import { useThemeStore } from '../stores/themeStore'
import { LiquidSegmented, type SegmentedOption } from './LiquidUI'
import { ShowroomWall } from './ShowroomWall'

const RUTAS_PUBLICAS = new Set([
  '/login',
  '/recuperar-password',
  '/restablecer-password',
])

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = partes[0]?.charAt(0) ?? ''
  const segunda = partes[1]?.charAt(0) ?? ''
  return `${primera}${segunda}`.toUpperCase() || 'AS'
}

export function AppShell() {
  useGlobalRippleAndSquish()

  const location = useLocation()
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()
  const usuario = useAuthStore((s) => s.usuario)
  const tienePermiso = useAuthStore((s) => s.tienePermiso)
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion)
  const tema = useThemeStore((s) => s.tema)
  const alternarTema = useThemeStore((s) => s.alternarTema)
  const totalPendientes = useSyncStore((s) => s.totalPendientes)
  const sincronizando = useSyncStore((s) => s.sincronizando)
  const sincronizarTodo = useSyncStore((s) => s.sincronizarTodo)
  const cargarCola = useSyncStore((s) => s.cargarCola)

  useEffect(() => {
    void cargarCola()
  }, [cargarCola])

  useEffect(() => {
    if (enLinea) {
      void sincronizarTodo()
    }
  }, [enLinea, sincronizarTodo])

  const esRutaPublica = RUTAS_PUBLICAS.has(location.pathname)
  const mostrarChrome = Boolean(usuario) && !esRutaPublica

  const rol = usuario?.rol?.trim() || 'Usuario'
  const esAdministrador = rol === 'Administrador'
  const puedeRegistrarVehiculo = tienePermiso('registrar_vehiculos')

  const opcionesNav = useMemo<SegmentedOption<string>[]>(() => {
    const lista: SegmentedOption<string>[] = [
      { id: '/dashboard', label: 'Showroom' },
      { id: '/catalogo', label: 'Catálogo' },
    ]
    if (puedeRegistrarVehiculo) {
      lista.push({ id: '/registrar-vehiculo', label: 'Alta Unidad' })
    }
    if (esAdministrador) {
      lista.push({ id: '/usuarios', label: 'Personal' })
      lista.push({ id: '/permisos', label: 'Permisos' })
    }
    return lista
  }, [puedeRegistrarVehiculo, esAdministrador])

  const rutaActiva = useMemo(() => {
    const p = location.pathname
    if (p === '/' || p.startsWith('/dashboard')) return '/dashboard'
    if (p.startsWith('/catalogo') || p.startsWith('/vehiculo')) return '/catalogo'
    if (p.startsWith('/registrar-vehiculo')) return '/registrar-vehiculo'
    if (p.startsWith('/usuarios')) return '/usuarios'
    if (p.startsWith('/permisos')) return '/permisos'
    return '/dashboard'
  }, [location.pathname])

  const [confirmarSalidaPendientes, setConfirmarSalidaPendientes] = useState(false)

  const manejarCerrarSesion = async () => {
    if (totalPendientes > 0) {
      setConfirmarSalidaPendientes(true)
      return
    }
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  const procederCierreConPendientes = async () => {
    setConfirmarSalidaPendientes(false)
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <ShowroomWall />

      {mostrarChrome && (
        <>
          <header className="showroom-topbar" aria-label="Barra superior de navegación">
            {/* Isla 1: Emblema AutoStock Pro */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="v-glass v-glass--chrome brand-pill btn-squish text-left"
              title="Ir al Showroom Principal"
            >
              <div className="brand-emblem" aria-hidden="true">
                <Car className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <div className="brand-title">AutoStock</div>
                <div className="brand-sub">Showroom Edition</div>
              </div>
            </button>

            {/* Isla 2: Cápsula Líquida de Navegación */}
            <div className="hidden md:block">
              <LiquidSegmented
                options={opcionesNav}
                value={rutaActiva}
                onChange={(ruta) => navigate(ruta)}
                ariaLabel="Navegación principal AutoStock"
              />
            </div>

            {/* Isla 3: Telemetría Online/Offline, Faros (Tema), Perfil y Salida */}
            <div className="topbar-actions">
              <button
                type="button"
                onClick={() => navigate('/pendientes')}
                className="v-glass v-glass--chrome status-pill relative btn-squish"
                title={
                  totalPendientes > 0
                    ? `${totalPendientes} cambios pendientes de sincronizar`
                    : 'Sin cambios pendientes'
                }
                aria-label="Ver cola de cambios pendientes"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${sincronizando ? 'animate-spin text-sky-400' : ''}`} />
                <span className="text-xs font-bold">
                  {totalPendientes > 0 ? `${totalPendientes} pend.` : 'Sync'}
                </span>
                {totalPendientes > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black animate-pulse">
                    {totalPendientes}
                  </span>
                )}
              </button>

              <div
                className="v-glass v-glass--chrome status-pill"
                title={
                  enLinea
                    ? 'Conectado en tiempo real — Caché IndexedDB 8h activa'
                    : 'Modo sin conexión — Usando sesión local IndexedDB'
                }
              >
                <span className={`live-dot ${enLinea ? '' : 'offline'}`} />
                <span className="hidden lg:inline">
                  {enLinea ? 'En línea · 8h IDB' : 'Modo Local IDB'}
                </span>
                <span className="lg:hidden">{enLinea ? 'Online' : 'Local'}</span>
              </div>

              <button
                type="button"
                onClick={alternarTema}
                className="v-glass v-glass--chrome icon-orb btn-squish"
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

              <div
                className="v-glass v-glass--chrome status-pill hidden sm:inline-flex"
                title={`${usuario?.nombreCompleto ?? 'Usuario'} (${rol})`}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-[11px] font-extrabold text-sky-400 border border-sky-400/30">
                  {obtenerIniciales(usuario?.nombreCompleto ?? 'AS')}
                </span>
                <span className="max-w-[110px] truncate text-xs font-bold">
                  {rol}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void manejarCerrarSesion()}
                className="v-glass v-glass--chrome icon-orb btn-squish text-rose-400 hover:text-rose-300"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Dock Flotante Adaptativo (Lateral en Desktop / Inferior en Móvil) */}
          <nav
            className="v-glass v-glass--chrome side-dock"
            aria-label="Accesos rápidos de módulos"
          >
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`dock-btn btn-squish ${rutaActiva === '/dashboard' ? 'active' : ''}`}
              title="Showroom & Métricas"
              aria-label="Showroom y Métricas"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/catalogo')}
              className={`dock-btn btn-squish ${rutaActiva === '/catalogo' ? 'active' : ''}`}
              title="Catálogo de Flota"
              aria-label="Catálogo de Flota"
            >
              <Car className="h-5 w-5" />
            </button>

            {puedeRegistrarVehiculo && (
              <button
                type="button"
                onClick={() => navigate('/registrar-vehiculo')}
                className={`dock-btn btn-squish ${
                  rutaActiva === '/registrar-vehiculo' ? 'active' : ''
                }`}
                title="Registrar Vehículo"
                aria-label="Registrar Vehículo"
              >
                <PlusCircle className="h-5 w-5" />
              </button>
            )}

            {esAdministrador && (
              <>
                <div className="dock-sep" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => navigate('/usuarios')}
                  className={`dock-btn btn-squish ${rutaActiva === '/usuarios' ? 'active' : ''}`}
                  title="Directorio de Personal"
                  aria-label="Directorio de Personal"
                >
                  <Users className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/permisos')}
                  className={`dock-btn btn-squish ${rutaActiva === '/permisos' ? 'active' : ''}`}
                  title="Permisos por Rol"
                  aria-label="Permisos por Rol"
                >
                  <ShieldCheck className="h-5 w-5" />
                </button>
              </>
            )}
          </nav>

          {confirmarSalidaPendientes && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <div className="v-glass v-glass--thick tone--coral max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black" style={{ color: 'var(--ink)' }}>
                      Cambios pendientes sin guardar
                    </h3>
                    <p className="text-xs font-semibold text-rose-400">
                      Tienes {totalPendientes} {totalPendientes === 1 ? 'cambio' : 'cambios'} sin sincronizar en este dispositivo.
                    </p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--ink-2)' }}>
                  Al cerrar sesión, la base de datos local se limpiará para proteger la información en dispositivos compartidos y los cambios pendientes se perderán.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmarSalidaPendientes(false)}
                    className="v-glass btn-squish rounded-xl px-4 py-2 text-xs font-bold"
                    style={{ color: 'var(--ink)' }}
                  >
                    Permanecer aquí
                  </button>
                  <button
                    type="button"
                    onClick={() => void procederCierreConPendientes()}
                    className="btn-squish rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-500 transition"
                  >
                    Cerrar sesión de todos modos
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
