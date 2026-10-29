import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, MapPin, X } from 'lucide-react'
import { HttpError } from '../services/httpClient'
import { vehiculosService } from '../services/vehiculosService'
import type { VehiculoDetalle } from '../types/vehiculo'

const ZONAS_POR_DEFECTO = ['Zona A', 'Zona B', 'Zona C', 'Taller', 'Lavado']

interface ModalReubicacionProps {
  abierto: boolean
  vehiculo: {
    id: string
    marca: string
    modelo: string
    zonaLote: string
    cajonLote: string
  }
  onCerrar: () => void
  onReubicacionExitosa: (vehiculoActualizado: VehiculoDetalle) => void
}

export function ModalReubicacion({
  abierto,
  vehiculo,
  onCerrar,
  onReubicacionExitosa,
}: ModalReubicacionProps) {
  const [zonaSeleccionada, setZonaSeleccionada] = useState(vehiculo.zonaLote || 'Zona A')
  const [cajon, setCajon] = useState(vehiculo.cajonLote || '')
  const [zonasDisponibles, setZonasDisponibles] = useState<string[]>(ZONAS_POR_DEFECTO)
  const [guardando, setGuardando] = useState(false)
  const [errorOcupado, setErrorOcupado] = useState<string | null>(null)
  const [errorZona, setErrorZona] = useState<string | null>(null)
  const [errorCajon, setErrorCajon] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      setZonaSeleccionada(vehiculo.zonaLote || 'Zona A')
      setCajon(vehiculo.cajonLote || '')
      setErrorOcupado(null)
      setErrorZona(null)
      setErrorCajon(null)

      void vehiculosService
        .obtenerZonas()
        .then((zonas) => {
          if (Array.isArray(zonas) && zonas.length > 0) {
            setZonasDisponibles(zonas)
          }
        })
        .catch(() => {
          // Se conservan zonas por defecto si falla la petición
        })
    }
  }, [abierto, vehiculo.zonaLote, vehiculo.cajonLote])

  if (!abierto) return null

  const cajonNormalizado = cajon.trim().toUpperCase()
  const esMismaUbicacion =
    zonaSeleccionada.trim().toLowerCase() === vehiculo.zonaLote.trim().toLowerCase() &&
    cajonNormalizado === vehiculo.cajonLote.trim().toUpperCase()

  const estaDeshabilitado =
    guardando ||
    !zonaSeleccionada.trim() ||
    !cajonNormalizado ||
    esMismaUbicacion

  const manejarConfirmar = async () => {
    setErrorOcupado(null)
    setErrorZona(null)
    setErrorCajon(null)

    let hayErrores = false

    if (!zonaSeleccionada.trim()) {
      setErrorZona('Selecciona una zona del lote')
      hayErrores = true
    }

    if (!cajonNormalizado) {
      setErrorCajon('Ingresa la clave o número de cajón')
      hayErrores = true
    } else if (cajonNormalizado.length > 6) {
      setErrorCajon('El cajón no puede exceder 6 caracteres')
      hayErrores = true
    }

    if (hayErrores || esMismaUbicacion) return

    setGuardando(true)

    try {
      const actualizado = await vehiculosService.reubicarVehiculo(vehiculo.id, {
        zona: zonaSeleccionada.trim(),
        cajon: cajonNormalizado,
      })
      onReubicacionExitosa(actualizado)
      onCerrar()
    } catch (err) {
      if (err instanceof HttpError) {
        setErrorOcupado(err.message)
      } else if (err instanceof Error) {
        setErrorOcupado(err.message)
      } else {
        setErrorOcupado('Ocurrió un error al intentar reubicar la unidad. Intenta de nuevo.')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-reubicacion"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="titulo-modal-reubicacion" className="text-base font-black text-slate-900">
                Reubicar Unidad en el Lote
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                {`${vehiculo.marca} ${vehiculo.modelo}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={guardando}
            onClick={onCerrar}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Indicador de Ubicación Actual */}
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Ubicación actual de la unidad
          </p>
          <p className="mt-0.5 text-sm font-black text-slate-900">
            {`${vehiculo.zonaLote || 'Sin zona'} · Cajón ${vehiculo.cajonLote || 'N/A'}`}
          </p>
        </div>

        {/* Alerta de Cajón Ocupado o Error */}
        {errorOcupado && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-3.5 text-xs font-semibold text-red-900 shadow-xs"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="font-bold">El cajón ya está ocupado</p>
              <p className="text-red-700 mt-0.5">{errorOcupado}</p>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Selector de Zona */}
          <div>
            <label
              htmlFor="selector-zona-lote"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
            >
              Nueva Zona <span className="text-red-500">*</span>
            </label>
            <select
              id="selector-zona-lote"
              disabled={guardando}
              value={zonaSeleccionada}
              onChange={(e) => {
                setZonaSeleccionada(e.target.value)
                setErrorZona(null)
                setErrorOcupado(null)
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {zonasDisponibles.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            {errorZona && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorZona}
              </p>
            )}
          </div>

          {/* Campo de Cajón */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="input-cajon-lote"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Nuevo Cajón <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {cajonNormalizado.length}/6
              </span>
            </div>
            <input
              id="input-cajon-lote"
              type="text"
              disabled={guardando}
              maxLength={6}
              placeholder="Ej. 14, T-04"
              value={cajon}
              onChange={(e) => {
                setCajon(e.target.value.toUpperCase())
                setErrorCajon(null)
                setErrorOcupado(null)
              }}
              className="w-full uppercase rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {errorCajon && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorCajon}
              </p>
            )}
            {esMismaUbicacion && (
              <p className="mt-1 text-[11px] font-medium text-amber-700">
                La unidad ya se encuentra en esta zona y cajón.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={guardando}
            onClick={onCerrar}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={estaDeshabilitado}
            onClick={() => void manejarConfirmar()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
