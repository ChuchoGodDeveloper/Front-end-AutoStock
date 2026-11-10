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
import { LiquidModal, SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { ModalEdicionKilometraje } from '../components/ModalEdicionKilometraje'
import { ModalReubicacion } from '../components/ModalReubicacion'
import { VehicleSilhouette } from '../components/ShowroomWall'
import { ESTILOS_ESTADO } from '../config/estadosOperativos'
import { MENSAJES } from '../config/mensajes'
import { inferirSiluetaVehiculo } from '../hooks/useShowroomEffects'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { OfflineBanner } from '../components/OfflineBanner'
import { guardarFichaTecnicaLocal, leerFichaTecnicaLocal } from '../services/offlineDb'
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
  const enLinea = useOnlineStatus()
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
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false)
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
      void guardarFichaTecnicaLocal(detalle)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        setNoEncontrado(true)
      } else {
        const cache = await leerFichaTecnicaLocal(id)
        if (cache) {
          setVehiculo(cache)
          setEstadoSeleccionado(cache.estado)
          setError(null)
        } else {
          setError(MENSAJES.errorDetalle)
        }
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
    <main className="showroom-page">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <OfflineBanner visible={!enLinea} />
        <SpotlightCard as="header" tone="ink" className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: 'var(--champagne)' }}
              >
                AUTOSTOCK PRO
              </p>
              <SplitTitle text="Ficha Técnica" className="text-2xl font-black tracking-tight" />
              {vehiculo && (
                <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
                  {vehiculo.marca} {vehiculo.modelo}
                  {vehiculo.version ? ` ${vehiculo.version}` : ''} {vehiculo.anio}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="v-glass btn-squish flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition hover:border-sky-400/50"
              style={{ color: 'var(--ink)' }}
            >
              <ArrowLeft className="h-4 w-4 text-sky-400" aria-hidden="true" />
              Volver
            </button>
          </div>
        </SpotlightCard>

        {estadoNavegacion?.recienRegistrado && vehiculo && (
          <div
            role="status"
            className="v-glass tone--green flex items-start gap-2.5 rounded-2xl p-4 text-sm font-semibold shadow-lg"
            style={{ color: 'var(--ink)' }}
          >
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold">Unidad registrada exitosamente</p>
              <p className="text-xs text-emerald-300">
                {`Número de stock asignado: ${vehiculo.numeroStock}`}
              </p>
            </div>
          </div>
        )}

        {vehiculo && !cargando && !inspeccionCompleta && (
          <div
            role="status"
            className="v-glass tone--orange flex items-center justify-between gap-3 rounded-2xl p-4 text-xs font-semibold shadow-lg"
            style={{ color: 'var(--ink)' }}
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-black">Inspección incompleta</p>
                <p style={{ color: 'var(--ink-2)' }}>
                  {`Evidencia obligatoria: ${vehiculo.tomasObligatoriasCompletadas ?? 0}/4 tomas (${vehiculo.porcentajeEvidencia ?? 0}%)`}
                </p>
              </div>
            </div>
            {puedeGestionarFotos && (
              <button
                type="button"
                onClick={() => navigate(`/vehiculo/${vehiculo.id}/evidencia`)}
                className="btn-squish shrink-0 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
              >
                Completar
              </button>
            )}
          </div>
        )}

        {cargando && (
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-8">
            <Car className="h-10 w-10 animate-pulse text-sky-400" aria-hidden="true" />
            <p className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Cargando ficha técnica...
            </p>
          </SpotlightCard>
        )}

        {noEncontrado && (
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-8">
            <Car className="h-10 w-10 text-sky-400" aria-hidden="true" />
            <p className="text-center text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              {MENSAJES.vehiculoNoEncontrado}
            </p>
          </SpotlightCard>
        )}

        {error && !cargando && (
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
              onClick={() => void cargarVehiculo()}
              className="btn-squish flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-rose-500"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </SpotlightCard>
        )}

        {vehiculo && !cargando && (
          <>
            <SpotlightCard
              as="section"
              tone={estiloEstado?.tono ?? 'ink'}
              className="overflow-hidden rounded-3xl"
            >
              <div className="relative h-72 sm:h-80 md:h-96 w-full overflow-hidden border-b border-white/10 bg-black/35">
                {urlImagen ? (
                  <img
                    src={urlImagen}
                    alt={`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`}
                    onError={() => setFotoFallida(true)}
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} sin fotografía`}
                    className="flex h-64 w-full flex-col items-center justify-center px-8"
                  >
                    <VehicleSilhouette
                      tipo={inferirSiluetaVehiculo(vehiculo.marca, vehiculo.modelo)}
                      colorAcento={estiloEstado?.colorAcento ?? '#4DA6FF'}
                      className="h-32 w-full max-w-md"
                    />
                  </div>
                )}

                {imagenActual?.tipoToma && (
                  <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/75 border border-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                    {obtenerEtiquetaToma(imagenActual.tipoToma)}
                  </span>
                )}

                {totalImagenes > 0 && (
                  <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/75 border border-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
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
                      className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white border border-white/20 shadow-lg transition hover:bg-black/90 active:scale-95 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={imagenSiguiente}
                      disabled={indiceImagen === totalImagenes - 1}
                      aria-label="Imagen siguiente"
                      className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white border border-white/20 shadow-lg transition hover:bg-black/90 active:scale-95 disabled:opacity-40"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-xl font-black" style={{ color: 'var(--ink)' }}>
                      {vehiculo.marca} {vehiculo.modelo}
                      {vehiculo.version ? ` ${vehiculo.version}` : ''}
                    </h2>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
                      Modelo {vehiculo.anio}
                    </p>
                  </div>

                  {estiloEstado && (
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold ${estiloEstado.clases}`}
                    >
                      {estiloEstado.etiqueta}
                    </span>
                  )}
                </div>

                <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--champagne)' }}>
                  {formateadorMoneda.format(vehiculo.precio)}
                </p>

                {/* Información de Test Drive o Reserva activa (CA 4, CA 7) */}
                {vehiculo.estado === EstadoOperativo.TestDrive &&
                  vehiculo.responsableTestDrive && (
                    <div className="flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-3.5 py-2.5 text-xs font-bold text-sky-300">
                      <UserCheck className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                      <span>{`Prueba de manejo a cargo de: ${vehiculo.responsableTestDrive}`}</span>
                    </div>
                  )}

                {vehiculo.estado === EstadoOperativo.Reservado && vehiculo.reservadoPorNombre && (
                  <div className="flex items-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/15 px-3.5 py-2.5 text-xs font-bold text-purple-300">
                    <Lock className="h-4 w-4 shrink-0 text-purple-400" aria-hidden="true" />
                    <span>{`Unidad reservada por: ${vehiculo.reservadoPorNombre}`}</span>
                  </div>
                )}

                {/* Quién hizo el último cambio de estado y cuándo (CA 3) */}
                {vehiculo.estadoActualizadoPor && vehiculo.fechaCambioEstado && (
                  <div
                    className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs font-semibold"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    <Clock className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                    <span>
                      {`Estado actualizado por ${vehiculo.estadoActualizadoPor} el ${formatearFechaHora(vehiculo.fechaCambioEstado)}`}
                    </span>
                  </div>
                )}

                <dl
                  className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm pt-2 border-t border-white/10"
                  style={{ color: 'var(--ink-2)' }}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                    <dt className="sr-only">Número de stock</dt>
                    <dd className="font-bold" style={{ color: 'var(--ink)' }}>
                      {vehiculo.numeroStock}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    <dt className="sr-only">Placa</dt>
                    <dd className="font-bold" style={{ color: 'var(--ink)' }}>
                      {vehiculo.placa?.trim() ? vehiculo.placa.toUpperCase() : 'Sin placa'}
                    </dd>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <dt className="sr-only">VIN</dt>
                    <dd className="truncate font-mono text-xs">{vehiculo.vin}</dd>
                  </div>
                </dl>
              </div>
            </SpotlightCard>

            {/* Acciones operativas principales */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mostrarBotonCambioEstado && (
                <button
                  type="button"
                  onClick={abrirModalCambioEstado}
                  className="v-glass tone--blue btn-squish flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider shadow-lg"
                  style={{ color: 'var(--ink)' }}
                >
                  <ToggleLeft className="h-5 w-5 text-sky-400" aria-hidden="true" />
                  Cambiar Estado Operativo
                </button>
              )}

              {puedeGestionarFotos && (
                <button
                  type="button"
                  onClick={() => navigate(`/vehiculo/${vehiculo.id}/evidencia`)}
                  className="btn-squish flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition hover:brightness-110"
                >
                  <Camera className="h-5 w-5" aria-hidden="true" />
                  Agregar fotos ({vehiculo.tomasObligatoriasCompletadas ?? 0}/4 obligatorias)
                </button>
              )}

              {tienePermiso('editar_kilometraje_notas') && (
                <button
                  type="button"
                  disabled={vehiculo.estado === EstadoOperativo.Vendido}
                  title={
                    vehiculo.estado === EstadoOperativo.Vendido
                      ? 'Las unidades con estado Vendido no se pueden editar'
                      : undefined
                  }
                  onClick={() => setModalEdicionAbierto(true)}
                  className="v-glass btn-squish flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ color: 'var(--ink)' }}
                >
                  <Pencil className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  Editar Kilometraje / Datos
                </button>
              )}
            </section>

            {bloqueadoPorReservaDeOtro && (
              <div className="v-glass tone--coral flex items-start gap-2.5 rounded-2xl p-4 text-xs font-semibold">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                <span>
                  {`Esta unidad fue reservada por ${vehiculo.reservadoPorNombre}. Solo quien la reservó, el Gerente de Ventas o el Administrador pueden cambiar su estado.`}
                </span>
              </div>
            )}

            <SpotlightCard as="section" className="p-6">
              <div className="flex items-center justify-between">
                <h3
                  className="text-xs font-extrabold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--ink-2)' }}
                >
                  Ubicación y kilometraje
                </h3>
                {puedeReubicar && (
                  <button
                    type="button"
                    onClick={() => setModalReubicacionAbierto(true)}
                    className="v-glass tone--blue btn-squish flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
                    style={{ color: 'var(--ink)' }}
                  >
                    <MapPin className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                    Reubicar
                  </button>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-sky-500/10 border border-sky-400/25 p-3.5 text-center">
                  <dt className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
                    Kilometraje
                  </dt>
                  <dd className="mt-1 text-base font-black text-sky-400">
                    {`${formateadorKilometraje.format(vehiculo.kilometraje)} km`}
                  </dd>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-center">
                  <dt className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
                    Zona
                  </dt>
                  <dd className="mt-1 text-base font-black" style={{ color: 'var(--ink)' }}>
                    {vehiculo.zonaLote}
                  </dd>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-center">
                  <dt className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
                    Cajón
                  </dt>
                  <dd className="mt-1 text-base font-black" style={{ color: 'var(--ink)' }}>
                    {vehiculo.cajonLote}
                  </dd>
                </div>
              </dl>

              {/* Registro de Verificación de Kilometraje (CA 2) */}
              {vehiculo.kilometrajeActualizadoPor && vehiculo.fechaActualizacionKilometraje && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-sky-500/15 border border-sky-400/30 px-3.5 py-2.5 text-xs font-semibold text-sky-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                  <span>
                    {`Verificado por ${vehiculo.kilometrajeActualizadoPor} el ${formatearFechaHora(vehiculo.fechaActualizacionKilometraje)}`}
                  </span>
                </div>
              )}

              {/* Registro de Última Reubicación (CA 3) */}
              {vehiculo.reubicadoPor && vehiculo.fechaReubicacion && (
                <div
                  className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs font-semibold"
                  style={{ color: 'var(--ink-2)' }}
                >
                  <Clock className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>
                    {`Reubicado por ${vehiculo.reubicadoPor} el ${formatearFechaHora(vehiculo.fechaReubicacion)}`}
                  </span>
                </div>
              )}
            </SpotlightCard>

            <SpotlightCard as="section" className="p-6">
              <h3
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: 'var(--ink-2)' }}
              >
                Especificaciones
              </h3>
              <dl className="mt-4 space-y-2.5 text-sm" style={{ color: 'var(--ink-2)' }}>
                {vehiculo.version && (
                  <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                    <dt className="flex items-center gap-2 font-semibold">
                      <Car className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                      Versión
                    </dt>
                    <dd className="text-right font-bold" style={{ color: 'var(--ink)' }}>
                      {mostrarDato(vehiculo.version)}
                    </dd>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Settings className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                    Motor
                  </dt>
                  <dd className="text-right font-bold" style={{ color: 'var(--ink)' }}>
                    {mostrarDato(vehiculo.motor)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Gauge className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    Potencia
                  </dt>
                  <dd className="text-right font-bold" style={{ color: 'var(--ink)' }}>
                    {mostrarDato(vehiculo.potencia)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Settings className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                    Transmisión
                  </dt>
                  <dd className="text-right font-bold" style={{ color: 'var(--ink)' }}>
                    {mostrarDato(vehiculo.transmision)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Car className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                    Color exterior
                  </dt>
                  <dd className="text-right font-bold" style={{ color: 'var(--ink)' }}>
                    {mostrarDato(vehiculo.colorExterior)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-2 font-semibold">
                    <Car className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                    Color interior
                  </dt>
                  <dd className="text-right font-bold" style={{ color: 'var(--ink)' }}>
                    {mostrarDato(vehiculo.colorInterior)}
                  </dd>
                </div>
              </dl>
            </SpotlightCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SpotlightCard as="section" className="p-6">
                <h3
                  className="text-xs font-extrabold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--ink-2)' }}
                >
                  Equipamiento
                </h3>
                <p
                  className="mt-3 flex items-start gap-2 text-sm leading-relaxed"
                  style={{ color: 'var(--ink)' }}
                >
                  <ClipboardList
                    className="mt-0.5 h-4 w-4 shrink-0 text-sky-400"
                    aria-hidden="true"
                  />
                  {mostrarDato(vehiculo.equipamiento)}
                </p>
              </SpotlightCard>

              <SpotlightCard as="section" className="p-6">
                <h3
                  className="text-xs font-extrabold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--ink-2)' }}
                >
                  Notas de inspección
                </h3>
                <p
                  className="mt-3 flex items-start gap-2 text-sm leading-relaxed"
                  style={{ color: 'var(--ink)' }}
                >
                  <ClipboardList
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                    aria-hidden="true"
                  />
                  {mostrarDato(vehiculo.notasInspeccion)}
                </p>
              </SpotlightCard>
            </div>

            {vehiculo.registradoPor && (
              <SpotlightCard as="section" className="p-5">
                <h3
                  className="text-xs font-extrabold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--ink-2)' }}
                >
                  Auditoría de recepción
                </h3>
                <p
                  className="mt-2 flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--ink)' }}
                >
                  <UserCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>{`Registrado por: ${vehiculo.registradoPor}`}</span>
                </p>
              </SpotlightCard>
            )}

            <div
              className="flex items-center justify-center gap-2 text-xs font-bold"
              style={{ color: 'var(--ink-3)' }}
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{`${vehiculo.zonaLote} - Cajón ${vehiculo.cajonLote}`}</span>
            </div>
          </>
        )}
      </div>

      {/* Modal de Cambio de Estado Operativo (HU-10) renderizado en document.body */}
      <LiquidModal
        open={modalEstadoAbierto && Boolean(vehiculo)}
        ariaLabelledBy="titulo-modal-estado"
      >
        {vehiculo && (
          <div className="v-glass v-glass--thick max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <p
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: 'var(--champagne)' }}
                >
                  Estado en tiempo real
                </p>
                <h2
                  id="titulo-modal-estado"
                  className="text-lg font-black"
                  style={{ color: 'var(--ink)' }}
                >
                  Cambiar Estado Operativo
                </h2>
                <p className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                  {`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} · ${vehiculo.numeroStock}`}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModalCambioEstado}
                disabled={guardandoEstado}
                aria-label="Cerrar ventana"
                className="btn-squish rounded-xl p-1.5 hover:bg-white/10"
                style={{ color: 'var(--ink-2)' }}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {errorCambioEstado && (
              <div
                role="alert"
                className="v-glass tone--coral mt-3 flex items-start gap-2 rounded-2xl p-3 text-xs font-bold"
                style={{ color: 'var(--ink)' }}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
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
                    className={`btn-squish flex w-full flex-col gap-1 rounded-2xl border p-3.5 text-left transition ${
                      estaMarcado
                        ? 'border-sky-400 bg-sky-500/20 ring-1 ring-sky-400'
                        : 'border-white/10 bg-white/5 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black" style={{ color: 'var(--ink)' }}>
                        {opcion.titulo}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {esActual && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
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
                    <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                      {opcion.descripcion}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Acceso a la reubicación de la unidad en el lote desde la misma ventana (Alcance HU-10 -> HU-13) */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div
                  className="flex items-center gap-2 text-xs font-bold"
                  style={{ color: 'var(--ink)' }}
                >
                  <MapPin className="h-4 w-4 text-sky-400" aria-hidden="true" />
                  <span>{`Ubicación actual: ${vehiculo.zonaLote} · Cajón ${vehiculo.cajonLote}`}</span>
                </div>
                {puedeReubicar && (
                  <button
                    type="button"
                    onClick={() => setModalReubicacionAbierto(true)}
                    className="text-xs font-black text-sky-400 underline hover:text-sky-300"
                  >
                    Reubicar en lote
                  </button>
                )}
              </div>
              {avisoReubicacion && (
                <p className="mt-1.5 text-[11px] font-semibold" style={{ color: 'var(--ink-2)' }}>
                  {avisoReubicacion}
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={guardandoEstado}
                onClick={cerrarModalCambioEstado}
                className="v-glass btn-squish rounded-xl px-4 py-3 text-xs font-bold"
                style={{ color: 'var(--ink)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={estadoSeleccionado === vehiculo.estado || guardandoEstado}
                onClick={() => void confirmarCambioEstado()}
                className="btn-squish flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
        )}
      </LiquidModal>

      {vehiculo && (
        <>
          <ModalReubicacion
            abierto={modalReubicacionAbierto}
            vehiculo={vehiculo}
            onCerrar={() => setModalReubicacionAbierto(false)}
            onReubicacionExitosa={(actualizado) => {
              setVehiculo(actualizado)
              actualizarVehiculoEnCatalogo(actualizado)
            }}
          />
          <ModalEdicionKilometraje
            abierto={modalEdicionAbierto}
            vehiculo={vehiculo}
            onCerrar={() => setModalEdicionAbierto(false)}
            onGuardadoExitoso={(actualizado) => {
              setVehiculo(actualizado)
              actualizarVehiculoEnCatalogo(actualizado)
            }}
          />
        </>
      )}
    </main>
  )
}
