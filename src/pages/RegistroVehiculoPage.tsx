import { type FormEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Car,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { OfflineBanner } from '../components/OfflineBanner'
import { obtenerMarcas } from '../config/marcasModelos'
import { useEsMovil } from '../hooks/useMediaQuery'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useRegistroVehiculoForm } from '../hooks/useRegistroVehiculoForm'
import { useAuthStore } from '../stores/authStore'
import { EstadoOperativo, TipoVehiculo } from '../types/vehiculo'

const ROLES_CON_ALTA_VEHICULO = ['Encargado de Lote y Recepción', 'Administrador']

const ESTADOS_ALTA: { valor: EstadoOperativo; etiqueta: string }[] = [
  { valor: EstadoOperativo.Disponible, etiqueta: 'Disponible' },
  { valor: EstadoOperativo.EnTaller, etiqueta: 'En Taller' },
  { valor: EstadoOperativo.EnLavado, etiqueta: 'En Lavado' },
  { valor: EstadoOperativo.TestDrive, etiqueta: 'En Prueba de Manejo' },
  { valor: EstadoOperativo.Reservado, etiqueta: 'Reservado' },
]

const ZONAS_SUGERIDAS = ['Zona A', 'Zona B', 'Zona C', 'Taller', 'Lavado']
const TRANSMISIONES_SUGERIDAS = ['Automática', 'Manual', 'CVT', 'Doble Embrague (DCT)']

export function RegistroVehiculoPage() {
  const navigate = useNavigate()
  const rol = useAuthStore((estado) => estado.usuario?.rol ?? '')
  const esMovil = useEsMovil()
  const enLinea = useOnlineStatus()

  const {
    campos,
    errores,
    tocado,
    guardando,
    mensajeError,
    vehiculoDuplicadoId,
    pasoActual,
    anioMaximo,
    modelosDisponibles,
    cambiarCampo,
    siguientePaso,
    pasoAnterior,
    irAlPaso,
    manejarEnvio,
  } = useRegistroVehiculoForm()

  const puedeRegistrar = ROLES_CON_ALTA_VEHICULO.includes(rol)
  const esNuevo = campos.tipo === TipoVehiculo.Nuevo
  const listaMarcas = obtenerMarcas()

  if (!puedeRegistrar) {
    return (
      <main className="showroom-page">
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <SpotlightCard tone="coral" className="max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-rose-500/20 border border-rose-400/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
              Acceso Restringido
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--ink-2)' }}>
              Solo el personal con rol de <strong>Encargado de Lote y Recepción</strong> o{' '}
              <strong>Administrador</strong> tiene autorización para dar de alta unidades en el inventario.
            </p>
            <button
              type="button"
              onClick={() => navigate('/catalogo')}
              className="btn-squish w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Catálogo
            </button>
          </SpotlightCard>
        </div>
      </main>
    )
  }

  // Renderizador de campos del Paso 1: Identificación básica
  const renderPaso1 = () => (
    <div className="space-y-6">
      <div>
        <label
          className="block text-xs font-extrabold uppercase tracking-wider mb-2"
          style={{ color: 'var(--ink-2)' }}
        >
          Condición de la Unidad <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cambiarCampo('tipo', TipoVehiculo.Seminuevo)}
            className={`btn-squish p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
              campos.tipo === TipoVehiculo.Seminuevo
                ? 'border-sky-400 bg-sky-500/20 shadow-md'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <Car
              className={`w-5 h-5 ${
                campos.tipo === TipoVehiculo.Seminuevo ? 'text-sky-400' : 'opacity-60'
              }`}
            />
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                Seminuevo
              </div>
              <div className="text-xs" style={{ color: 'var(--ink-2)' }}>
                Requiere placa y odómetro
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => cambiarCampo('tipo', TipoVehiculo.Nuevo)}
            className={`btn-squish p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
              campos.tipo === TipoVehiculo.Nuevo
                ? 'border-emerald-400 bg-emerald-500/20 shadow-md'
                : 'border-white/15 bg-white/5 hover:border-white/30'
            }`}
          >
            <Sparkles
              className={`w-5 h-5 ${
                campos.tipo === TipoVehiculo.Nuevo ? 'text-emerald-400' : 'opacity-60'
              }`}
            />
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                Nuevo de Planta
              </div>
              <div className="text-xs" style={{ color: 'var(--ink-2)' }}>
                Km 0, sin placa previa
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* VIN */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="vin"
              className="block text-xs font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--ink-2)' }}
            >
              Número de Identificación Vehicular (VIN) <span className="text-rose-400">*</span>
            </label>
            <span className="text-xs font-mono" style={{ color: 'var(--ink-3)' }}>
              {campos.vin.length}/17
            </span>
          </div>
          <input
            id="vin"
            type="text"
            maxLength={17}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="Ej. 3N1AB7AP6HY123456"
            value={campos.vin}
            onChange={(e) =>
              cambiarCampo(
                'vin',
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-HJ-NPR-Z0-9]/g, '')
                  .slice(0, 17),
              )
            }
            className={`campo-base font-mono uppercase tracking-wider text-sm py-2.5 ${
              errores.vin && tocado.vin ? 'campo-invalido' : 'campo-valido'
            }`}
          />
          {errores.vin && tocado.vin && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.vin}
            </p>
          )}
        </div>

        {/* Marca */}
        <div>
          <label
            htmlFor="marca"
            className="block text-xs font-extrabold uppercase tracking-wider mb-1"
            style={{ color: 'var(--ink-2)' }}
          >
            Marca <span className="text-rose-400">*</span>
          </label>
          <select
            id="marca"
            value={campos.marca}
            onChange={(e) => cambiarCampo('marca', e.target.value)}
            className={`campo-base text-sm py-2.5 ${
              errores.marca && tocado.marca ? 'campo-invalido' : 'campo-valido'
            }`}
          >
            <option value="">Selecciona una marca...</option>
            {listaMarcas.map((marca) => (
              <option key={marca} value={marca}>
                {marca}
              </option>
            ))}
          </select>
          {errores.marca && tocado.marca && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.marca}
            </p>
          )}
        </div>

        {/* Modelo */}
        <div>
          <label
            htmlFor="modelo"
            className="block text-xs font-extrabold uppercase tracking-wider mb-1"
            style={{ color: 'var(--ink-2)' }}
          >
            Modelo <span className="text-rose-400">*</span>
          </label>
          <select
            id="modelo"
            disabled={!campos.marca}
            value={campos.modelo}
            onChange={(e) => cambiarCampo('modelo', e.target.value)}
            className={`campo-base text-sm py-2.5 ${
              errores.modelo && tocado.modelo ? 'campo-invalido' : 'campo-valido'
            }`}
          >
            <option value="">
              {!campos.marca ? 'Selecciona primero una marca' : 'Selecciona un modelo...'}
            </option>
            {modelosDisponibles.map((modelo) => (
              <option key={modelo} value={modelo}>
                {modelo}
              </option>
            ))}
          </select>
          {errores.modelo && tocado.modelo && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.modelo}
            </p>
          )}
        </div>

        {/* Año */}
        <div>
          <label
            htmlFor="anio"
            className="block text-xs font-extrabold uppercase tracking-wider mb-1"
            style={{ color: 'var(--ink-2)' }}
          >
            Año Modelo <span className="text-rose-400">*</span>
          </label>
          <input
            id="anio"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder={`1990 - ${anioMaximo}`}
            value={campos.anio}
            onChange={(e) => cambiarCampo('anio', e.target.value.replace(/\D/g, '').slice(0, 4))}
            className={`campo-base text-sm py-2.5 ${
              errores.anio && tocado.anio ? 'campo-invalido' : 'campo-valido'
            }`}
          />
          {errores.anio && tocado.anio && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.anio}
            </p>
          )}
        </div>

        {/* Versión */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="version"
              className="block text-xs font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--ink-2)' }}
            >
              Versión / Nivel de Paquete
            </label>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {campos.version.length}/100
            </span>
          </div>
          <input
            id="version"
            type="text"
            maxLength={100}
            placeholder="Ej. Touring, XLE, Platinum"
            value={campos.version}
            onChange={(e) => cambiarCampo('version', e.target.value)}
            className="campo-base campo-valido text-sm py-2.5"
          />
        </div>

        {/* Placa */}
        {!esNuevo && (
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="placa"
                className="block text-xs font-extrabold uppercase tracking-wider"
                style={{ color: 'var(--ink-2)' }}
              >
                Placa de Circulación <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs font-mono" style={{ color: 'var(--ink-3)' }}>
                {campos.placa.length}/10
              </span>
            </div>
            <input
              id="placa"
              type="text"
              maxLength={10}
              autoCapitalize="characters"
              placeholder="Ej. ABC-123-D"
              value={campos.placa}
              onChange={(e) =>
                cambiarCampo(
                  'placa',
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9-]/g, '')
                    .slice(0, 10),
                )
              }
              className={`campo-base font-mono uppercase tracking-wider text-sm py-2.5 ${
                errores.placa && tocado.placa ? 'campo-invalido' : 'campo-valido'
              }`}
            />
            {errores.placa && tocado.placa && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errores.placa}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // Renderizador de campos del Paso 2: Mecánica y Carrocería
  const renderPaso2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="kilometraje"
            className="block text-xs font-extrabold uppercase tracking-wider mb-1"
            style={{ color: 'var(--ink-2)' }}
          >
            Kilometraje (km) <span className="text-rose-400">*</span>
          </label>
          <input
            id="kilometraje"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={7}
            disabled={esNuevo}
            placeholder={esNuevo ? '0 km (Nuevo de planta)' : 'Ej. 35400'}
            value={campos.kilometraje}
            onChange={(e) =>
              cambiarCampo('kilometraje', e.target.value.replace(/\D/g, '').slice(0, 7))
            }
            className={`campo-base text-sm py-2.5 ${
              errores.kilometraje && tocado.kilometraje ? 'campo-invalido' : 'campo-valido'
            }`}
          />
          {errores.kilometraje && tocado.kilometraje && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.kilometraje}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="transmision"
            className="block text-xs font-extrabold uppercase tracking-wider mb-1"
            style={{ color: 'var(--ink-2)' }}
          >
            Transmisión <span className="text-rose-400">*</span>
          </label>
          <select
            id="transmision"
            value={campos.transmision}
            onChange={(e) => cambiarCampo('transmision', e.target.value)}
            className="campo-base campo-valido text-sm py-2.5"
          >
            {TRANSMISIONES_SUGERIDAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="motor"
              className="block text-xs font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--ink-2)' }}
            >
              Motor
            </label>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {campos.motor.length}/100
            </span>
          </div>
          <input
            id="motor"
            type="text"
            maxLength={100}
            placeholder="Ej. 2.0L 4 Cilindros Turbo"
            value={campos.motor}
            onChange={(e) => cambiarCampo('motor', e.target.value)}
            className="campo-base campo-valido text-sm py-2.5"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="potencia"
              className="block text-xs font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--ink-2)' }}
            >
              Potencia (HP)
            </label>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {campos.potencia.length}/50
            </span>
          </div>
          <input
            id="potencia"
            type="text"
            maxLength={50}
            placeholder="Ej. 187 HP @ 6,000 RPM"
            value={campos.potencia}
            onChange={(e) => cambiarCampo('potencia', e.target.value)}
            className="campo-base campo-valido text-sm py-2.5"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="colorExterior"
              className="block text-xs font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--ink-2)' }}
            >
              Color Exterior
            </label>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {campos.colorExterior.length}/50
            </span>
          </div>
          <input
            id="colorExterior"
            type="text"
            maxLength={50}
            placeholder="Ej. Blanco Perla"
            value={campos.colorExterior}
            onChange={(e) => cambiarCampo('colorExterior', e.target.value)}
            className="campo-base campo-valido text-sm py-2.5"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="colorInterior"
              className="block text-xs font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--ink-2)' }}
            >
              Color Interior
            </label>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {campos.colorInterior.length}/50
            </span>
          </div>
          <input
            id="colorInterior"
            type="text"
            maxLength={50}
            placeholder="Ej. Piel Negra"
            value={campos.colorInterior}
            onChange={(e) => cambiarCampo('colorInterior', e.target.value)}
            className="campo-base campo-valido text-sm py-2.5"
          />
        </div>
      </div>
    </div>
  )

  // Renderizador de campos del Paso 3: Estado, Precio, Ubicación y Notas
  const renderPaso3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="precio"
            className="block text-xs font-extrabold uppercase tracking-wider mb-1"
            style={{ color: 'var(--ink-2)' }}
          >
            Precio de Lista (MXN) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-sm"
              style={{ color: 'var(--ink-3)' }}
            >
              $
            </span>
            <input
              id="precio"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={campos.precio}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '')
                const partes = val.split('.')
                if (partes.length <= 2) {
                  cambiarCampo('precio', val)
                }
              }}
              className={`campo-base pl-8 pr-3.5 py-2.5 text-sm ${
                errores.precio && tocado.precio ? 'campo-invalido' : 'campo-valido'
              }`}
            />
          </div>
          {errores.precio && tocado.precio && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.precio}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="estado"
            className="block text-xs font-extrabold uppercase tracking-wider mb-1"
            style={{ color: 'var(--ink-2)' }}
          >
            Estado Operativo Inicial <span className="text-rose-400">*</span>
          </label>
          <select
            id="estado"
            value={campos.estado}
            onChange={(e) => cambiarCampo('estado', e.target.value as EstadoOperativo)}
            className="campo-base campo-valido text-sm py-2.5"
          >
            {ESTADOS_ALTA.map((est) => (
              <option key={est.valor} value={est.valor}>
                {est.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="zonaLote"
            className="block text-xs font-extrabold uppercase tracking-wider mb-1"
            style={{ color: 'var(--ink-2)' }}
          >
            Zona del Lote <span className="text-rose-400">*</span>
          </label>
          <select
            id="zonaLote"
            value={campos.zonaLote}
            onChange={(e) => cambiarCampo('zonaLote', e.target.value)}
            className={`campo-base text-sm py-2.5 ${
              errores.zonaLote && tocado.zonaLote ? 'campo-invalido' : 'campo-valido'
            }`}
          >
            {ZONAS_SUGERIDAS.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
          {errores.zonaLote && tocado.zonaLote && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.zonaLote}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="cajonLote"
              className="block text-xs font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--ink-2)' }}
            >
              Cajón / Posición <span className="text-rose-400">*</span>
            </label>
            <span className="text-xs font-mono" style={{ color: 'var(--ink-3)' }}>
              {campos.cajonLote.length}/6
            </span>
          </div>
          <input
            id="cajonLote"
            type="text"
            maxLength={6}
            placeholder="Ej. 14, T-04"
            value={campos.cajonLote}
            onChange={(e) => cambiarCampo('cajonLote', e.target.value.toUpperCase())}
            className={`campo-base text-sm uppercase py-2.5 ${
              errores.cajonLote && tocado.cajonLote ? 'campo-invalido' : 'campo-valido'
            }`}
          />
          {errores.cajonLote && tocado.cajonLote && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.cajonLote}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="equipamiento"
              className="block text-xs font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--ink-2)' }}
            >
              Equipamiento Destacado
            </label>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {campos.equipamiento.length}/500
            </span>
          </div>
          <textarea
            id="equipamiento"
            rows={2}
            maxLength={500}
            placeholder="Ej. Quemacocos eléctrico, Apple CarPlay inalámbrico, cámara 360°, rines 18 pulgadas..."
            value={campos.equipamiento}
            onChange={(e) => cambiarCampo('equipamiento', e.target.value)}
            className="campo-base campo-valido text-sm py-2.5"
          />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="notasInspeccion"
              className="block text-xs font-extrabold uppercase tracking-wider"
              style={{ color: 'var(--ink-2)' }}
            >
              Notas Iniciales de Inspección
            </label>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {campos.notasInspeccion.length}/1000
            </span>
          </div>
          <textarea
            id="notasInspeccion"
            rows={3}
            maxLength={1000}
            placeholder="Observaciones de carrocería, faltantes de accesorios o estado al ingresar al lote..."
            value={campos.notasInspeccion}
            onChange={(e) => cambiarCampo('notasInspeccion', e.target.value)}
            className="campo-base campo-valido text-sm py-2.5"
          />
        </div>
      </div>
    </div>
  )

  return (
    <main className="showroom-page">
      <div className="max-w-5xl mx-auto space-y-6">
        <OfflineBanner visible={!enLinea} />

        {/* Encabezado */}
        <SpotlightCard as="header" tone="ink" className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => navigate('/catalogo')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:underline mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Catálogo
              </button>
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-6 h-6 text-emerald-400" />
                <SplitTitle
                  text="Registrar Nuevo Vehículo"
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                />
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--ink-2)' }}>
                Ingreso de unidad al inventario físico de la concesionaria.
              </p>
            </div>
          </div>
        </SpotlightCard>

        {/* Alerta de VIN duplicado con enlace directo */}
        {vehiculoDuplicadoId && (
          <div className="v-glass tone--orange p-4 rounded-2xl flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-bold" style={{ color: 'var(--ink)' }}>
                Unidad existente con el mismo VIN
              </p>
              <p className="mt-0.5" style={{ color: 'var(--ink-2)' }}>
                Ya existe un vehículo registrado con este VIN en el sistema. Puedes consultar su ficha técnica para
                actualizar sus datos o inspección:
              </p>
              <button
                type="button"
                onClick={() => navigate(`/vehiculo/${vehiculoDuplicadoId}`)}
                className="btn-squish mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 text-slate-950 rounded-xl font-bold shadow-md text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver Ficha Técnica Existente
              </button>
            </div>
          </div>
        )}

        {/* Alerta de Error General */}
        {mensajeError && !vehiculoDuplicadoId && (
          <div
            role="alert"
            className="v-glass tone--coral p-4 rounded-2xl flex items-center gap-3 shadow-lg text-sm font-bold"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Formulario Principal Adaptativo */}
        <form onSubmit={(e: FormEvent) => manejarEnvio(e)} noValidate>
          {esMovil ? (
            <SpotlightCard className="overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div
                  className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--ink-2)' }}
                >
                  <span>Paso {pasoActual} de 3</span>
                  <span>
                    {pasoActual === 1 && 'Identificación'}
                    {pasoActual === 2 && 'Mecánica'}
                    {pasoActual === 3 && 'Lote y Precio'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((paso) => (
                    <button
                      key={paso}
                      type="button"
                      onClick={() => irAlPaso(paso)}
                      className={`h-2 rounded-full transition-all ${
                        paso <= pasoActual ? 'bg-sky-400' : 'bg-white/15'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-5">
                {pasoActual === 1 && renderPaso1()}
                {pasoActual === 2 && renderPaso2()}
                {pasoActual === 3 && renderPaso3()}
              </div>

              <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
                {pasoActual > 1 ? (
                  <button
                    type="button"
                    onClick={pasoAnterior}
                    disabled={guardando}
                    className="v-glass btn-squish px-4 py-2.5 rounded-xl font-bold inline-flex items-center gap-1.5 text-sm"
                    style={{ color: 'var(--ink)' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>
                ) : (
                  <div />
                )}

                {pasoActual < 3 ? (
                  <button
                    type="button"
                    onClick={siguientePaso}
                    className="btn-squish px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold inline-flex items-center gap-1.5 text-sm shadow-lg"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={guardando || !enLinea}
                    className="btn-squish px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition inline-flex items-center gap-2 text-sm shadow-lg disabled:opacity-50"
                  >
                    {guardando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Guardar Unidad
                      </>
                    )}
                  </button>
                )}
              </div>
            </SpotlightCard>
          ) : (
            <div className="space-y-6">
              <SpotlightCard className="p-6">
                <h2
                  className="text-base font-black mb-4 pb-2 border-b border-white/10 flex items-center gap-2"
                  style={{ color: 'var(--ink)' }}
                >
                  <Car className="w-5 h-5 text-sky-400" />
                  1. Identificación y Carrocería
                </h2>
                {renderPaso1()}
              </SpotlightCard>

              <SpotlightCard className="p-6">
                <h2
                  className="text-base font-black mb-4 pb-2 border-b border-white/10 flex items-center gap-2"
                  style={{ color: 'var(--ink)' }}
                >
                  <Wrench className="w-5 h-5 text-emerald-400" />
                  2. Tren Motriz y Especificaciones
                </h2>
                {renderPaso2()}
              </SpotlightCard>

              <SpotlightCard className="p-6">
                <h2
                  className="text-base font-black mb-4 pb-2 border-b border-white/10 flex items-center gap-2"
                  style={{ color: 'var(--ink)' }}
                >
                  <MapPin className="w-5 h-5 text-amber-400" />
                  3. Estado Operativo, Precio y Ubicación
                </h2>
                {renderPaso3()}
              </SpotlightCard>

              <SpotlightCard className="p-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/catalogo')}
                  disabled={guardando}
                  className="v-glass btn-squish px-4 py-2.5 rounded-xl font-bold text-sm"
                  style={{ color: 'var(--ink)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !enLinea}
                  className="btn-squish px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold inline-flex items-center gap-2 text-sm shadow-lg transition hover:brightness-110 disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando Unidad...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Completar Registro
                    </>
                  )}
                </button>
              </SpotlightCard>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
