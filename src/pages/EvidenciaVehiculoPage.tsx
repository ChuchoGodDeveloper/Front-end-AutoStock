import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  ImagePlus,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { LiquidModal, SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { OfflineBanner } from '../components/OfflineBanner'
import { MENSAJES } from '../config/mensajes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { HttpError } from '../services/httpClient'
import { vehiculosService } from '../services/vehiculosService'
import { useAuthStore } from '../stores/authStore'
import { useCatalogoStore } from '../stores/catalogoStore'
import {
  type ImagenVehiculo,
  obtenerEtiquetaToma,
  type TipoTomaFotografica,
  type VehiculoDetalle,
} from '../types/vehiculo'

const ROLES_CON_EVIDENCIA = ['Encargado de Lote y Recepción', 'Administrador']
const LADO_MAXIMO_PX = 1600
const CALIDAD_JPEG = 0.82
const MAXIMO_FOTOGRAFIAS = 6

interface DefinicionToma {
  clave: TipoTomaFotografica
  etiqueta: string
  descripcion: string
  obligatoria: boolean
}

const TOMAS_OBLIGATORIAS: DefinicionToma[] = [
  {
    clave: 'Frontal',
    etiqueta: 'Frontal',
    descripcion: 'Vista frontal completa (se usa como foto principal en catálogo)',
    obligatoria: true,
  },
  {
    clave: 'LateralDerecha',
    etiqueta: 'Lateral derecha',
    descripcion: 'Costado derecho completo de la unidad',
    obligatoria: true,
  },
  {
    clave: 'Trasera',
    etiqueta: 'Trasera',
    descripcion: 'Vista posterior con cajuela y placa',
    obligatoria: true,
  },
  {
    clave: 'TableroOdometro',
    etiqueta: 'Tablero / odómetro',
    descripcion: 'Lectura clara del kilometraje y testigos en tablero',
    obligatoria: true,
  },
]

const TOMAS_ADICIONALES: DefinicionToma[] = [
  {
    clave: 'Adicional1',
    etiqueta: 'Adicional 1',
    descripcion: 'Detalle adicional de interiores, motor o carrocería',
    obligatoria: false,
  },
  {
    clave: 'Adicional2',
    etiqueta: 'Adicional 2',
    descripcion: 'Segunda fotografía adicional opcional',
    obligatoria: false,
  },
]

function formatearFechaHora(fechaIso?: string): string {
  if (!fechaIso) return ''
  const fecha = new Date(fechaIso)
  if (Number.isNaN(fecha.getTime())) return ''
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(fecha)
}

function redimensionarImagen(fuente: HTMLVideoElement | HTMLImageElement): string {
  const anchoOriginal =
    fuente instanceof HTMLVideoElement ? fuente.videoWidth : fuente.naturalWidth || fuente.width
  const altoOriginal =
    fuente instanceof HTMLVideoElement ? fuente.videoHeight : fuente.naturalHeight || fuente.height

  const ladoMayor = Math.max(anchoOriginal, altoOriginal, 1)
  const escala = ladoMayor > LADO_MAXIMO_PX ? LADO_MAXIMO_PX / ladoMayor : 1

  const anchoFinal = Math.max(1, Math.round(anchoOriginal * escala))
  const altoFinal = Math.max(1, Math.round(altoOriginal * escala))

  const canvas = document.createElement('canvas')
  canvas.width = anchoFinal
  canvas.height = altoFinal

  const contexto = canvas.getContext('2d')
  if (!contexto) {
    throw new Error('No fue posible procesar la imagen')
  }

  contexto.drawImage(fuente, 0, 0, anchoFinal, altoFinal)
  return canvas.toDataURL('image/jpeg', CALIDAD_JPEG)
}

function leerArchivoComoImagenRedimensionada(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => {
      const resultado = typeof lector.result === 'string' ? lector.result : ''
      if (!resultado) {
        reject(new Error('No se pudo leer la fotografía seleccionada'))
        return
      }
      const img = new Image()
      img.onload = () => {
        try {
          resolve(redimensionarImagen(img))
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = () => reject(new Error('El archivo seleccionado no es una imagen válida'))
      img.src = resultado
    }
    lector.onerror = () => reject(new Error('Error al leer el archivo de imagen'))
    lector.readAsDataURL(archivo)
  })
}

export function EvidenciaVehiculoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()
  const rol = useAuthStore((estado) => estado.usuario?.rol ?? '')
  const invalidarCatalogo = useCatalogoStore((estado) => estado.invalidarCatalogo)

  const [vehiculo, setVehiculo] = useState<VehiculoDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)

  // Estado de captura de cámara
  const [tomaActiva, setTomaActiva] = useState<DefinicionToma | null>(null)
  const [camaraLista, setCamaraLista] = useState(false)
  const [permisoCamaraDenegado, setPermisoCamaraDenegado] = useState(false)
  const [mensajeCamara, setMensajeCamara] = useState<string | null>(null)
  const [previsualizacionBase64, setPrevisualizacionBase64] = useState<string | null>(null)
  const [guardandoFoto, setGuardandoFoto] = useState(false)

  // Confirmación de eliminación y alertas
  const [imagenAEliminar, setImagenAEliminar] = useState<ImagenVehiculo | null>(null)
  const [eliminandoFoto, setEliminandoFoto] = useState(false)
  const [alertaGeneral, setAlertaGeneral] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputArchivoRef = useRef<HTMLInputElement | null>(null)

  const tienePermisoRol = ROLES_CON_EVIDENCIA.includes(rol)

  const detenerStreamCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCamaraLista(false)
  }, [])

  useEffect(() => {
    return () => {
      detenerStreamCamara()
    }
  }, [detenerStreamCamara])

  const cargarVehiculo = useCallback(async () => {
    if (!id) {
      setNoEncontrado(true)
      setCargando(false)
      return
    }

    setCargando(true)
    setErrorCarga(null)
    setNoEncontrado(false)

    try {
      const detalle = await vehiculosService.obtenerVehiculoPorId(id)
      setVehiculo(detalle)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        setNoEncontrado(true)
      } else {
        setErrorCarga(MENSAJES.errorDetalle)
      }
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    if (tienePermisoRol) {
      void cargarVehiculo()
    }
  }, [cargarVehiculo, tienePermisoRol])

  const iniciarCamaraParaToma = async (definicion: DefinicionToma) => {
    setAlertaGeneral(null)
    setTomaActiva(definicion)
    setPrevisualizacionBase64(null)
    setPermisoCamaraDenegado(false)
    setMensajeCamara(null)
    detenerStreamCamara()

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermisoCamaraDenegado(true)
      setMensajeCamara(
        'Tu navegador no permite abrir la cámara en directo o requiere activar el permiso de cámara.',
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
        audio: false,
      })
      streamRef.current = stream
      setCamaraLista(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setPermisoCamaraDenegado(true)
      setMensajeCamara(
        'La cámara es necesaria para tomar la fotografía de la unidad. Activa el permiso de cámara en el ícono de candado/ajustes de la barra de direcciones de tu navegador y vuelve a presionar Reintentar cámara.',
      )
    }
  }

  useEffect(() => {
    if (camaraLista && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [camaraLista])

  const capturarDesdeVideo = () => {
    if (!videoRef.current) return
    try {
      const dataUrl = redimensionarImagen(videoRef.current)
      setPrevisualizacionBase64(dataUrl)
      detenerStreamCamara()
    } catch {
      setMensajeCamara('No se pudo capturar el cuadro de video. Intenta nuevamente.')
    }
  }

  const manejarSeleccionArchivoRespaldo = async (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return

    try {
      const dataUrl = await leerArchivoComoImagenRedimensionada(archivo)
      setPrevisualizacionBase64(dataUrl)
      setPermisoCamaraDenegado(false)
      setMensajeCamara(null)
      detenerStreamCamara()
    } catch (err) {
      setMensajeCamara(
        err instanceof Error ? err.message : 'No fue posible procesar la fotografía.',
      )
    }
  }

  const cerrarModalCaptura = () => {
    if (guardandoFoto) return
    detenerStreamCamara()
    setTomaActiva(null)
    setPrevisualizacionBase64(null)
    setPermisoCamaraDenegado(false)
    setMensajeCamara(null)
  }

  const confirmarGuardarFotografia = async () => {
    if (!vehiculo || !tomaActiva || !previsualizacionBase64) return

    setGuardandoFoto(true)
    setAlertaGeneral(null)

    try {
      const actualizado = await vehiculosService.guardarFotografia(vehiculo.id, {
        tipoToma: tomaActiva.clave,
        imagenBase64: previsualizacionBase64,
      })
      setVehiculo(actualizado)
      invalidarCatalogo()
      detenerStreamCamara()
      setTomaActiva(null)
      setPrevisualizacionBase64(null)
    } catch (err) {
      if (err instanceof HttpError) {
        setAlertaGeneral(err.message)
      } else {
        setAlertaGeneral('No fue posible guardar la fotografía. Verifica tu conexión.')
      }
    } finally {
      setGuardandoFoto(false)
    }
  }

  const confirmarEliminarFotografia = async () => {
    if (!vehiculo || !imagenAEliminar) return

    setEliminandoFoto(true)
    setAlertaGeneral(null)

    try {
      const actualizado = await vehiculosService.eliminarFotografia(
        vehiculo.id,
        imagenAEliminar.id,
      )
      setVehiculo(actualizado)
      invalidarCatalogo()
      setImagenAEliminar(null)
    } catch (err) {
      if (err instanceof HttpError) {
        setAlertaGeneral(err.message)
      } else {
        setAlertaGeneral('No fue posible eliminar la fotografía.')
      }
    } finally {
      setEliminandoFoto(false)
    }
  }

  const manejarIntentarFotoAdicional = () => {
    if (!vehiculo) return

    if (vehiculo.imagenes.length >= MAXIMO_FOTOGRAFIAS) {
      setAlertaGeneral('Máximo 6 fotografías por unidad')
      return
    }

    const tieneAdicional1 = vehiculo.imagenes.some((img) => img.tipoToma === 'Adicional1')
    const tieneAdicional2 = vehiculo.imagenes.some((img) => img.tipoToma === 'Adicional2')

    if (!tieneAdicional1) {
      void iniciarCamaraParaToma(TOMAS_ADICIONALES[0])
      return
    }

    if (!tieneAdicional2) {
      void iniciarCamaraParaToma(TOMAS_ADICIONALES[1])
      return
    }

    setAlertaGeneral('Máximo 6 fotografías por unidad')
  }

  if (!tienePermisoRol) {
    return (
      <main className="showroom-page">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <SpotlightCard as="header" tone="ink" className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className="text-xs font-extrabold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--champagne)' }}
                >
                  AUTOSTOCK PRO
                </p>
                <SplitTitle text="Evidencia Fotográfica" className="text-2xl font-black" />
              </div>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="v-glass btn-squish flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold"
                style={{ color: 'var(--ink)' }}
              >
                <ArrowLeft className="h-4 w-4 text-sky-400" aria-hidden="true" />
                Volver
              </button>
            </div>
          </SpotlightCard>

          <SpotlightCard
            as="section"
            tone="coral"
            className="flex flex-col items-center gap-3 p-8 text-center"
          >
            <ShieldAlert className="h-10 w-10 text-rose-400" aria-hidden="true" />
            <h2 className="text-base font-black" style={{ color: 'var(--ink)' }}>
              Acceso restringido
            </h2>
            <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
              Solo el Encargado de Lote y Recepción y el Administrador pueden capturar o eliminar
              evidencia fotográfica de las unidades.
            </p>
          </SpotlightCard>
        </div>
      </main>
    )
  }

  const buscarImagenPorToma = (clave: TipoTomaFotografica): ImagenVehiculo | undefined =>
    vehiculo?.imagenes.find((img) => img.tipoToma === clave)

  const tomasCompletadas =
    vehiculo?.tomasObligatoriasCompletadas ??
    TOMAS_OBLIGATORIAS.filter((toma) => Boolean(buscarImagenPorToma(toma.clave))).length
  const porcentajeAvance =
    vehiculo?.porcentajeEvidencia ?? Math.round((tomasCompletadas / 4) * 100)
  const faltantesObligatorias = Math.max(0, 4 - tomasCompletadas)
  const inspeccionCompleta = vehiculo?.inspeccionCompleta ?? tomasCompletadas >= 4
  const fotosAdicionalesGuardadas = TOMAS_ADICIONALES.map((def) => ({
    definicion: def,
    imagen: buscarImagenPorToma(def.clave),
  })).filter((item) => Boolean(item.imagen))

  return (
    <main className="showroom-page">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <OfflineBanner visible={!enLinea} />

        <SpotlightCard as="header" tone="ink" className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: 'var(--champagne)' }}
              >
                AUTOSTOCK PRO
              </p>
              <SplitTitle text="Evidencia Fotográfica" className="text-2xl font-black" />
              {vehiculo && (
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                  {`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} · ${vehiculo.numeroStock}`}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/vehiculo/${id}`, { replace: true })}
              className="v-glass btn-squish flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold"
              style={{ color: 'var(--ink)' }}
            >
              <ArrowLeft className="h-4 w-4 text-sky-400" aria-hidden="true" />
              Ficha
            </button>
          </div>
        </SpotlightCard>

        {cargando && (
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" aria-hidden="true" />
            <p className="text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Cargando evidencia fotográfica...
            </p>
          </SpotlightCard>
        )}

        {noEncontrado && !cargando && (
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-8">
            <p className="text-center text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              {MENSAJES.vehiculoNoEncontrado}
            </p>
          </SpotlightCard>
        )}

        {errorCarga && !cargando && (
          <SpotlightCard
            as="section"
            tone="coral"
            className="flex flex-col items-center gap-3 p-8"
          >
            <p className="text-center text-sm font-bold" style={{ color: 'var(--ink)' }}>
              {errorCarga}
            </p>
            <button
              type="button"
              onClick={() => void cargarVehiculo()}
              className="btn-squish flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-500"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </SpotlightCard>
        )}

        {alertaGeneral && (
          <div
            role="alert"
            className="v-glass tone--coral flex items-start justify-between gap-2.5 rounded-2xl p-4 text-sm font-bold shadow-lg"
            style={{ color: 'var(--ink)' }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" aria-hidden="true" />
              <span>{alertaGeneral}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertaGeneral(null)}
              aria-label="Cerrar alerta"
              className="btn-squish text-rose-300 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {vehiculo && !cargando && (
          <>
            {/* Barra e indicador de avance (CA 1, CA 3, CA 4) */}
            <SpotlightCard
              as="section"
              tone={inspeccionCompleta ? 'green' : 'blue'}
              className="space-y-3 p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2
                    className="text-xs font-extrabold uppercase tracking-[0.2em]"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    Avance de Recepción
                  </h2>
                  <p className="mt-1 text-lg font-black" style={{ color: 'var(--ink)' }}>
                    {`${tomasCompletadas}/4 tomas obligatorias (${porcentajeAvance}%)`}
                  </p>
                </div>

                {inspeccionCompleta ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    Evidencia 100%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
                    Inspección incompleta
                  </span>
                )}
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    inspeccionCompleta ? 'bg-emerald-400' : 'bg-sky-400'
                  }`}
                  style={{ width: `${porcentajeAvance}%` }}
                />
              </div>

              <div
                className="flex items-center justify-between text-xs font-semibold"
                style={{ color: 'var(--ink-2)' }}
              >
                <span>
                  {inspeccionCompleta
                    ? 'Las 4 tomas obligatorias han sido capturadas.'
                    : faltantesObligatorias === 1
                      ? 'Falta 1 toma obligatoria'
                      : `Faltan ${faltantesObligatorias} tomas obligatorias`}
                </span>
                <span>{`Total: ${vehiculo.imagenes.length} / ${MAXIMO_FOTOGRAFIAS} fotos`}</span>
              </div>
            </SpotlightCard>

            {/* 4 Tomas Obligatorias */}
            <SpotlightCard as="section" className="space-y-4 p-6">
              <h2
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: 'var(--ink-2)' }}
              >
                Tomas Obligatorias (4)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TOMAS_OBLIGATORIAS.map((toma) => {
                  const imagenGuardada = buscarImagenPorToma(toma.clave)

                  return (
                    <article
                      key={toma.clave}
                      className={`v-glass rounded-2xl p-4 ${
                        imagenGuardada ? 'tone--green' : 'tone--ink'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black" style={{ color: 'var(--ink)' }}>
                              {toma.etiqueta}
                            </h3>
                            {toma.clave === 'Frontal' && (
                              <span className="rounded-full bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                                Portada Catálogo
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-2)' }}>
                            {toma.descripcion}
                          </p>
                        </div>

                        {imagenGuardada ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Completada
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            Pendiente
                          </span>
                        )}
                      </div>

                      {imagenGuardada ? (
                        <div className="mt-3 space-y-2.5">
                          <div className="relative h-40 w-full overflow-hidden rounded-xl border border-white/15 bg-black/50">
                            <img
                              src={imagenGuardada.url}
                              alt={`Evidencia ${toma.etiqueta}`}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-2 left-2 rounded-lg bg-black/75 px-2.5 py-1 text-xs font-bold text-white">
                              {toma.etiqueta}
                            </span>
                          </div>

                          <div
                            className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold"
                            style={{ color: 'var(--ink-2)' }}
                          >
                            {imagenGuardada.capturadaPor && (
                              <span className="inline-flex items-center gap-1">
                                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                {imagenGuardada.capturadaPor}
                              </span>
                            )}
                            {imagenGuardada.fechaCaptura && (
                              <span>{formatearFechaHora(imagenGuardada.fechaCaptura)}</span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={!enLinea}
                              onClick={() => void iniciarCamaraParaToma(toma)}
                              className="v-glass btn-squish flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-sky-300 disabled:opacity-50"
                            >
                              <Camera className="h-4 w-4" aria-hidden="true" />
                              Volver a tomar
                            </button>
                            <button
                              type="button"
                              disabled={!enLinea}
                              onClick={() => setImagenAEliminar(imagenGuardada)}
                              className="v-glass btn-squish flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-400 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!enLinea}
                          onClick={() => void iniciarCamaraParaToma(toma)}
                          className="btn-squish mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
                        >
                          <Camera className="h-4 w-4" aria-hidden="true" />
                          Tomar foto ({toma.etiqueta})
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            </SpotlightCard>

            {/* Fotografías adicionales (hasta 2 adicionales = máximo 6 por unidad) */}
            <SpotlightCard as="section" className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2
                    className="text-xs font-extrabold uppercase tracking-[0.2em]"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    Fotografías Adicionales (Opcional)
                  </h2>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-2)' }}>
                    Hasta 2 fotografías extra (máximo 6 fotografías en total por unidad)
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">
                  {`${fotosAdicionalesGuardadas.length} / 2`}
                </span>
              </div>

              {fotosAdicionalesGuardadas.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fotosAdicionalesGuardadas.map(({ definicion, imagen }) => {
                    if (!imagen) return null
                    return (
                      <article
                        key={definicion.clave}
                        className="v-glass tone--ink space-y-2.5 rounded-2xl p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black" style={{ color: 'var(--ink)' }}>
                            {definicion.etiqueta}
                          </h3>
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                            Guardada
                          </span>
                        </div>

                        <div className="relative h-36 w-full overflow-hidden rounded-xl border border-white/15 bg-black/50">
                          <img
                            src={imagen.url}
                            alt={definicion.etiqueta}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div
                          className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold"
                          style={{ color: 'var(--ink-2)' }}
                        >
                          {imagen.capturadaPor && <span>{imagen.capturadaPor}</span>}
                          {imagen.fechaCaptura && (
                            <span>{formatearFechaHora(imagen.fechaCaptura)}</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={!enLinea}
                            onClick={() => void iniciarCamaraParaToma(definicion)}
                            className="v-glass btn-squish flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-sky-300"
                          >
                            <Camera className="h-4 w-4" aria-hidden="true" />
                            Reemplazar
                          </button>
                          <button
                            type="button"
                            disabled={!enLinea}
                            onClick={() => setImagenAEliminar(imagen)}
                            className="v-glass btn-squish flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Eliminar
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              <button
                type="button"
                disabled={!enLinea}
                onClick={manejarIntentarFotoAdicional}
                className="v-glass tone--blue btn-squish flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold uppercase tracking-wider disabled:opacity-50"
                style={{ color: 'var(--ink)' }}
              >
                <ImagePlus className="h-4 w-4 text-sky-400" aria-hidden="true" />
                Agregar foto adicional
              </button>
            </SpotlightCard>
          </>
        )}
      </div>

      {/* Input oculto para respaldo de cámara/archivo */}
      <input
        ref={inputArchivoRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => void manejarSeleccionArchivoRespaldo(e)}
        className="hidden"
      />

      {/* Modal de Cámara y Previsualización (CA 2, CA 7) */}
      <LiquidModal
        open={Boolean(tomaActiva)}
        ariaLabelledBy="titulo-modal-camara"
      >
        {tomaActiva && (
          <div className="v-glass v-glass--thick max-h-[85vh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: 'var(--champagne)' }}
                >
                  Captura de Evidencia
                </p>
                <h2
                  id="titulo-modal-camara"
                  className="text-lg font-black"
                  style={{ color: 'var(--ink)' }}
                >
                  {`Toma: ${tomaActiva.etiqueta}`}
                </h2>
                <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                  {tomaActiva.descripcion}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModalCaptura}
                disabled={guardandoFoto}
                aria-label="Cerrar cámara"
                className="btn-squish rounded-xl p-1.5 hover:bg-white/10"
                style={{ color: 'var(--ink-2)' }}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Aviso de ayuda cuando no se ha dado permiso de cámara (CA 7) */}
            {permisoCamaraDenegado && mensajeCamara && !previsualizacionBase64 && (
              <div
                role="alert"
                className="v-glass tone--orange space-y-2.5 rounded-2xl p-4 text-xs"
                style={{ color: 'var(--ink)' }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="font-bold">Permiso de cámara requerido</p>
                    <p style={{ color: 'var(--ink-2)' }}>{mensajeCamara}</p>
                    <p className="font-semibold text-amber-300">
                      Tus fotografías guardadas anteriormente están seguras y no se han perdido.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void iniciarCamaraParaToma(tomaActiva)}
                    className="btn-squish rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950"
                  >
                    Reintentar cámara en vivo
                  </button>
                  <button
                    type="button"
                    onClick={() => inputArchivoRef.current?.click()}
                    className="v-glass btn-squish rounded-xl px-3 py-2 text-xs font-bold"
                    style={{ color: 'var(--ink)' }}
                  >
                    Usar cámara del dispositivo / archivo
                  </button>
                </div>
              </div>
            )}

            {/* Vista en vivo de la cámara */}
            {!previsualizacionBase64 && !permisoCamaraDenegado && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  {!camaraLista && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                      <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                      <span className="text-xs font-semibold">Abriendo cámara...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    disabled={!camaraLista}
                    onClick={capturarDesdeVideo}
                    className="btn-squish flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
                  >
                    <Camera className="h-5 w-5" aria-hidden="true" />
                    Tomar foto ahora
                  </button>

                  <button
                    type="button"
                    onClick={() => inputArchivoRef.current?.click()}
                    className="v-glass btn-squish flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold"
                    style={{ color: 'var(--ink)' }}
                  >
                    Capturar desde cámara nativa / archivo
                  </button>
                </div>
              </div>
            )}

            {/* Previsualización antes de aceptar y guardar */}
            {previsualizacionBase64 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/15 bg-black">
                  <img
                    src={previsualizacionBase64}
                    alt={`Previsualización ${tomaActiva.etiqueta}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white">
                    Optimizada (máx. 1600 px)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={guardandoFoto}
                    onClick={() => void iniciarCamaraParaToma(tomaActiva)}
                    className="v-glass btn-squish flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-bold disabled:opacity-50"
                    style={{ color: 'var(--ink)' }}
                  >
                    Repetir foto
                  </button>
                  <button
                    type="button"
                    disabled={guardandoFoto}
                    onClick={() => void confirmarGuardarFotografia()}
                    className="btn-squish flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-black text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {guardandoFoto ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Aceptar y guardar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </LiquidModal>

      {/* Modal de Confirmación para Eliminar Fotografía (CA 5) */}
      <LiquidModal
        open={Boolean(imagenAEliminar)}
        ariaLabelledBy="titulo-eliminar-foto"
      >
        {imagenAEliminar && (
          <div className="v-glass v-glass--thick max-h-[85vh] w-full max-w-sm space-y-4 overflow-y-auto rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-400/30">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="titulo-eliminar-foto"
                  className="text-base font-black"
                  style={{ color: 'var(--ink)' }}
                >
                  ¿Eliminar fotografía?
                </h2>
                <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>
                  {`Se eliminará la toma "${obtenerEtiquetaToma(imagenAEliminar.tipoToma)}" y regresará al estado pendiente para que puedas tomarla de nuevo.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={eliminandoFoto}
                onClick={() => setImagenAEliminar(null)}
                className="v-glass btn-squish rounded-xl px-4 py-2.5 text-xs font-bold"
                style={{ color: 'var(--ink)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminandoFoto}
                onClick={() => void confirmarEliminarFotografia()}
                className="btn-squish flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {eliminandoFoto ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Eliminando...
                  </>
                ) : (
                  'Sí, eliminar'
                )}
              </button>
            </div>
          </div>
        )}
      </LiquidModal>
    </main>
  )
}
