import { useState } from 'react'
import { AlertCircle, Calendar, DollarSign, User, Wrench, X } from 'lucide-react'
import { LiquidModal } from './LiquidUI'
import type { CrearOrdenServicioPayload } from '../types/ordenServicio'

interface ModalCrearOrdenServicioProps {
  open: boolean
  vehiculoTitulo: string
  numeroStock: string
  onClose: () => void
  onSubmit: (payload: CrearOrdenServicioPayload) => Promise<void>
  cargando: boolean
  error: string | null
}

const TIPOS_TRABAJO = [
  'Mecánico',
  'Estético',
  'Mecánico y estético',
] as const

const PRIORIDADES = ['Baja', 'Media', 'Alta'] as const

export function ModalCrearOrdenServicio({
  open,
  vehiculoTitulo,
  numeroStock,
  onClose,
  onSubmit,
  cargando,
  error,
}: ModalCrearOrdenServicioProps) {
  const [tipoTrabajo, setTipoTrabajo] = useState<string>('Mecánico')
  const [descripcion, setDescripcion] = useState<string>('')
  const [prioridad, setPrioridad] = useState<string>('Media')
  const [costoEstimado, setCostoEstimado] = useState<string>('')
  const [responsable, setResponsable] = useState<string>('')
  const [fechaEstimada, setFechaEstimada] = useState<string>('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  const hoyStr = new Date().toISOString().split('T')[0]

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLocal(null)

    if (!tipoTrabajo.trim()) {
      setErrorLocal('El tipo de trabajo es obligatorio')
      return
    }

    if (!descripcion.trim()) {
      setErrorLocal('La descripción del trabajo es obligatoria')
      return
    }

    if (descripcion.trim().length > 500) {
      setErrorLocal('La descripción no puede exceder 500 caracteres')
      return
    }

    let costoNumerico: number | null = null
    if (costoEstimado.trim() !== '') {
      costoNumerico = Number(costoEstimado)
      if (isNaN(costoNumerico) || costoNumerico < 0) {
        setErrorLocal('El costo estimado no puede ser negativo')
        return
      }
    }

    if (fechaEstimada && fechaEstimada < hoyStr) {
      setErrorLocal('La fecha estimada no puede ser anterior a hoy')
      return
    }

    await onSubmit({
      tipoTrabajo: tipoTrabajo.trim(),
      descripcion: descripcion.trim(),
      prioridad,
      costoEstimado: costoNumerico,
      responsable: responsable.trim() || undefined,
      fechaEstimada: fechaEstimada || null,
    })
  }

  const errorVisible = errorLocal || error

  return (
    <LiquidModal open={open} ariaLabel="Crear orden de servicio de taller">
      <div className="v-glass v-glass--thick max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p
                className="text-[11px] font-black uppercase tracking-wider text-amber-400"
              >
                Taller y Acondicionamiento
              </p>
              <h2 className="text-lg font-black text-white">
                Crear Orden de Servicio
              </h2>
              <p className="text-xs text-white/60">
                {vehiculoTitulo} · {numeroStock}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-squish rounded-lg p-1.5 hover:bg-white/10 text-white/60 hover:text-white"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorVisible && (
          <div
            role="alert"
            className="v-glass tone--coral flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-semibold text-rose-300 shadow-lg"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorVisible}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-4 text-xs font-semibold">
          {/* Tipo de Trabajo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">
              Tipo de trabajo *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_TRABAJO.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoTrabajo(t)}
                  className={`btn-squish rounded-xl p-2.5 text-center text-xs font-bold transition-all border ${
                    tipoTrabajo === t
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">
              Prioridad
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORIDADES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrioridad(p)}
                  className={`btn-squish rounded-xl p-2 text-center text-xs font-bold transition-all border ${
                    prioridad === p
                      ? p === 'Alta'
                        ? 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-md'
                        : p === 'Media'
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md'
                          : 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-md'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="orden-desc" className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                Descripción del trabajo *
              </label>
              <span className="text-[10px] text-white/40">
                {descripcion.length}/500 caracteres
              </span>
            </div>
            <textarea
              id="orden-desc"
              rows={3}
              maxLength={500}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalla las reparaciones o acondicionamientos requeridos..."
              className="w-full rounded-2xl bg-white/5 border border-white/15 p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              required
            />
          </div>

          {/* Costo Estimado y Responsable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="orden-costo" className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1">
                Costo estimado (MXN)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                <input
                  id="orden-costo"
                  type="number"
                  min="0"
                  step="50"
                  value={costoEstimado}
                  onChange={(e) => setCostoEstimado(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-white/5 border border-white/15 pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="orden-resp" className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1">
                Responsable del trabajo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                <input
                  id="orden-resp"
                  type="text"
                  maxLength={100}
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  placeholder="Nombre de mecánico o taller"
                  className="w-full rounded-xl bg-white/5 border border-white/15 pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Fecha Estimada */}
          <div>
            <label htmlFor="orden-fecha-est" className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1">
              Fecha estimada de término
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
              <input
                id="orden-fecha-est"
                type="date"
                min={hoyStr}
                value={fechaEstimada}
                onChange={(e) => setFechaEstimada(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/15 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="v-glass btn-squish rounded-xl px-4 py-2.5 text-xs font-bold text-white/70 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="btn-squish rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-xs font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
            >
              {cargando ? 'Guardando orden...' : 'Guardar orden'}
            </button>
          </div>
        </form>
      </div>
    </LiquidModal>
  )
}
