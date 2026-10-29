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
      <main className="min-h-screen bg-slate-100 pb-10">
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8 py-6">
          <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  AUTOSTOCK PRO
                </p>
                <h1 className="text-2xl font-black text-slate-900">Evidencia Fotográfica</h1>
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

          <section className="flex flex-col items-center gap-3 rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <ShieldAlert className="h-10 w-10 text-red-600" aria-hidden="true" />
            <h2 className="text-base font-black text-red-900">Acceso restringido</h2>
            <p className="text-sm text-red-800">
              Solo el Encargado de Lote y Recepción y el Administrador pueden capturar o eliminar
              evidencia fotográfica de las unidades.
            </p>
          </section>
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
    <main className="min-h-screen bg-slate-100 pb-12">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        <OfflineBanner visible={!enLinea} />

        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                AUTOSTOCK PRO
              </p>
              <h1 className="text-2xl font-black text-slate-900">Evidencia Fotográfica</h1>
              {vehiculo && (
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} · ${vehiculo.numeroStock}`}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/vehiculo/${id}`, { replace: true })}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Ficha
            </button>
          </div>
        </header>

        {cargando && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">
              Cargando evidencia fotográfica...
            </p>
          </section>
        )}

        {noEncontrado && !cargando && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-center text-sm font-semibold text-slate-700">
              {MENSAJES.vehiculoNoEncontrado}
            </p>
          </section>
        )}

        {errorCarga && !cargando && (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-center text-sm font-semibold text-red-700">{errorCarga}</p>
            <button
              type="button"
              onClick={() => void cargarVehiculo()}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </section>
        )}

        {alertaGeneral && (
          <div
            role="alert"
            className="flex items-start justify-between gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-900 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
              <span>{alertaGeneral}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertaGeneral(null)}
              aria-label="Cerrar alerta"
              className="text-red-700 hover:text-red-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {vehiculo && !cargando && (
          <>
            {/* Barra e indicador de avance (CA 1, CA 3, CA 4) */}
            <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Avance de Recepción
                  </h2>
                  <p className="mt-1 text-lg font-black text-slate-900">
                    {`${tomasCompletadas}/4 tomas obligatorias (${porcentajeAvance}%)`}
                  </p>
                </div>

                {inspeccionCompleta ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Evidencia 100%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                    Inspección incompleta
                  </span>
                )}
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    inspeccionCompleta ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${porcentajeAvance}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  {inspeccionCompleta
                    ? 'Las 4 tomas obligatorias han sido capturadas.'
                    : faltantesObligatorias === 1
                      ? 'Falta 1 toma obligatoria'
                      : `Faltan ${faltantesObligatorias} tomas obligatorias`}
                </span>
                <span>{`Total: ${vehiculo.imagenes.length} / ${MAXIMO_FOTOGRAFIAS} fotos`}</span>
              </div>
            </section>

            {/* 4 Tomas Obligatorias */}
            <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Tomas Obligatorias (4)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TOMAS_OBLIGATORIAS.map((toma) => {
                  const imagenGuardada = buscarImagenPorToma(toma.clave)

                  return (
                    <article
                      key={toma.clave}
                      className={`rounded-2xl border p-3.5 transition ${
                        imagenGuardada
                          ? 'border-green-200 bg-green-50/40'
                          : 'border-slate-200 bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">{toma.etiqueta}</h3>
                            {toma.clave === 'Frontal' && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                Portada Catálogo
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-600">{toma.descripcion}</p>
                        </div>

                        {imagenGuardada ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Completada
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            Pendiente
                          </span>
                        )}
                      </div>

                      {imagenGuardada ? (
                        <div className="mt-3 space-y-2.5">
                          <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                            <img
                              src={imagenGuardada.url}
                              alt={`Evidencia ${toma.etiqueta}`}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-2 left-2 rounded-lg bg-slate-900/75 px-2.5 py-1 text-xs font-bold text-white">
                              {toma.etiqueta}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
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
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-50 disabled:opacity-50"
                            >
                              <Camera className="h-4 w-4" aria-hidden="true" />
                              Volver a tomar
                            </button>
                            <button
                              type="button"
                              disabled={!enLinea}
                              onClick={() => setImagenAEliminar(imagenGuardada)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
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
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Camera className="h-4 w-4" aria-hidden="true" />
                          Tomar foto ({toma.etiqueta})
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>

            {/* Fotografías adicionales (hasta 2 adicionales = máximo 6 por unidad) */}
            <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Fotografías Adicionales (Opcional)
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Hasta 2 fotografías extra (máximo 6 fotografías en total por unidad)
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
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
                        className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-slate-900">
                            {definicion.etiqueta}
                          </h3>
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                            Guardada
                          </span>
                        </div>

                        <div className="relative h-36 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                          <img
                            src={imagen.url}
                            alt={definicion.etiqueta}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
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
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-50"
                          >
                            <Camera className="h-4 w-4" aria-hidden="true" />
                            Reemplazar
                          </button>
                          <button
                            type="button"
                            disabled={!enLinea}
                            onClick={() => setImagenAEliminar(imagen)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
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
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-800 transition hover:bg-blue-100 disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                Agregar foto adicional
              </button>
            </section>
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
      {tomaActiva && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-camara"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
        >
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Captura de Evidencia
                </p>
                <h2 id="titulo-modal-camara" className="text-lg font-black text-slate-900">
                  {`Toma: ${tomaActiva.etiqueta}`}
                </h2>
                <p className="text-xs text-slate-500">{tomaActiva.descripcion}</p>
              </div>
              <button
                type="button"
                onClick={cerrarModalCaptura}
                disabled={guardandoFoto}
                aria-label="Cerrar cámara"
                className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Aviso de ayuda cuando no se ha dado permiso de cámara (CA 7) */}
            {permisoCamaraDenegado && mensajeCamara && !previsualizacionBase64 && (
              <div
                role="alert"
                className="space-y-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="font-bold">Permiso de cámara requerido</p>
                    <p>{mensajeCamara}</p>
                    <p className="font-semibold text-amber-800">
                      Tus fotografías guardadas anteriormente están seguras y no se han perdido.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void iniciarCamaraParaToma(tomaActiva)}
                    className="rounded-xl bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800"
                  >
                    Reintentar cámara en vivo
                  </button>
                  <button
                    type="button"
                    onClick={() => inputArchivoRef.current?.click()}
                    className="rounded-xl border border-amber-700 bg-white px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                  >
                    Usar cámara del dispositivo / archivo
                  </button>
                </div>
              </div>
            )}

            {/* Vista en vivo de la cámara */}
            {!previsualizacionBase64 && !permisoCamaraDenegado && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-slate-900">
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Camera className="h-5 w-5" aria-hidden="true" />
                    Tomar foto ahora
                  </button>

                  <button
                    type="button"
                    onClick={() => inputArchivoRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Capturar desde cámara nativa / archivo
                  </button>
                </div>
              </div>
            )}

            {/* Previsualización antes de aceptar y guardar */}
            {previsualizacionBase64 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
                  <img
                    src={previsualizacionBase64}
                    alt={`Previsualización ${tomaActiva.etiqueta}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white">
                    Optimizada (máx. 1600 px)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={guardandoFoto}
                    onClick={() => void iniciarCamaraParaToma(tomaActiva)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Repetir foto
                  </button>
                  <button
                    type="button"
                    disabled={guardandoFoto}
                    onClick={() => void confirmarGuardarFotografia()}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-3 text-xs font-black text-white shadow-md hover:bg-green-700 disabled:opacity-50"
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
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Fotografía (CA 5) */}
      {imagenAEliminar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-eliminar-foto"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
        >
          <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="titulo-eliminar-foto" className="text-base font-black text-slate-900">
                  ¿Eliminar fotografía?
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  {`Se eliminará la toma "${obtenerEtiquetaToma(imagenAEliminar.tipoToma)}" y regresará al estado pendiente para que puedas tomarla de nuevo.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={eliminandoFoto}
                onClick={() => setImagenAEliminar(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminandoFoto}
                onClick={() => void confirmarEliminarFotografia()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
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
        </div>
      )}
    </main>
  )
}
