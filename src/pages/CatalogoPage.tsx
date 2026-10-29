import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Car, Filter, PlusCircle, RefreshCw, SearchX, SlidersHorizontal } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { FilterPanel } from '../components/FilterPanel'
import { FiltrosRapidos } from '../components/FiltrosRapidos'
import { OfflineBanner } from '../components/OfflineBanner'
import { SearchBar } from '../components/SearchBar'
import { VehiculoCard } from '../components/VehiculoCard'
import { MENSAJES } from '../config/mensajes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAuthStore } from '../stores/authStore'
import { FILTROS_VACIOS, hayFiltrosActivos, useCatalogoStore } from '../stores/catalogoStore'

const ROLES_PUEDE_REGISTRAR = ['Encargado de Lote y Recepción', 'Administrador']

export function CatalogoPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()

  const vehiculos = useCatalogoStore((estado) => estado.vehiculos)
  const totalUnidades = useCatalogoStore((estado) => estado.totalUnidades)
  const hayMas = useCatalogoStore((estado) => estado.hayMas)
  const cargando = useCatalogoStore((estado) => estado.cargando)
  const error = useCatalogoStore((estado) => estado.error)
  const terminoBusqueda = useCatalogoStore((estado) => estado.terminoBusqueda)
  const filtros = useCatalogoStore((estado) => estado.filtros)
  const cargarMasVehiculos = useCatalogoStore((estado) => estado.cargarMasVehiculos)
  const setTerminoBusqueda = useCatalogoStore((estado) => estado.setTerminoBusqueda)
  const setFiltros = useCatalogoStore((estado) => estado.setFiltros)

  const rol = useAuthStore((estado) => estado.usuario?.rol ?? '')

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [versionBusqueda, setVersionBusqueda] = useState(0)
  const [panelFiltrosAbierto, setPanelFiltrosAbierto] = useState(false)
  const filtrosActivos = hayFiltrosActivos(filtros)
  const primeraCarga = vehiculos.length === 0 && !cargando && !error && !terminoBusqueda
  const busquedaSinResultados =
    !cargando && !error && terminoBusqueda !== '' && totalUnidades === 0 && vehiculos.length === 0
  const filtrosSinResultados =
    !cargando && !error && terminoBusqueda === '' && filtrosActivos && totalUnidades === 0 && vehiculos.length === 0

  useEffect(() => {
    const { vehiculos: cargados, cargando: enCarga } = useCatalogoStore.getState()

    void useCatalogoStore.getState().cargarConteosRapidos()

    if (cargados.length === 0 && !enCarga) {
      void useCatalogoStore.getState().cargarMasVehiculos(true)
    }
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hayMas || cargando) return

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          void cargarMasVehiculos()
        }
      },
      { rootMargin: '200px 0px' },
    )

    observador.observe(sentinel)

    return () => observador.disconnect()
  }, [hayMas, cargando, cargarMasVehiculos])

  const limpiarBusqueda = () => {
    void setTerminoBusqueda('')
    setVersionBusqueda((actual) => actual + 1)
  }

  const limpiarFiltros = () => {
    void setFiltros(FILTROS_VACIOS)
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-10">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        <OfflineBanner visible={!enLinea} />

        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                AUTOSTOCK PRO
              </p>
              <h1 className="text-2xl font-black text-slate-900">Catálogo de Inventario</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {terminoBusqueda
                  ? `${totalUnidades} ${totalUnidades === 1 ? 'resultado' : 'resultados'} para “${terminoBusqueda}”`
                  : `${totalUnidades} ${totalUnidades === 1 ? 'unidad en inventario' : 'unidades en inventario'}`}
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

          <div className="mt-4 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchBar key={versionBusqueda} />
            </div>
            <button
              type="button"
              onClick={() => setPanelFiltrosAbierto(true)}
              aria-label="Abrir filtros"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                filtrosActivos
                  ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3">
            <FiltrosRapidos />
          </div>
        </header>

        {primeraCarga && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Car className="h-10 w-10 animate-pulse text-blue-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">Cargando catálogo...</p>
          </section>
        )}

        {busquedaSinResultados && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <SearchX className="h-10 w-10 text-slate-400" aria-hidden="true" />
            <p className="text-center text-sm font-semibold text-slate-700">
              {`No se encontraron unidades para ${terminoBusqueda}`}
            </p>
            <button
              type="button"
              onClick={limpiarBusqueda}
              className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Limpiar búsqueda
            </button>

            {ROLES_PUEDE_REGISTRAR.includes(rol) && (
              <Link
                to="/registrar-vehiculo"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Registrar unidad
              </Link>
            )}
          </section>
        )}

        {filtrosSinResultados && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Filter className="h-10 w-10 text-slate-400" aria-hidden="true" />
            <p className="text-center text-sm font-semibold text-slate-700">
              No hay unidades con estos filtros
            </p>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Limpiar filtros
            </button>

            {ROLES_PUEDE_REGISTRAR.includes(rol) && (
              <Link
                to="/registrar-vehiculo"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Registrar unidad
              </Link>
            )}
          </section>
        )}

        {!cargando && !error && !terminoBusqueda && totalUnidades === 0 && vehiculos.length === 0 && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Car className="h-10 w-10 text-slate-400" aria-hidden="true" />
            <p className="text-center text-sm font-semibold text-slate-700">
              {MENSAJES.sinUnidades}
            </p>
          </section>
        )}

        {error && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-center text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void cargarMasVehiculos(true)}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </section>
        )}

        {vehiculos.length > 0 && (
          <section aria-label="Vehículos del catálogo" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehiculos.map((vehiculo) => (
              <VehiculoCard key={vehiculo.id} vehiculo={vehiculo} />
            ))}
          </section>
        )}

        {hayMas && vehiculos.length > 0 && (
          <button
            type="button"
            onClick={() => void cargarMasVehiculos()}
            disabled={cargando}
            className="w-full rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {cargando ? 'Cargando...' : 'Cargar más'}
          </button>
        )}

        <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

        <footer className="text-center">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
          >
            Volver al menú principal
          </Link>
        </footer>
      </div>

      <FilterPanel abierto={panelFiltrosAbierto} onCerrar={() => setPanelFiltrosAbierto(false)} />
    </main>
  )
}
