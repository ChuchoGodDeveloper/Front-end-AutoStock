import { type FormEvent, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Car,
  ExternalLink,
  Loader2,
  MapPin,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { OfflineBanner } from '../components/OfflineBanner'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { HttpError } from '../services/httpClient'
import { vehiculosService } from '../services/vehiculosService'
import { useAuthStore } from '../stores/authStore'
import { useCatalogoStore } from '../stores/catalogoStore'
import { EstadoOperativo, type RegistrarVehiculoDto, TipoVehiculo } from '../types/vehiculo'

const ROLES_CON_ALTA_VEHICULO = ['Encargado de Lote y Recepción', 'Administrador']

const ESTADOS_ALTA: { valor: EstadoOperativo; etiqueta: string }[] = [
  { valor: EstadoOperativo.Disponible, etiqueta: 'Disponible' },
  { valor: EstadoOperativo.EnTaller, etiqueta: 'En Taller' },
  { valor: EstadoOperativo.EnLavado, etiqueta: 'En Lavado' },
  { valor: EstadoOperativo.TestDrive, etiqueta: 'En Prueba de Manejo' },
  { valor: EstadoOperativo.Reservado, etiqueta: 'Reservado' },
]

const ZONAS_SUGERIDAS = ['Zona A', 'Zona B', 'Zona C', 'Talleres']
const TRANSMISIONES_SUGERIDAS = ['Automática', 'Manual', 'CVT', 'Doble Embrague (DCT)']

const REGEX_VIN = /^[A-HJ-NPR-Z0-9]{17}$/

interface CamposFormulario {
  tipo: TipoVehiculo
  vin: string
  marca: string
  modelo: string
  version: string
  anio: string
  placa: string
  kilometraje: string
  transmision: string
  motor: string
  potencia: string
  colorExterior: string
  colorInterior: string
  precio: string
  estado: EstadoOperativo
  zonaLote: string
  cajonLote: string
  equipamiento: string
  notasInspeccion: string
}

type ErroresCampo = Partial<Record<keyof CamposFormulario, string>>

const ANIO_MINIMO = 1990

export function RegistroVehiculoPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()
  const rol = useAuthStore((estado) => estado.usuario?.rol ?? '')
  const invalidarCatalogo = useCatalogoStore((estado) => estado.invalidarCatalogo)
  const cargarConteosRapidos = useCatalogoStore((estado) => estado.cargarConteosRapidos)

  const anioMaximo = new Date().getFullYear() + 1

  const [campos, setCampos] = useState<CamposFormulario>({
    tipo: TipoVehiculo.Seminuevo,
    vin: '',
    marca: '',
    modelo: '',
    version: '',
    anio: String(new Date().getFullYear()),
    placa: '',
    kilometraje: '',
    transmision: 'Automática',
    motor: '',
    potencia: '',
    colorExterior: '',
    colorInterior: '',
    precio: '',
    estado: EstadoOperativo.Disponible,
    zonaLote: 'Zona A',
    cajonLote: '',
    equipamiento: '',
    notasInspeccion: '',
  })

  const [errores, setErrores] = useState<ErroresCampo>({})
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [vehiculoDuplicadoId, setVehiculoDuplicadoId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const puedeRegistrar = ROLES_CON_ALTA_VEHICULO.includes(rol)
  const esNuevo = campos.tipo === TipoVehiculo.Nuevo

  const actualizarCampo = <K extends keyof CamposFormulario>(
    campo: K,
    valor: CamposFormulario[K],
  ) => {
    setCampos((previo) => ({ ...previo, [campo]: valor }))
    setErrores((previo) => {
      if (!previo[campo]) return previo
      const copia = { ...previo }
      delete copia[campo]
      return copia
    })
    setErrorServidor(null)
    if (campo === 'vin') {
      setVehiculoDuplicadoId(null)
    }
  }

  const cambiarTipoUnidad = (nuevoTipo: TipoVehiculo) => {
    setCampos((previo) => ({
      ...previo,
      tipo: nuevoTipo,
      kilometraje: nuevoTipo === TipoVehiculo.Nuevo ? '0' : previo.kilometraje === '0' ? '' : previo.kilometraje,
      placa: nuevoTipo === TipoVehiculo.Nuevo ? '' : previo.placa,
    }))
    setErrores((previo) => {
      const copia = { ...previo }
      delete copia.placa
      delete copia.kilometraje
      return copia
    })
  }

  const validarFormulario = (): boolean => {
    const nuevosErrores: ErroresCampo = {}
    const vinLimpio = campos.vin.trim().toUpperCase()

    if (!vinLimpio) {
      nuevosErrores.vin = 'El VIN es obligatorio'
    } else if (/[IOQ]/.test(vinLimpio)) {
      nuevosErrores.vin = 'El VIN no puede contener las letras I, O ni Q'
    } else if (!REGEX_VIN.test(vinLimpio)) {
      nuevosErrores.vin = 'El VIN debe tener exactamente 17 caracteres alfanuméricos válidos'
    }

    if (!campos.marca.trim()) {
      nuevosErrores.marca = 'La marca es obligatoria'
    }

    if (!campos.modelo.trim()) {
      nuevosErrores.modelo = 'El modelo es obligatorio'
    }

    const anioNum = Number(campos.anio)
    if (!campos.anio.trim() || !Number.isInteger(anioNum)) {
      nuevosErrores.anio = 'El año es obligatorio'
    } else if (anioNum < ANIO_MINIMO || anioNum > anioMaximo) {
      nuevosErrores.anio = `El año debe estar entre ${ANIO_MINIMO} y ${anioMaximo}`
    }

    if (campos.tipo === TipoVehiculo.Seminuevo) {
      if (!campos.placa.trim()) {
        nuevosErrores.placa = 'La placa es obligatoria para unidades seminuevas'
      }

      const kmNum = Number(campos.kilometraje)
      if (campos.kilometraje.trim() === '' || Number.isNaN(kmNum)) {
        nuevosErrores.kilometraje = 'El kilometraje es obligatorio para unidades seminuevas'
      } else if (kmNum < 0) {
        nuevosErrores.kilometraje = 'El kilometraje no puede ser negativo'
      }
    }

    if (!campos.transmision.trim()) {
      nuevosErrores.transmision = 'La transmisión es obligatoria'
    }

    if (!campos.motor.trim()) {
      nuevosErrores.motor = 'El motor es obligatorio'
    }

    if (!campos.colorExterior.trim()) {
      nuevosErrores.colorExterior = 'El color exterior es obligatorio'
    }

    if (!campos.colorInterior.trim()) {
      nuevosErrores.colorInterior = 'El color interior es obligatorio'
    }

    const precioNum = Number(campos.precio)
    if (!campos.precio.trim() || Number.isNaN(precioNum)) {
      nuevosErrores.precio = 'El precio de venta es obligatorio'
    } else if (precioNum <= 0) {
      nuevosErrores.precio = 'El precio debe ser mayor a $0 MXN'
    }

    if (!campos.zonaLote.trim()) {
      nuevosErrores.zonaLote = 'La zona del lote es obligatoria'
    }

    if (!campos.cajonLote.trim()) {
      nuevosErrores.cajonLote = 'El cajón del lote es obligatorio'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setErrorServidor(null)
    setVehiculoDuplicadoId(null)

    if (!validarFormulario()) {
      return
    }

    setGuardando(true)

    try {
      const payload: RegistrarVehiculoDto = {
        tipo: campos.tipo,
        vin: campos.vin.trim().toUpperCase(),
        marca: campos.marca.trim(),
        modelo: campos.modelo.trim(),
        version: campos.version.trim() || null,
        anio: Number(campos.anio),
        placa: esNuevo ? null : campos.placa.trim().toUpperCase(),
        kilometraje: esNuevo ? 0 : Math.round(Number(campos.kilometraje)),
        transmision: campos.transmision.trim(),
        motor: campos.motor.trim(),
        potencia: campos.potencia.trim() || null,
        colorExterior: campos.colorExterior.trim(),
        colorInterior: campos.colorInterior.trim(),
        precio: Number(campos.precio),
        estado: campos.estado,
        zonaLote: campos.zonaLote.trim(),
        cajonLote: campos.cajonLote.trim().toUpperCase(),
        equipamiento: campos.equipamiento.trim() || null,
        notasInspeccion: campos.notasInspeccion.trim() || null,
      }

      const creado = await vehiculosService.registrarVehiculo(payload)
      invalidarCatalogo()
      void cargarConteosRapidos()
      navigate(`/vehiculo/${creado.id}`, {
        replace: true,
        state: { recienRegistrado: true },
      })
    } catch (err) {
      if (err instanceof HttpError) {
        setErrorServidor(err.message)
        const cuerpo = err.body as Record<string, unknown> | null
        const idExistente =
          typeof cuerpo?.vehiculoId === 'string' ? cuerpo.vehiculoId : null
        if (idExistente) {
          setVehiculoDuplicadoId(idExistente)
          setErrores((previo) => ({ ...previo, vin: err.message }))
        }
      } else {
        setErrorServidor('No fue posible registrar la unidad. Intenta de nuevo.')
      }
    } finally {
      setGuardando(false)
    }
  }

  if (!puedeRegistrar) {
    return (
      <main className="min-h-screen bg-slate-100 pb-10">
        <div className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
          <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  AUTOSTOCK PRO
                </p>
                <h1 className="text-2xl font-black text-slate-900">Registrar Unidad</h1>
              </div>

              <button
                type="button"
                onClick={() => navigate('/dashboard', { replace: true })}
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
              Solo el Encargado de Lote y Recepción o el Administrador pueden dar de alta nuevas
              unidades en el inventario.
            </p>
          </section>
        </div>
      </main>
    )
  }

  const longitudVin = campos.vin.trim().length
  const contieneLetrasProhibidasVin = /[IOQ]/i.test(campos.vin)

  const clasesInput = (tieneError: boolean) =>
    `mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-slate-900 transition focus:outline-none focus:ring-2 ${
      tieneError
        ? 'border-red-500 bg-red-50/40 focus:border-red-600 focus:ring-red-500'
        : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600'
    }`

  return (
    <main className="min-h-screen bg-slate-100 pb-12">
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
        <OfflineBanner visible={!enLinea} />

        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                AUTOSTOCK PRO
              </p>
              <h1 className="text-2xl font-black text-slate-900">Registrar Unidad</h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Recepción e ingreso físico de vehículo al lote
              </p>
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

        {errorServidor && (
          <section
            role="alert"
            className="space-y-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 shadow-sm"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-bold">{errorServidor}</p>
                {vehiculoDuplicadoId && (
                  <p className="text-xs text-red-800">
                    Puedes consultar la ficha técnica de la unidad registrada con este VIN.
                  </p>
                )}
              </div>
            </div>

            {vehiculoDuplicadoId && (
              <button
                type="button"
                onClick={() => navigate(`/vehiculo/${vehiculoDuplicadoId}`)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Ver ficha técnica de la unidad existente
              </button>
            )}
          </section>
        )}

        <form onSubmit={(e) => void manejarEnvio(e)} noValidate className="space-y-5">
          {/* 1. Clasificación e Identificación */}
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                1. Tipo e Identificación
              </h2>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-700">Tipo de unidad *</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cambiarTipoUnidad(TipoVehiculo.Seminuevo)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                    !esNuevo
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Car className="h-4 w-4" aria-hidden="true" />
                  Seminuevo
                </button>
                <button
                  type="button"
                  onClick={() => cambiarTipoUnidad(TipoVehiculo.Nuevo)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                    esNuevo
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Nuevo de planta
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="vin" className="text-xs font-bold text-slate-700">
                  Número de Serie (VIN) *
                </label>
                <span
                  className={`font-mono text-xs font-bold ${
                    longitudVin === 17 && !contieneLetrasProhibidasVin
                      ? 'text-green-700'
                      : 'text-slate-500'
                  }`}
                >
                  {`${longitudVin} / 17`}
                </span>
              </div>
              <input
                id="vin"
                type="text"
                maxLength={17}
                value={campos.vin}
                onChange={(e) =>
                  actualizarCampo(
                    'vin',
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                  )
                }
                placeholder="Ej. 3N1CN7AP9KL887512"
                className={`${clasesInput(Boolean(errores.vin))} font-mono uppercase tracking-wider`}
              />
              {contieneLetrasProhibidasVin && !errores.vin && (
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  El estándar VIN no permite las letras I, O ni Q.
                </p>
              )}
              {errores.vin && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errores.vin}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="marca" className="block text-xs font-bold text-slate-700">
                  Marca *
                </label>
                <input
                  id="marca"
                  type="text"
                  value={campos.marca}
                  onChange={(e) => actualizarCampo('marca', e.target.value)}
                  placeholder="Ej. Nissan"
                  className={clasesInput(Boolean(errores.marca))}
                />
                {errores.marca && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errores.marca}</p>
                )}
              </div>

              <div>
                <label htmlFor="modelo" className="block text-xs font-bold text-slate-700">
                  Modelo *
                </label>
                <input
                  id="modelo"
                  type="text"
                  value={campos.modelo}
                  onChange={(e) => actualizarCampo('modelo', e.target.value)}
                  placeholder="Ej. Versa"
                  className={clasesInput(Boolean(errores.modelo))}
                />
                {errores.modelo && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errores.modelo}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="version" className="block text-xs font-bold text-slate-700">
                  Versión (opcional)
                </label>
                <input
                  id="version"
                  type="text"
                  value={campos.version}
                  onChange={(e) => actualizarCampo('version', e.target.value)}
                  placeholder="Ej. Exclusive"
                  className={clasesInput(false)}
                />
              </div>

              <div>
                <label htmlFor="anio" className="block text-xs font-bold text-slate-700">
                  Año *
                </label>
                <input
                  id="anio"
                  type="number"
                  min={ANIO_MINIMO}
                  max={anioMaximo}
                  value={campos.anio}
                  onChange={(e) => actualizarCampo('anio', e.target.value)}
                  placeholder={String(new Date().getFullYear())}
                  className={clasesInput(Boolean(errores.anio))}
                />
                {errores.anio && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errores.anio}</p>
                )}
              </div>
            </div>

            {!esNuevo ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="placa" className="block text-xs font-bold text-slate-700">
                    Placa *
                  </label>
                  <input
                    id="placa"
                    type="text"
                    value={campos.placa}
                    onChange={(e) => actualizarCampo('placa', e.target.value.toUpperCase())}
                    placeholder="Ej. HMK-421-A"
                    className={`${clasesInput(Boolean(errores.placa))} uppercase`}
                  />
                  {errores.placa && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errores.placa}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="kilometraje" className="block text-xs font-bold text-slate-700">
                    Kilometraje (km) *
                  </label>
                  <input
                    id="kilometraje"
                    type="number"
                    min={0}
                    step={1}
                    value={campos.kilometraje}
                    onChange={(e) => actualizarCampo('kilometraje', e.target.value)}
                    placeholder="Ej. 38500"
                    className={clasesInput(Boolean(errores.kilometraje))}
                  />
                  {errores.kilometraje && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {errores.kilometraje}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-xs font-semibold text-blue-800">
                Unidad nueva de planta: el kilometraje se fija automáticamente en{' '}
                <span className="font-black">0 km</span> y no requiere placa de circulación.
              </div>
            )}
          </section>

          {/* 2. Especificaciones mecánicas y estéticas */}
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                2. Especificaciones y Precio
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="transmision" className="block text-xs font-bold text-slate-700">
                  Transmisión *
                </label>
                <select
                  id="transmision"
                  value={campos.transmision}
                  onChange={(e) => actualizarCampo('transmision', e.target.value)}
                  className={clasesInput(Boolean(errores.transmision))}
                >
                  {TRANSMISIONES_SUGERIDAS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {errores.transmision && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errores.transmision}</p>
                )}
              </div>

              <div>
                <label htmlFor="motor" className="block text-xs font-bold text-slate-700">
                  Motor *
                </label>
                <input
                  id="motor"
                  type="text"
                  value={campos.motor}
                  onChange={(e) => actualizarCampo('motor', e.target.value)}
                  placeholder="Ej. 1.6L 4 Cilindros"
                  className={clasesInput(Boolean(errores.motor))}
                />
                {errores.motor && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errores.motor}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="potencia" className="block text-xs font-bold text-slate-700">
                  Potencia (opcional)
                </label>
                <input
                  id="potencia"
                  type="text"
                  value={campos.potencia}
                  onChange={(e) => actualizarCampo('potencia', e.target.value)}
                  placeholder="Ej. 118 HP"
                  className={clasesInput(false)}
                />
              </div>

              <div>
                <label htmlFor="precio" className="block text-xs font-bold text-slate-700">
                  Precio de venta (MXN) *
                </label>
                <input
                  id="precio"
                  type="number"
                  min={1}
                  step="any"
                  value={campos.precio}
                  onChange={(e) => actualizarCampo('precio', e.target.value)}
                  placeholder="Ej. 289000"
                  className={clasesInput(Boolean(errores.precio))}
                />
                {errores.precio && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errores.precio}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="colorExterior" className="block text-xs font-bold text-slate-700">
                  Color exterior *
                </label>
                <input
                  id="colorExterior"
                  type="text"
                  value={campos.colorExterior}
                  onChange={(e) => actualizarCampo('colorExterior', e.target.value)}
                  placeholder="Ej. Blanco Perlado"
                  className={clasesInput(Boolean(errores.colorExterior))}
                />
                {errores.colorExterior && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {errores.colorExterior}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="colorInterior" className="block text-xs font-bold text-slate-700">
                  Color interior *
                </label>
                <input
                  id="colorInterior"
                  type="text"
                  value={campos.colorInterior}
                  onChange={(e) => actualizarCampo('colorInterior', e.target.value)}
                  placeholder="Ej. Negro Piel"
                  className={clasesInput(Boolean(errores.colorInterior))}
                />
                {errores.colorInterior && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {errores.colorInterior}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 3. Estado, Ubicación y Notas */}
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                3. Ubicación en Lote e Inspección
              </h2>
            </div>

            <div>
              <label htmlFor="estado" className="block text-xs font-bold text-slate-700">
                Estado operativo inicial *
              </label>
              <select
                id="estado"
                value={campos.estado}
                onChange={(e) =>
                  actualizarCampo('estado', e.target.value as EstadoOperativo)
                }
                className={clasesInput(Boolean(errores.estado))}
              >
                {ESTADOS_ALTA.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="zonaLote" className="block text-xs font-bold text-slate-700">
                  Zona del lote *
                </label>
                <select
                  id="zonaLote"
                  value={campos.zonaLote}
                  onChange={(e) => actualizarCampo('zonaLote', e.target.value)}
                  className={clasesInput(Boolean(errores.zonaLote))}
                >
                  {ZONAS_SUGERIDAS.map((zona) => (
                    <option key={zona} value={zona}>
                      {zona}
                    </option>
                  ))}
                </select>
                {errores.zonaLote && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errores.zonaLote}</p>
                )}
              </div>

              <div>
                <label htmlFor="cajonLote" className="block text-xs font-bold text-slate-700">
                  Cajón *
                </label>
                <input
                  id="cajonLote"
                  type="text"
                  value={campos.cajonLote}
                  onChange={(e) => actualizarCampo('cajonLote', e.target.value.toUpperCase())}
                  placeholder="Ej. A-12"
                  className={`${clasesInput(Boolean(errores.cajonLote))} uppercase`}
                />
                {errores.cajonLote && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errores.cajonLote}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="equipamiento" className="block text-xs font-bold text-slate-700">
                Equipamiento destacado (opcional)
              </label>
              <textarea
                id="equipamiento"
                rows={2}
                value={campos.equipamiento}
                onChange={(e) => actualizarCampo('equipamiento', e.target.value)}
                placeholder="Ej. Cámara de reversa, CarPlay, rines de aluminio 17 pulgadas..."
                className={clasesInput(false)}
              />
            </div>

            <div>
              <label htmlFor="notasInspeccion" className="block text-xs font-bold text-slate-700">
                Notas iniciales de inspección (opcional)
              </label>
              <textarea
                id="notasInspeccion"
                rows={2}
                value={campos.notasInspeccion}
                onChange={(e) => actualizarCampo('notasInspeccion', e.target.value)}
                placeholder="Ej. Ingresa sin detalles estéticos, duplicado de llave entregado..."
                className={clasesInput(false)}
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={guardando || !enLinea}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {guardando ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Registrando unidad...
              </>
            ) : (
              <>
                <PlusCircle className="h-5 w-5" aria-hidden="true" />
                Registrar Unidad en Inventario
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
