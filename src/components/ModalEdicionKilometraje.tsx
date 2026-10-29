import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Car,
  Gauge,
  Loader2,
  X,
} from 'lucide-react'
import { HttpError } from '../services/httpClient'
import { vehiculosService } from '../services/vehiculosService'
import { useAuthStore } from '../stores/authStore'
import type { VehiculoDetalle } from '../types/vehiculo'

interface ModalEdicionKilometrajeProps {
  abierto: boolean
  vehiculo: VehiculoDetalle
  onCerrar: () => void
  onGuardadoExitoso: (vehiculoActualizado: VehiculoDetalle) => void
}

const formateadorKilometraje = new Intl.NumberFormat('es-MX')

export function ModalEdicionKilometraje({
  abierto,
  vehiculo,
  onCerrar,
  onGuardadoExitoso,
}: ModalEdicionKilometrajeProps) {
  const usuario = useAuthStore((estado) => estado.usuario)
  const rolNormalizado = usuario?.rol?.trim().toLowerCase() ?? ''
  const esGerenteOAdmin =
    rolNormalizado === 'gerente de ventas' || rolNormalizado === 'administrador'

  const [kilometrajeInput, setKilometrajeInput] = useState('')
  const [notas, setNotas] = useState('')
  const [motivoCorreccion, setMotivoCorreccion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [errorKm, setErrorKm] = useState<string | null>(null)
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null)
  const [mostrarConfirmacionDescarte, setMostrarConfirmacionDescarte] = useState(false)

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (abierto) {
      setKilometrajeInput(String(vehiculo.kilometraje ?? 0))
      setNotas(vehiculo.notasInspeccion ?? '')
      setMotivoCorreccion('')
      setErrorGlobal(null)
      setErrorKm(null)
      setErrorMotivo(null)
      setMostrarConfirmacionDescarte(false)
    }
  }, [abierto, vehiculo.kilometraje, vehiculo.notasInspeccion])

  if (!abierto) return null

  const kmInicial = String(vehiculo.kilometraje ?? 0)
  const notasIniciales = vehiculo.notasInspeccion ?? ''
  const esDirty =
    kilometrajeInput !== kmInicial ||
    notas !== notasIniciales ||
    motivoCorreccion.trim().length > 0

  const kmNumero = Number.parseInt(kilometrajeInput, 10)
  const esNumeroValido = !Number.isNaN(kmNumero) && /^\d+$/.test(kilometrajeInput.trim())
  const esMenorAlActual = esNumeroValido && kmNumero < vehiculo.kilometraje

  const manejarIntentoCerrar = () => {
    if (guardando) return
    if (esDirty) {
      setMostrarConfirmacionDescarte(true)
    } else {
      onCerrar()
    }
  }

  const manejarCambioKm = (valor: string) => {
    // Solo permitir dígitos numéricos
    const soloDigitos = valor.replace(/\D/g, '')
    setKilometrajeInput(soloDigitos)
    setErrorKm(null)
    setErrorGlobal(null)

    if (soloDigitos === '') {
      return
    }

    const num = Number.parseInt(soloDigitos, 10)
    if (num > 999999) {
      setErrorKm('El kilometraje debe ser un número entero entre 0 y 999,999 km')
    } else if (num < vehiculo.kilometraje && !esGerenteOAdmin) {
      setErrorKm(
        `El kilometraje no puede ser menor al registrado (${formateadorKilometraje.format(vehiculo.kilometraje)} km)`,
      )
    }
  }

  const manejarGuardar = async () => {
    setErrorGlobal(null)
    setErrorKm(null)
    setErrorMotivo(null)

    if (!kilometrajeInput.trim() || !esNumeroValido) {
      setErrorKm('Ingresa un kilometraje válido (número entero entre 0 y 999,999 km)')
      return
    }

    if (kmNumero < 0 || kmNumero > 999999) {
      setErrorKm('El kilometraje debe ser un número entero entre 0 y 999,999 km')
      return
    }

    if (esMenorAlActual) {
      if (!esGerenteOAdmin) {
        setErrorKm(
          `El kilometraje no puede ser menor al registrado (${formateadorKilometraje.format(vehiculo.kilometraje)} km)`,
        )
        return
      }

      if (!motivoCorreccion.trim() || motivoCorreccion.trim().length < 5) {
        setErrorMotivo(
          'Debes escribir el motivo de la corrección en las notas para registrar un kilometraje menor',
        )
        return
      }
    }

    if (notas.length > 500) {
      setErrorGlobal('Las notas de inspección no pueden exceder 500 caracteres')
      return
    }

    setGuardando(true)

    try {
      const payload = {
        kilometraje: kmNumero,
        notasInspeccion: notas.trim() ? notas.trim() : null,
        motivoCorreccion: esMenorAlActual ? motivoCorreccion.trim() : null,
      }

      const vehiculoActualizado = await vehiculosService.actualizarKilometrajeYNotas(
        vehiculo.id,
        payload,
      )

      onGuardadoExitoso(vehiculoActualizado)
      onCerrar()
    } catch (err) {
      if (err instanceof HttpError) {
        setErrorGlobal(err.message)
      } else if (err instanceof Error) {
        setErrorGlobal(err.message)
      } else {
        setErrorGlobal('Ocurrió un error al actualizar los datos. Intenta nuevamente.')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-edicion-kilometraje"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Gauge className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="titulo-modal-edicion-kilometraje"
                className="text-base font-black text-slate-900"
              >
                Editar Kilometraje y Notas
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Actualización de inspección física y odómetro
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={guardando}
            onClick={manejarIntentoCerrar}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumen del Vehículo (CA 1) */}
        <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
          {vehiculo.fotoPrincipalUrl ? (
            <img
              src={vehiculo.fotoPrincipalUrl}
              alt={`${vehiculo.marca} ${vehiculo.modelo}`}
              className="h-14 w-16 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
            />
          ) : (
            <div className="flex h-14 w-16 items-center justify-center rounded-xl bg-slate-200 text-slate-500 shrink-0">
              <Car className="h-7 w-7" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-black text-slate-900">
              {vehiculo.marca} {vehiculo.modelo}
              {vehiculo.version ? ` ${vehiculo.version}` : ''}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">{vehiculo.anio}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-[11px] text-slate-500">
                VIN: <strong className="text-slate-700">{vehiculo.vin}</strong>
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-blue-700">Stock: {vehiculo.numeroStock}</span>
            </div>
          </div>
        </div>

        {/* Error Global */}
        {errorGlobal && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-3.5 text-xs font-semibold text-red-900 shadow-xs"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="font-bold">Error al guardar</p>
              <p className="text-red-700 mt-0.5">{errorGlobal}</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="mt-4 space-y-4">
          {/* Campo de Kilometraje */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="input-kilometraje"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Kilometraje (km) <span className="text-red-500">*</span>
              </label>
              <span className="text-xs font-medium text-slate-500">
                Actual:{' '}
                <strong className="text-slate-800">
                  {formateadorKilometraje.format(vehiculo.kilometraje)} km
                </strong>
              </span>
            </div>
            <div className="relative">
              <input
                id="input-kilometraje"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={guardando}
                value={kilometrajeInput}
                onChange={(e) => manejarCambioKm(e.target.value)}
                placeholder="Ej. 45000"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 shadow-xs transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                km
              </span>
            </div>

            {/* Error específico de KM */}
            {errorKm && (
              <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorKm}</span>
              </p>
            )}
          </div>

          {/* Advertencia y campo de motivo para Gerente/Admin si km es menor (CA 4) */}
          {esMenorAlActual && esGerenteOAdmin && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 space-y-2.5">
              <div className="flex items-start gap-2 text-xs font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold">Corrección de kilometraje a la baja</p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Estás registrando un kilometraje menor al actual. Como Gerente o Administrador,
                    debes especificar el motivo de esta corrección.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="input-motivo-correccion"
                    className="block text-[11px] font-bold uppercase tracking-wider text-amber-950"
                  >
                    Motivo de la corrección <span className="text-red-600">*</span>
                  </label>
                  <span className="text-[11px] text-amber-800 font-mono">
                    {motivoCorreccion.length}/500
                  </span>
                </div>
                <textarea
                  id="input-motivo-correccion"
                  rows={2}
                  maxLength={500}
                  disabled={guardando}
                  value={motivoCorreccion}
                  onChange={(e) => {
                    setMotivoCorreccion(e.target.value)
                    setErrorMotivo(null)
                  }}
                  placeholder="Ej. Error de captura al ingresar la unidad en patio..."
                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs transition focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {errorMotivo && (
                  <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMotivo}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Campo de Notas de Inspección (CA 1, CA 6) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="input-notas-inspeccion"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Notas de inspección
              </label>
              <span
                className={`text-xs font-mono font-medium ${
                  notas.length > 480 ? 'text-amber-600 font-bold' : 'text-slate-400'
                }`}
              >
                {notas.length}/500
              </span>
            </div>
            <textarea
              id="input-notas-inspeccion"
              rows={4}
              maxLength={500}
              disabled={guardando}
              value={notas}
              onChange={(e) => {
                setNotas(e.target.value)
                setErrorGlobal(null)
              }}
              placeholder="Detalla observaciones mecánicas, detalles estéticos, estado de llantas, etc."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-xs transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={guardando}
            onClick={manejarIntentoCerrar}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={
              guardando ||
              Boolean(errorKm) ||
              !kilometrajeInput.trim() ||
              (esMenorAlActual && !esGerenteOAdmin) ||
              (esMenorAlActual && esGerenteOAdmin && motivoCorreccion.trim().length < 5)
            }
            onClick={() => void manejarGuardar()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>

      {/* Diálogo de Confirmación de Descarte (CA 7) */}
      {mostrarConfirmacionDescarte && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-dialogo-descarte"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h4 id="titulo-dialogo-descarte" className="text-sm font-black text-slate-900">
                  ¿Descartar cambios?
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tienes modificaciones sin guardar. Si sales ahora, se perderán los cambios realizados.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMostrarConfirmacionDescarte(false)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarConfirmacionDescarte(false)
                  onCerrar()
                }}
                className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
              >
                Descartar y salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
