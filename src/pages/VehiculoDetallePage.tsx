import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Gauge,
  Hash,
  Info,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  RefreshCw,
  Settings,
  Ticket,
  ToggleLeft,
  UserCheck,
  X,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ModalReubicacion } from '../components/ModalReubicacion'
import { ESTILOS_ESTADO } from '../config/estadosOperativos'
import { MENSAJES } from '../config/mensajes'
import { HttpError } from '../services/httpClient'
import { vehiculosService } from '../services/vehiculosService'
import { useAuthStore } from '../stores/authStore'
import { useCatalogoStore } from '../stores/catalogoStore'
import {
  EstadoOperativo,
  obtenerEtiquetaToma,
  type VehiculoDetalle,
} from '../types/vehiculo'

const formateadorMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const formateadorKilometraje = new Intl.NumberFormat('es-MX')

const ROLES_SUPERIORES_RESERVA = ['Gerente de Ventas', 'Administrador']

interface OpcionEstadoModal {
  valor: EstadoOperativo
  titulo: string
  descripcion: string
}

const OPCIONES_CAMBIO_ESTADO: OpcionEstadoModal[] = [
  {
    valor: EstadoOperativo.Disponible,
    titulo: 'Disponible para venta',
    descripcion: 'Unidad lista en piso de exhibición para atención inmediata a clientes.',
  },
  {
    valor: EstadoOperativo.TestDrive,
    titulo: 'Asignado a prueba de manejo (Test Drive)',
    descripcion: 'Quedarás registrado como responsable de la prueba de manejo.',
  },
  {
    valor: EstadoOperativo.EnTaller,
    titulo: 'En taller / mantenimiento',
    descripcion: 'En diagnóstico mecánico, servicio preventivo o reparación.',
  },
  {
    valor: EstadoOperativo.EnLavado,
    titulo: 'En zona de lavado / preparación',
    descripcion: 'En proceso de detallado estético o limpieza para exhibición.',
  },
  {
    valor: EstadoOperativo.Reservado,
    titulo: 'Reservado / apartado',
    descripcion: 'Apartado para un cliente en proceso de negociación.',
  },
]

function mostrarDato(valor: string | null | undefined): string {
  return valor && valor.trim() ? valor.trim() : MENSAJES.sinRegistro
}

function formatearFechaHora(fechaIso?: string | null): string {
  if (!fechaIso) return ''
  const fecha = new Date(fechaIso)
  if (Number.isNaN(fecha.getTime())) return ''
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(fecha)
}

interface EstadoNavegacionDetalle {
  recienRegistrado?: boolean
}

export function VehiculoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const estadoNavegacion = (location.state as EstadoNavegacionDetalle | null) ?? null
  const usuario = useAuthStore((estado) => estado.usuario)
  const rol = usuario?.rol ?? ''
  const tienePermiso = useAuthStore((estado) => estado.tienePermiso)
  const actualizarVehiculoEnCatalogo = useCatalogoStore(
    (estado) => estado.actualizarVehiculoEnCatalogo,
  )

  const [vehiculo, setVehiculo] = useState<VehiculoDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [indiceImagen, setIndiceImagen] = useState(0)
  const [fotoFallida, setFotoFallida] = useState(false)

  // Estado del Modal de Cambio de Estado Operativo (HU-10)
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false)
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoOperativo>(
    EstadoOperativo.Disponible,
  )
  const [guardandoEstado, setGuardandoEstado] = useState(false)
  const [errorCambioEstado, setErrorCambioEstado] = useState<string | null>(null)
  const [avisoReubicacion, setAvisoReubicacion] = useState<string | null>(null)
  const [modalReubicacionAbierto, setModalReubicacionAbierto] = useState(false)
  const puedeReubicar = tienePermiso('asignar_cajon')

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
      setEstadoSeleccionado(detalle.estado)
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

  const abrirModalCambioEstado = () => {
    if (!vehiculo) return
    setEstadoSeleccionado(vehiculo.estado)
    setErrorCambioEstado(null)
    setAvisoReubicacion(null)
    setModalEstadoAbierto(true)
  }

  const cerrarModalCambioEstado = () => {
    if (guardandoEstado) return
    setModalEstadoAbierto(false)
    setErrorCambioEstado(null)
    setAvisoReubicacion(null)
  }

  const confirmarCambioEstado = async () => {
    if (!vehiculo || estadoSeleccionado === vehiculo.estado) return

    setGuardandoEstado(true)
    setErrorCambioEstado(null)

    try {
      const actualizado = await vehiculosService.cambiarEstadoOperativo(vehiculo.id, {
        nuevoEstado: estadoSeleccionado,
      })
      setVehiculo(actualizado)
      actualizarVehiculoEnCatalogo(actualizado)
      setModalEstadoAbierto(false)
    } catch (err) {
      if (err instanceof HttpError) {
        setErrorCambioEstado(err.message)
      } else {
        setErrorCambioEstado('No fue posible actualizar el estado operativo. Intenta de nuevo.')
      }
    } finally {
      setGuardandoEstado(false)
    }
  }

  const estiloEstado = vehiculo ? ESTILOS_ESTADO[vehiculo.estado] : undefined
  const totalImagenes = vehiculo?.imagenes.length ?? 0
  const imagenActual = vehiculo?.imagenes[indiceImagen]
  const urlImagen =
    totalImagenes > 0 && imagenActual && !fotoFallida ? imagenActual.url : null

  const puedeGestionarFotos = tienePermiso('capturar_fotografias')
  const inspeccionCompleta =
    vehiculo?.inspeccionCompleta ?? (vehiculo?.tomasObligatoriasCompletadas ?? 0) >= 4

  // Reglas de negocio HU-10 (CA 7 y CA 8)
  const estaVendido = vehiculo?.estado === EstadoOperativo.Vendido
  const estaReservado = vehiculo?.estado === EstadoOperativo.Reservado
  const esGerenteOAdmin = ROLES_SUPERIORES_RESERVA.includes(rol)

  const tieneDuenoReserva = Boolean(
    vehiculo?.reservadoPorUsuarioId != null || vehiculo?.reservadoPorNombre?.trim(),
  )
  const esMismoUsuarioReserva = Boolean(
    (vehiculo?.reservadoPorUsuarioId != null &&
      usuario?.id != null &&
      vehiculo.reservadoPorUsuarioId === usuario.id) ||
      (!vehiculo?.reservadoPorUsuarioId &&
        vehiculo?.reservadoPorNombre &&
        usuario?.nombreCompleto &&
        vehiculo.reservadoPorNombre.trim().toLowerCase() ===
          usuario.nombreCompleto.trim().toLowerCase()),
  )

  const bloqueadoPorReservaDeOtro =
    estaReservado && tieneDuenoReserva && !esMismoUsuarioReserva && !esGerenteOAdmin

  const puedeCambiarEstado = tienePermiso('cambiar_estado')
  const mostrarBotonCambioEstado = Boolean(
    puedeCambiarEstado && vehiculo && !estaVendido && !bloqueadoPorReservaDeOtro,
  )

  return (
    <main className="min-h-screen bg-slate-100 pb-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8 py-6">
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

        {vehiculo && !cargando && !inspeccionCompleta && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-amber-900 shadow-sm"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-black text-amber-900">Inspección incompleta</p>
                <p className="text-amber-800">
                  {`Evidencia obligatoria: ${vehiculo.tomasObligatoriasCompletadas ?? 0}/4 tomas (${vehiculo.porcentajeEvidencia ?? 0}%)`}
                </p>
              </div>
            </div>
            {puedeGestionarFotos && (
              <button
                type="button"
                onClick={() => navigate(`/vehiculo/${vehiculo.id}/evidencia`)}
                className="shrink-0 rounded-xl bg-amber-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-800"
              >
                Completar
              </button>
            )}
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

                {imagenActual?.tipoToma && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-xs font-bold text-white">
                    {obtenerEtiquetaToma(imagenActual.tipoToma)}
                  </span>
                )}

                {totalImagenes > 0 && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-xs font-bold text-white">
                    {`${indiceImagen + 1}/${totalImagenes}`}
                  </span>
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

                {/* Información de Test Drive o Reserva activa (CA 4, CA 7) */}
                {vehiculo.estado === EstadoOperativo.TestDrive &&
                  vehiculo.responsableTestDrive && (
                    <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900">
                      <UserCheck className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                      <span>{`Prueba de manejo a cargo de: ${vehiculo.responsableTestDrive}`}</span>
                    </div>
                  )}

                {vehiculo.estado === EstadoOperativo.Reservado && vehiculo.reservadoPorNombre && (
                  <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-900">
                    <Lock className="h-4 w-4 shrink-0 text-purple-600" aria-hidden="true" />
                    <span>{`Unidad reservada por: ${vehiculo.reservadoPorNombre}`}</span>
                  </div>
                )}

                {/* Quién hizo el último cambio de estado y cuándo (CA 3) */}
                {vehiculo.estadoActualizadoPor && vehiculo.fechaCambioEstado && (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                    <Clock className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                    <span>
                      {`Estado actualizado por ${vehiculo.estadoActualizadoPor} el ${formatearFechaHora(vehiculo.fechaCambioEstado)}`}
                    </span>
                  </div>
                )}

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

            {/* Acciones operativas principales */}
            <section className="space-y-3">
              {mostrarBotonCambioEstado && (
                <button
                  type="button"
                  onClick={abrirModalCambioEstado}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300 bg-blue-50 px-4 py-3.5 text-sm font-black text-blue-900 shadow-sm transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <ToggleLeft className="h-5 w-5 text-blue-700" aria-hidden="true" />
                  Cambiar Estado Operativo
                </button>
              )}

              {bloqueadoPorReservaDeOtro && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-purple-200 bg-purple-50/70 p-3.5 text-xs font-semibold text-purple-900">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" aria-hidden="true" />
                  <span>
                    {`Esta unidad fue reservada por ${vehiculo.reservadoPorNombre}. Solo quien la reservó, el Gerente de Ventas o el Administrador pueden cambiar su estado.`}
                  </span>
                </div>
              )}

              {puedeGestionarFotos && (
                <button
                  type="button"
                  onClick={() => navigate(`/vehiculo/${vehiculo.id}/evidencia`)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Camera className="h-5 w-5" aria-hidden="true" />
                  Agregar fotos ({vehiculo.tomasObligatoriasCompletadas ?? 0}/4 obligatorias)
                </button>
              )}

              {tienePermiso('editar_kilometraje_notas') && (
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

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Ubicación y kilometraje
                </h3>
                {puedeReubicar && (
                  <button
                    type="button"
                    onClick={() => setModalReubicacionAbierto(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Reubicar
                  </button>
                )}
              </div>
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

              {/* Registro de Última Reubicación (CA 3) */}
              {vehiculo.reubicadoPor && vehiculo.fechaReubicacion && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  <Clock className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <span>
                    {`Reubicado por ${vehiculo.reubicadoPor} el ${formatearFechaHora(vehiculo.fechaReubicacion)}`}
                  </span>
                </div>
              )}
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

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{`${vehiculo.zonaLote} - Cajón ${vehiculo.cajonLote}`}</span>
            </div>
          </>
        )}
      </div>

      {/* Modal de Cambio de Estado Operativo (HU-10) */}
      {modalEstadoAbierto && vehiculo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-estado"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
        >
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Estado en tiempo real
                </p>
                <h2 id="titulo-modal-estado" className="text-lg font-black text-slate-900">
                  Cambiar Estado Operativo
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  {`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} · ${vehiculo.numeroStock}`}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModalCambioEstado}
                disabled={guardandoEstado}
                aria-label="Cerrar ventana"
                className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {errorCambioEstado && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-2xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-900"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                <span>{errorCambioEstado}</span>
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              {OPCIONES_CAMBIO_ESTADO.map((opcion) => {
                const esActual = vehiculo.estado === opcion.valor
                const estaMarcado = estadoSeleccionado === opcion.valor
                const estilo = ESTILOS_ESTADO[opcion.valor]

                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => setEstadoSeleccionado(opcion.valor)}
                    className={`flex w-full flex-col gap-1 rounded-2xl border p-3.5 text-left transition ${
                      estaMarcado
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-slate-900">{opcion.titulo}</span>
                      <div className="flex items-center gap-1.5">
                        {esActual && (
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                            Actual
                          </span>
                        )}
                        {estilo && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${estilo.clases}`}
                          >
                            {estilo.etiqueta}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{opcion.descripcion}</p>
                  </button>
                )
              })}
            </div>

            {/* Acceso a la reubicación de la unidad en el lote desde la misma ventana (Alcance HU-10 -> HU-13) */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MapPin className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <span>{`Ubicación actual: ${vehiculo.zonaLote} · Cajón ${vehiculo.cajonLote}`}</span>
                </div>
                {puedeReubicar && (
                  <button
                    type="button"
                    onClick={() => setModalReubicacionAbierto(true)}
                    className="text-xs font-black text-blue-700 underline hover:text-blue-900"
                  >
                    Reubicar en lote
                  </button>
                )}
              </div>
              {avisoReubicacion && (
                <p className="mt-1.5 text-[11px] font-semibold text-slate-600">
                  {avisoReubicacion}
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={guardandoEstado}
                onClick={cerrarModalCambioEstado}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={estadoSeleccionado === vehiculo.estado || guardandoEstado}
                onClick={() => void confirmarCambioEstado()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardandoEstado ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  'Confirmar cambio'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {vehiculo && (
        <ModalReubicacion
          abierto={modalReubicacionAbierto}
          vehiculo={vehiculo}
          onCerrar={() => setModalReubicacionAbierto(false)}
          onReubicacionExitosa={(actualizado) => {
            setVehiculo(actualizado)
            actualizarVehiculoEnCatalogo(actualizado)
          }}
        />
      )}
    </main>
  )
}
