import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gauge,
  Hash,
  Info,
  MapPin,
  Pencil,
  RefreshCw,
  Settings,
  Ticket,
  ToggleLeft,
  UserCheck,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ESTILOS_ESTADO } from '../config/estadosOperativos'
import { MENSAJES } from '../config/mensajes'
import { HttpError } from '../services/httpClient'
import { vehiculosService } from '../services/vehiculosService'
import { useAuthStore } from '../stores/authStore'
import type { VehiculoDetalle } from '../types/vehiculo'

const formateadorMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const formateadorKilometraje = new Intl.NumberFormat('es-MX')

const ROL_ASESOR = 'Asesor de Ventas'
const ROLES_CON_EDICION = [
  'Encargado de Lote y Recepción',
  'Gerente de Ventas',
  'Administrador',
]

function mostrarDato(valor: string | null | undefined): string {
  return valor && valor.trim() ? valor.trim() : MENSAJES.sinRegistro
}

interface EstadoNavegacionDetalle {
  recienRegistrado?: boolean
}

export function VehiculoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const estadoNavegacion = (location.state as EstadoNavegacionDetalle | null) ?? null
  const rol = useAuthStore((estado) => estado.usuario?.rol ?? '')

  const [vehiculo, setVehiculo] = useState<VehiculoDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [indiceImagen, setIndiceImagen] = useState(0)
  const [fotoFallida, setFotoFallida] = useState(false)

  const cargarVehiculo = useCallback(async () => {
    if (!id) {
      setNoEncontrado(true)
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)
    setNoEncontrado(false)
    setFotoFallida(false)
    setIndiceImagen(0)

    try {
      const detalle = await vehiculosService.obtenerVehiculoPorId(id)
      setVehiculo(detalle)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        setNoEncontrado(true)
      } else {
        setError(MENSAJES.errorDetalle)
      }
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    void cargarVehiculo()
  }, [cargarVehiculo])

  const imagenAnterior = () => {
    setIndiceImagen((actual) => Math.max(actual - 1, 0))
    setFotoFallida(false)
  }

  const imagenSiguiente = () => {
    if (!vehiculo) return
    setIndiceImagen((actual) => Math.min(actual + 1, vehiculo.imagenes.length - 1))
    setFotoFallida(false)
  }

  const estiloEstado = vehiculo ? ESTILOS_ESTADO[vehiculo.estado] : undefined
  const totalImagenes = vehiculo?.imagenes.length ?? 0
  const imagenActual = vehiculo?.imagenes[indiceImagen]
  const urlImagen =
    totalImagenes > 0 && imagenActual && !fotoFallida ? imagenActual.url : null

  const puedeEditar =
    rol === ROL_ASESOR || ROLES_CON_EDICION.includes(rol)

  return (
    <main className="min-h-screen bg-slate-100 pb-10">
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                AUTOSTOCK PRO
              </p>
              <h1 className="text-2xl font-black text-slate-900">Ficha Técnica</h1>
              {vehiculo && (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {vehiculo.marca} {vehiculo.modelo}
                  {vehiculo.version ? ` ${vehiculo.version}` : ''} {vehiculo.anio}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </button>
          </div>
        </header>

        {estadoNavegacion?.recienRegistrado && vehiculo && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-2xl border border-green-300 bg-green-50 p-4 text-sm font-semibold text-green-800 shadow-sm"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
            <div>
              <p className="font-bold">Unidad registrada exitosamente</p>
              <p className="text-xs text-green-700">
                {`Número de stock asignado: ${vehiculo.numeroStock}`}
              </p>
            </div>
          </div>
        )}

        {cargando && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Car className="h-10 w-10 animate-pulse text-blue-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">Cargando ficha técnica...</p>
          </section>
        )}

        {noEncontrado && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Car className="h-10 w-10 text-slate-400" aria-hidden="true" />
            <p className="text-center text-sm font-semibold text-slate-700">
              {MENSAJES.vehiculoNoEncontrado}
            </p>
          </section>
        )}

        {error && !cargando && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-center text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void cargarVehiculo()}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </section>
        )}

        {vehiculo && !cargando && (
          <>
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-56 w-full bg-slate-100">
                {urlImagen ? (
                  <img
                    src={urlImagen}
                    alt={`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`}
                    onError={() => setFotoFallida(true)}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} sin fotografía`}
                    className="flex h-56 w-full items-center justify-center"
                  >
                    <Car className="h-16 w-16 text-slate-400" aria-hidden="true" />
                  </div>
                )}

                {totalImagenes > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={imagenAnterior}
                      disabled={indiceImagen === 0}
                      aria-label="Imagen anterior"
                      className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={imagenSiguiente}
                      disabled={indiceImagen === totalImagenes - 1}
                      aria-label="Imagen siguiente"
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs font-bold text-white">
                      {`${indiceImagen + 1} / ${totalImagenes}`}
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-slate-900">
                      {vehiculo.marca} {vehiculo.modelo}
                      {vehiculo.version ? ` ${vehiculo.version}` : ''}
                    </h2>
                    <p className="text-sm font-semibold text-slate-500">{vehiculo.anio}</p>
                  </div>

                  {estiloEstado && (
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${estiloEstado.clases}`}
                    >
                      {estiloEstado.etiqueta}
                    </span>
                  )}
                </div>

                <p className="text-2xl font-black text-blue-700">
                  {formateadorMoneda.format(vehiculo.precio)}
                </p>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <dt className="sr-only">Número de stock</dt>
                    <dd className="font-semibold">{vehiculo.numeroStock}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <dt className="sr-only">Placa</dt>
                    <dd className="font-semibold">
                      {vehiculo.placa?.trim() ? vehiculo.placa.toUpperCase() : 'Sin placa'}
                    </dd>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <dt className="sr-only">VIN</dt>
                    <dd className="truncate font-mono text-xs">{vehiculo.vin}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Ubicación y kilometraje
              </h3>
              <dl className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-blue-50 p-3 text-center">
                  <dt className="text-xs font-semibold text-slate-700">Kilometraje</dt>
                  <dd className="mt-1 text-base font-black text-blue-800">
                    {`${formateadorKilometraje.format(vehiculo.kilometraje)} km`}
                  </dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-center">
                  <dt className="text-xs font-semibold text-slate-700">Zona</dt>
                  <dd className="mt-1 text-base font-black text-slate-800">{vehiculo.zonaLote}</dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-center">
                  <dt className="text-xs font-semibold text-slate-700">Cajón</dt>
                  <dd className="mt-1 text-base font-black text-slate-800">{vehiculo.cajonLote}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Especificaciones
              </h3>
              <dl className="mt-3 space-y-2 text-sm text-slate-600">
                {vehiculo.version && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="flex items-center gap-2 font-semibold">
                      <Car className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      Versión
                    </dt>
                    <dd className="text-right">{mostrarDato(vehiculo.version)}</dd>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Settings className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    Motor
                  </dt>
                  <dd className="text-right">{mostrarDato(vehiculo.motor)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Gauge className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    Potencia
                  </dt>
                  <dd className="text-right">{mostrarDato(vehiculo.potencia)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Settings className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    Transmisión
                  </dt>
                  <dd className="text-right">{mostrarDato(vehiculo.transmision)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Car className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    Color exterior
                  </dt>
                  <dd className="text-right">{mostrarDato(vehiculo.colorExterior)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Car className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    Color interior
                  </dt>
                  <dd className="text-right">{mostrarDato(vehiculo.colorInterior)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Equipamiento
              </h3>
              <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {mostrarDato(vehiculo.equipamiento)}
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Notas de inspección
              </h3>
              <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {mostrarDato(vehiculo.notasInspeccion)}
              </p>
            </section>

            {vehiculo.registradoPor && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Auditoría de recepción
                </h3>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <UserCheck className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span>{`Registrado por: ${vehiculo.registradoPor}`}</span>
                </p>
              </section>
            )}

            {puedeEditar && (
              <section className="space-y-3">
                <button
                  type="button"
                  disabled
                  title={MENSAJES.moduloProximamente}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <ToggleLeft className="h-4 w-4" aria-hidden="true" />
                  Cambiar Estado Operativo
                </button>

                {ROLES_CON_EDICION.includes(rol) && (
                  <button
                    type="button"
                    disabled
                    title={MENSAJES.moduloProximamente}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Editar Kilometraje / Datos
                  </button>
                )}
              </section>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{`${vehiculo.zonaLote} - Cajón ${vehiculo.cajonLote}`}</span>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
