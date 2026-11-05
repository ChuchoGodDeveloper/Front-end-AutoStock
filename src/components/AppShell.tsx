import { useMemo } from 'react'
import {
  Car,
  LayoutGrid,
  LogOut,
  Moon,
  PlusCircle,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useGlobalRippleAndSquish } from '../hooks/useShowroomEffects'
import { useAuthStore } from '../stores/authStore'
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

  const manejarCerrarSesion = async () => {
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
        </>
      )}
    </>
  )
}
