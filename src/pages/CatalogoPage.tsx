import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Car,
  ChevronLeft,
  ChevronRight,
  Filter,
  PlusCircle,
  RefreshCw,
  SearchX,
  SlidersHorizontal,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { FilterPanel } from '../components/FilterPanel'
import { FiltrosRapidos } from '../components/FiltrosRapidos'
import { SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { OfflineBanner } from '../components/OfflineBanner'
import { SearchBar } from '../components/SearchBar'
import { VehiculoCard } from '../components/VehiculoCard'
import { MENSAJES } from '../config/mensajes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAuthStore } from '../stores/authStore'
import {
  FILTROS_VACIOS,
  TAMANO_PAGINA_CATALOGO,
  hayFiltrosActivos,
  useCatalogoStore,
} from '../stores/catalogoStore'

export function CatalogoPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()

  const vehiculos = useCatalogoStore((estado) => estado.vehiculos)
  const totalUnidades = useCatalogoStore((estado) => estado.totalUnidades)
  const paginaActual = useCatalogoStore((estado) => estado.paginaActual)
  const totalPaginas = useCatalogoStore((estado) => estado.totalPaginas)
  const cargando = useCatalogoStore((estado) => estado.cargando)
  const error = useCatalogoStore((estado) => estado.error)
  const terminoBusqueda = useCatalogoStore((estado) => estado.terminoBusqueda)
  const filtros = useCatalogoStore((estado) => estado.filtros)
  const irAPagina = useCatalogoStore((estado) => estado.irAPagina)
  const cargarMasVehiculos = useCatalogoStore((estado) => estado.cargarMasVehiculos)
  const setTerminoBusqueda = useCatalogoStore((estado) => estado.setTerminoBusqueda)
  const setFiltros = useCatalogoStore((estado) => estado.setFiltros)

  const tienePermiso = useAuthStore((estado) => estado.tienePermiso)
  const puedeRegistrar = tienePermiso('registrar_vehiculos')

  const [versionBusqueda, setVersionBusqueda] = useState(0)
  const [panelFiltrosAbierto, setPanelFiltrosAbierto] = useState(false)
  const filtrosActivos = hayFiltrosActivos(filtros)
  const inicioRango = totalUnidades === 0 ? 0 : (paginaActual - 1) * TAMANO_PAGINA_CATALOGO + 1
  const finRango = Math.min(paginaActual * TAMANO_PAGINA_CATALOGO, totalUnidades)
  const primeraCarga = vehiculos.length === 0 && !cargando && !error && !terminoBusqueda
  const busquedaSinResultados =
    !cargando && !error && terminoBusqueda !== '' && totalUnidades === 0 && vehiculos.length === 0
  const filtrosSinResultados =
    !cargando &&
    !error &&
    terminoBusqueda === '' &&
    filtrosActivos &&
    totalUnidades === 0 &&
    vehiculos.length === 0

  const [notificacionReconexion, setNotificacionReconexion] = useState(false)
  const fueOffline = useRef(false)

  useEffect(() => {
    if (!enLinea) {
      fueOffline.current = true
    } else if (fueOffline.current) {
      fueOffline.current = false
      setNotificacionReconexion(true)
      void useCatalogoStore.getState().cargarMasVehiculos(true)
      void useCatalogoStore.getState().cargarConteosRapidos()
      const timer = setTimeout(() => setNotificacionReconexion(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [enLinea])

  useEffect(() => {
    const { vehiculos: cargados, cargando: enCarga } = useCatalogoStore.getState()

    void useCatalogoStore.getState().cargarConteosRapidos()

    if (cargados.length === 0 && !enCarga) {
      void useCatalogoStore.getState().cargarMasVehiculos(true)
    }

    // Auto-actualización cada 15 minutos si hay conexión
    const intervalo = setInterval(() => {
      if (navigator.onLine) {
        void useCatalogoStore.getState().sincronizarCacheCompleta()
      }
    }, 15 * 60 * 1000)

    return () => clearInterval(intervalo)
  }, [])

  const cambiarPagina = (nuevaPagina: number) => {
    if (
      nuevaPagina < 1 ||
      nuevaPagina > totalPaginas ||
      nuevaPagina === paginaActual ||
      cargando
    ) {
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    void irAPagina(nuevaPagina)
  }

  const limpiarBusqueda = () => {
    void setTerminoBusqueda('')
    setVersionBusqueda((actual) => actual + 1)
  }

  const limpiarFiltros = () => {
    void setFiltros(FILTROS_VACIOS)
  }

  return (
    <main className="showroom-page">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <OfflineBanner visible={!enLinea} mensajeReconexion={notificacionReconexion} />

        <SpotlightCard as="header" tone="ink" className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: 'var(--champagne)' }}
              >
                AUTOSTOCK PRO
              </p>
              <SplitTitle
                text="Catálogo de Inventario"
                className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5"
              />
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
                {terminoBusqueda
                  ? `${totalUnidades} ${totalUnidades === 1 ? 'resultado' : 'resultados'} para “${terminoBusqueda}”`
                  : `${totalUnidades} ${totalUnidades === 1 ? 'unidad en inventario' : 'unidades en inventario'}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="v-glass btn-squish flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition hover:border-sky-400/50"
              style={{ color: 'var(--ink)' }}
            >
              <ArrowLeft className="h-4 w-4 text-sky-400" aria-hidden="true" />
              Menú
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <SearchBar key={versionBusqueda} />
            </div>
            <button
              type="button"
              onClick={() => setPanelFiltrosAbierto(true)}
              aria-label="Abrir filtros"
              className={`btn-squish flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                filtrosActivos
                  ? 'border-sky-400 bg-sky-500 text-white shadow-lg'
                  : 'v-glass border-white/15 hover:border-sky-400/50'
              }`}
              style={filtrosActivos ? undefined : { color: 'var(--ink)' }}
            >
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4">
            <FiltrosRapidos />
          </div>
        </SpotlightCard>

        {primeraCarga && (
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-8">
            <Car className="h-10 w-10 animate-pulse text-sky-400" aria-hidden="true" />
            <p className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Cargando catálogo...
            </p>
          </SpotlightCard>
        )}

        {busquedaSinResultados && (
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-8">
            <SearchX className="h-10 w-10 text-sky-400" aria-hidden="true" />
            <p className="text-center text-sm font-bold" style={{ color: 'var(--ink)' }}>
              {`No se encontraron unidades para ${terminoBusqueda}`}
            </p>
            <button
              type="button"
              onClick={limpiarBusqueda}
              className="v-glass btn-squish rounded-xl px-4 py-2 text-sm font-bold text-sky-300"
            >
              Limpiar búsqueda
            </button>

            {puedeRegistrar && (
              <Link
                to="/registrar-vehiculo"
                className="btn-squish flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Registrar unidad
              </Link>
            )}
          </SpotlightCard>
        )}

        {filtrosSinResultados && (
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-8">
            <Filter className="h-10 w-10 text-amber-400" aria-hidden="true" />
            <p className="text-center text-sm font-bold" style={{ color: 'var(--ink)' }}>
              No hay unidades con estos filtros
            </p>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="v-glass btn-squish rounded-xl px-4 py-2 text-sm font-bold text-sky-300"
            >
              Limpiar filtros
            </button>

            {puedeRegistrar && (
              <Link
                to="/registrar-vehiculo"
                className="btn-squish flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Registrar unidad
              </Link>
            )}
          </SpotlightCard>
        )}

        {!cargando && !error && !terminoBusqueda && totalUnidades === 0 && vehiculos.length === 0 && (
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-8">
            <Car className="h-10 w-10 text-sky-400" aria-hidden="true" />
            <p className="text-center text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              {MENSAJES.sinUnidades}
            </p>
          </SpotlightCard>
        )}

        {error && (
          <SpotlightCard
            as="section"
            tone="coral"
            className="flex flex-col items-center gap-3 p-8"
          >
            <p className="text-center text-sm font-bold" style={{ color: 'var(--ink)' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => void cargarMasVehiculos(true)}
              className="btn-squish flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-rose-500"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </SpotlightCard>
        )}

        {vehiculos.length > 0 && (
          <section
            aria-label="Vehículos del catálogo"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {vehiculos.map((vehiculo) => (
              <VehiculoCard key={vehiculo.id} vehiculo={vehiculo} />
            ))}
          </section>
        )}

        {vehiculos.length > 0 && (
          <SpotlightCard as="section" className="px-5 py-4">
            <nav
              aria-label="Paginación del catálogo"
              className="flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 border border-sky-400/50 px-3 py-1 text-xs font-extrabold text-sky-400">
                  {`Página ${paginaActual} de ${totalPaginas}`}
                </span>
                <span>{`Mostrando ${inicioRango}–${finRango} de ${totalUnidades} unidades`}</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual <= 1 || cargando}
                  aria-label="Página anterior"
                  className="v-glass btn-squish flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none"
                  style={{ color: 'var(--ink)' }}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Anterior</span>
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numeroPagina) => {
                  const esActual = numeroPagina === paginaActual
                  return (
                    <button
                      key={numeroPagina}
                      type="button"
                      onClick={() => cambiarPagina(numeroPagina)}
                      disabled={cargando}
                      aria-current={esActual ? 'page' : undefined}
                      aria-label={`Ir a la página ${numeroPagina}`}
                      className={`btn-squish min-w-[40px] h-9 rounded-full px-3.5 text-xs font-black transition-all ${
                        esActual
                          ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-white border-2 border-white/80 shadow-[0_0_20px_rgba(56,189,248,0.65)] scale-105'
                          : 'v-glass hover:border-sky-400/50 opacity-75 hover:opacity-100'
                      }`}
                      style={esActual ? { color: '#ffffff' } : { color: 'var(--ink)' }}
                    >
                      {numeroPagina}
                    </button>
                  )
                })}

                <button
                  type="button"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual >= totalPaginas || cargando}
                  aria-label="Página siguiente"
                  className="v-glass btn-squish flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none"
                  style={{ color: 'var(--ink)' }}
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </nav>
          </SpotlightCard>
        )}

        <footer className="text-center">
          <Link
            to="/dashboard"
            className="text-sm font-bold text-sky-400 underline-offset-2 hover:underline"
          >
            Volver al menú principal
          </Link>
        </footer>
      </div>

      <FilterPanel abierto={panelFiltrosAbierto} onCerrar={() => setPanelFiltrosAbierto(false)} />
    </main>
  )
}
