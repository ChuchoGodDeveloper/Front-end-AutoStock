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

const ZONAS_SUGERIDAS = ['Zona A', 'Zona B', 'Zona C', 'Talleres', 'Lavado']
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
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Restringido</h2>
          <p className="text-slate-600 text-sm mb-6">
            Solo el personal con rol de <strong>Encargado de Lote y Recepción</strong> o{' '}
            <strong>Administrador</strong> tiene autorización para dar de alta unidades en el inventario.
          </p>
          <button
            type="button"
            onClick={() => navigate('/catalogo')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Catálogo
          </button>
        </div>
      </div>
    )
  }

  // Renderizador de campos del Paso 1: Identificación básica
  const renderPaso1 = () => (
    <div className="space-y-6">
      {/* Selector de Tipo: Nuevo vs Seminuevo */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
          Condición de la Unidad <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cambiarCampo('tipo', TipoVehiculo.Seminuevo)}
            className={`p-3.5 rounded-xl border-2 text-left transition flex items-center gap-3 ${
              campos.tipo === TipoVehiculo.Seminuevo
                ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <Car className={`w-5 h-5 ${campos.tipo === TipoVehiculo.Seminuevo ? 'text-blue-600' : 'text-slate-400'}`} />
            <div>
              <div className="font-semibold text-sm">Seminuevo</div>
              <div className="text-xs text-slate-500">Requiere placa y odómetro</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => cambiarCampo('tipo', TipoVehiculo.Nuevo)}
            className={`p-3.5 rounded-xl border-2 text-left transition flex items-center gap-3 ${
              campos.tipo === TipoVehiculo.Nuevo
                ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${campos.tipo === TipoVehiculo.Nuevo ? 'text-blue-600' : 'text-slate-400'}`} />
            <div>
              <div className="font-semibold text-sm">Nuevo de Planta</div>
              <div className="text-xs text-slate-500">Km 0, sin placa previa</div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* VIN */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="vin" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Número de Identificación Vehicular (VIN) <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">{campos.vin.length}/17</span>
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
              cambiarCampo('vin', e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17))
            }
            className={`w-full px-3.5 py-2.5 rounded-xl border font-mono uppercase tracking-wider text-sm transition focus:outline-none focus:ring-2 ${
              errores.vin && tocado.vin
                ? 'border-red-400 bg-red-50/50 focus:ring-red-200 text-red-900'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 bg-white'
            }`}
          />
          {errores.vin && tocado.vin && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.vin}
            </p>
          )}
        </div>

        {/* Marca (Select Dependiente Principal) */}
        <div>
          <label htmlFor="marca" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Marca <span className="text-red-500">*</span>
          </label>
          <select
            id="marca"
            value={campos.marca}
            onChange={(e) => cambiarCampo('marca', e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
              errores.marca && tocado.marca
                ? 'border-red-400 bg-red-50/50 focus:ring-red-200 text-red-900'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 bg-white'
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
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.marca}
            </p>
          )}
        </div>

        {/* Modelo (Select en Cascada) */}
        <div>
          <label htmlFor="modelo" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Modelo <span className="text-red-500">*</span>
          </label>
          <select
            id="modelo"
            disabled={!campos.marca}
            value={campos.modelo}
            onChange={(e) => cambiarCampo('modelo', e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
              errores.modelo && tocado.modelo
                ? 'border-red-400 bg-red-50/50 focus:ring-red-200 text-red-900'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 bg-white'
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
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.modelo}
            </p>
          )}
        </div>

        {/* Año */}
        <div>
          <label htmlFor="anio" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Año Modelo <span className="text-red-500">*</span>
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
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
              errores.anio && tocado.anio
                ? 'border-red-400 bg-red-50/50 focus:ring-red-200 text-red-900'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 bg-white'
            }`}
          />
          {errores.anio && tocado.anio && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.anio}
            </p>
          )}
        </div>

        {/* Versión / Equipamiento */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="version" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Versión / Nivel de Paquete
            </label>
            <span className="text-xs text-slate-400">{campos.version.length}/100</span>
          </div>
          <input
            id="version"
            type="text"
            maxLength={100}
            placeholder="Ej. Touring, XLE, Platinum"
            value={campos.version}
            onChange={(e) => cambiarCampo('version', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
          />
        </div>

        {/* Placas (Condicionales según Nuevo / Seminuevo) */}
        {!esNuevo && (
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="placa" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Placa de Circulación <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">{campos.placa.length}/10</span>
            </div>
            <input
              id="placa"
              type="text"
              maxLength={10}
              autoCapitalize="characters"
              placeholder="Ej. ABC-123-D"
              value={campos.placa}
              onChange={(e) =>
                cambiarCampo('placa', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10))
              }
              className={`w-full px-3.5 py-2.5 rounded-xl border font-mono uppercase tracking-wider text-sm transition focus:outline-none focus:ring-2 ${
                errores.placa && tocado.placa
                  ? 'border-red-400 bg-red-50/50 focus:ring-red-200 text-red-900'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 bg-white'
              }`}
            />
            {errores.placa && tocado.placa && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
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
        {/* Kilometraje */}
        <div>
          <label htmlFor="kilometraje" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Kilometraje (km) <span className="text-red-500">*</span>
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
            onChange={(e) => cambiarCampo('kilometraje', e.target.value.replace(/\D/g, '').slice(0, 7))}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500 ${
              errores.kilometraje && tocado.kilometraje
                ? 'border-red-400 bg-red-50/50 focus:ring-red-200 text-red-900'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 bg-white'
            }`}
          />
          {errores.kilometraje && tocado.kilometraje && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.kilometraje}
            </p>
          )}
        </div>

        {/* Transmisión */}
        <div>
          <label htmlFor="transmision" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Transmisión <span className="text-red-500">*</span>
          </label>
          <select
            id="transmision"
            value={campos.transmision}
            onChange={(e) => cambiarCampo('transmision', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
          >
            {TRANSMISIONES_SUGERIDAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Motor */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="motor" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Motor
            </label>
            <span className="text-xs text-slate-400">{campos.motor.length}/100</span>
          </div>
          <input
            id="motor"
            type="text"
            maxLength={100}
            placeholder="Ej. 2.0L 4 Cilindros Turbo"
            value={campos.motor}
            onChange={(e) => cambiarCampo('motor', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
          />
        </div>

        {/* Potencia */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="potencia" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Potencia (HP)
            </label>
            <span className="text-xs text-slate-400">{campos.potencia.length}/50</span>
          </div>
          <input
            id="potencia"
            type="text"
            maxLength={50}
            placeholder="Ej. 187 HP @ 6,000 RPM"
            value={campos.potencia}
            onChange={(e) => cambiarCampo('potencia', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
          />
        </div>

        {/* Color Exterior */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="colorExterior" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Color Exterior
            </label>
            <span className="text-xs text-slate-400">{campos.colorExterior.length}/50</span>
          </div>
          <input
            id="colorExterior"
            type="text"
            maxLength={50}
            placeholder="Ej. Blanco Perla"
            value={campos.colorExterior}
            onChange={(e) => cambiarCampo('colorExterior', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
          />
        </div>

        {/* Color Interior */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="colorInterior" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Color Interior
            </label>
            <span className="text-xs text-slate-400">{campos.colorInterior.length}/50</span>
          </div>
          <input
            id="colorInterior"
            type="text"
            maxLength={50}
            placeholder="Ej. Piel Negra"
            value={campos.colorInterior}
            onChange={(e) => cambiarCampo('colorInterior', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
          />
        </div>
      </div>
    </div>
  )

  // Renderizador de campos del Paso 3: Estado, Precio, Ubicación y Notas
  const renderPaso3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Precio de Lista */}
        <div>
          <label htmlFor="precio" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Precio de Lista (MXN) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
            <input
              id="precio"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={campos.precio}
              onChange={(e) => {
                // Permitir dígitos y un solo punto decimal
                const val = e.target.value.replace(/[^0-9.]/g, '')
                const partes = val.split('.')
                if (partes.length <= 2) {
                  cambiarCampo('precio', val)
                }
              }}
              className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                errores.precio && tocado.precio
                  ? 'border-red-400 bg-red-50/50 focus:ring-red-200 text-red-900'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 bg-white'
              }`}
            />
          </div>
          {errores.precio && tocado.precio && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.precio}
            </p>
          )}
        </div>

        {/* Estado Operativo */}
        <div>
          <label htmlFor="estado" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Estado Operativo Inicial <span className="text-red-500">*</span>
          </label>
          <select
            id="estado"
            value={campos.estado}
            onChange={(e) => cambiarCampo('estado', e.target.value as EstadoOperativo)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
          >
            {ESTADOS_ALTA.map((est) => (
              <option key={est.valor} value={est.valor}>
                {est.etiqueta}
              </option>
            ))}
          </select>
        </div>

        {/* Zona del Lote */}
        <div>
          <label htmlFor="zonaLote" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Zona del Lote <span className="text-red-500">*</span>
          </label>
          <select
            id="zonaLote"
            value={campos.zonaLote}
            onChange={(e) => cambiarCampo('zonaLote', e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
              errores.zonaLote && tocado.zonaLote
                ? 'border-red-400 bg-red-50/50 focus:ring-red-200 text-red-900'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 bg-white'
            }`}
          >
            {ZONAS_SUGERIDAS.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
          {errores.zonaLote && tocado.zonaLote && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.zonaLote}
            </p>
          )}
        </div>

        {/* Cajón del Lote */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="cajonLote" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Cajón / Posición <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">{campos.cajonLote.length}/20</span>
          </div>
          <input
            id="cajonLote"
            type="text"
            maxLength={20}
            placeholder="Ej. A-12, B-04"
            value={campos.cajonLote}
            onChange={(e) => cambiarCampo('cajonLote', e.target.value.toUpperCase())}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm uppercase transition focus:outline-none focus:ring-2 ${
              errores.cajonLote && tocado.cajonLote
                ? 'border-red-400 bg-red-50/50 focus:ring-red-200 text-red-900'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100 bg-white'
            }`}
          />
          {errores.cajonLote && tocado.cajonLote && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errores.cajonLote}
            </p>
          )}
        </div>

        {/* Equipamiento Adicional */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="equipamiento" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Equipamiento Destacado
            </label>
            <span className="text-xs text-slate-400">{campos.equipamiento.length}/500</span>
          </div>
          <textarea
            id="equipamiento"
            rows={2}
            maxLength={500}
            placeholder="Ej. Quemacocos eléctrico, Apple CarPlay inalámbrico, cámara 360°, rines 18 pulgadas..."
            value={campos.equipamiento}
            onChange={(e) => cambiarCampo('equipamiento', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
          />
        </div>

        {/* Notas de Inspección */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="notasInspeccion" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Notas Iniciales de Inspección
            </label>
            <span className="text-xs text-slate-400">{campos.notasInspeccion.length}/1000</span>
          </div>
          <textarea
            id="notasInspeccion"
            rows={3}
            maxLength={1000}
            placeholder="Observaciones de carrocería, faltantes de accesorios o estado al ingresar al lote..."
            value={campos.notasInspeccion}
            onChange={(e) => cambiarCampo('notasInspeccion', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      <OfflineBanner visible={!enLinea} />

      {/* Encabezado */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/catalogo')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Catálogo
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PlusCircle className="w-7 h-7 text-blue-600" />
            Registrar Nuevo Vehículo
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ingreso de unidad al inventario físico de la concesionaria.
          </p>
        </div>
      </div>

      {/* Alerta de VIN duplicado con enlace directo */}
      {vehiculoDuplicadoId && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Unidad existente con el mismo VIN</p>
            <p className="mt-0.5 text-amber-800">
              Ya existe un vehículo registrado con este VIN en el sistema. Puedes consultar su ficha técnica para
              actualizar sus datos o inspección:
            </p>
            <button
              type="button"
              onClick={() => navigate(`/vehiculo/${vehiculoDuplicadoId}`)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition shadow-sm text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Ficha Técnica Existente
            </button>
          </div>
        </div>
      )}

      {/* Alerta de Error General */}
      {mensajeError && !vehiculoDuplicadoId && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center gap-3 shadow-sm text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* Formulario Principal Adaptativo */}
      <form onSubmit={(e: FormEvent) => manejarEnvio(e)} noValidate>
        {esMovil ? (
          /* ======================================================== */
          /* VISTA ADAPTATIVA MÓVIL: STEPPER ASISTENTE POR PASOS      */
          /* ======================================================== */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Barra de progreso de pasos */}
            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
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
                      paso <= pasoActual ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Contenido del paso actual en móvil */}
            <div className="p-5">
              {pasoActual === 1 && renderPaso1()}
              {pasoActual === 2 && renderPaso2()}
              {pasoActual === 3 && renderPaso3()}
            </div>

            {/* Botones de navegación inferior móvil */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              {pasoActual > 1 ? (
                <button
                  type="button"
                  onClick={pasoAnterior}
                  disabled={guardando}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-100 transition inline-flex items-center gap-1.5 text-sm"
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition inline-flex items-center gap-1.5 text-sm shadow-sm"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={guardando || !enLinea}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition inline-flex items-center gap-2 text-sm shadow-sm disabled:opacity-50"
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
          </div>
        ) : (
          /* ======================================================== */
          /* VISTA ADAPTATIVA DESKTOP: SECCIONES MULTICOLUMNA         */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Sección 1: Identificación */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                1. Identificación y Carrocería
              </h2>
              {renderPaso1()}
            </div>

            {/* Sección 2: Especificaciones Mecánicas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                2. Tren Motriz y Especificaciones
              </h2>
              {renderPaso2()}
            </div>

            {/* Sección 3: Ubicación, Precio y Notas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                3. Estado Operativo, Precio y Ubicación
              </h2>
              {renderPaso3()}
            </div>

            {/* Barra de acciones Desktop */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/catalogo')}
                disabled={guardando}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-100 transition text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || !enLinea}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2 text-sm shadow-md disabled:opacity-50"
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
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
