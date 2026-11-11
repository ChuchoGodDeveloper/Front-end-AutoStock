import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  Send,
  Wrench,
  X,
} from 'lucide-react'
import { LiquidModal } from './LiquidUI'
import type { OrdenServicio } from '../types/ordenServicio'

interface ModalCierreOrdenServicioProps {
  open: boolean
  orden: OrdenServicio | null
  vehiculoTitulo: string
  numeroStock: string
  esSoloLectura?: boolean
  onClose: () => void
  onAgregarNota?: (nota: string) => Promise<void>
  onCerrarOrden?: (costoFinal: number, estadoSalida: 'Disponible' | 'EnLavado') => Promise<void>
  cargandoNota?: boolean
  cargandoCierre?: boolean
  error?: string | null
}

function formatearFechaHora(fechaIso: string): string {
  try {
    const f = new Date(fechaIso)
    return `${f.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} ${f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return fechaIso
  }
}

export function ModalCierreOrdenServicio({
  open,
  orden,
  vehiculoTitulo,
  numeroStock,
  esSoloLectura = false,
  onClose,
  onAgregarNota,
  onCerrarOrden,
  cargandoNota = false,
  cargandoCierre = false,
  error,
}: ModalCierreOrdenServicioProps) {
  const [nuevaNota, setNuevaNota] = useState<string>('')
  const [costoFinal, setCostoFinal] = useState<string>(
    orden?.costoEstimado != null ? String(orden.costoEstimado) : '',
  )
  const [estadoSalida, setEstadoSalida] = useState<'Disponible' | 'EnLavado'>('Disponible')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [modoCierre, setModoCierre] = useState(false)

  if (!orden) return null

  const soloLectura = orden.estado === 'Cerrada' || esSoloLectura

  const manejarEnvioNota = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaNota.trim() || !onAgregarNota) return
    setErrorLocal(null)
    await onAgregarNota(nuevaNota.trim())
    setNuevaNota('')
  }

  const manejarConfirmarCierre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onCerrarOrden) return
    setErrorLocal(null)

    if (costoFinal.trim() === '') {
      setErrorLocal('El costo final es obligatorio al cerrar la orden')
      return
    }

    const costoNumerico = Number(costoFinal)
    if (isNaN(costoNumerico) || costoNumerico < 0) {
      setErrorLocal('El costo final no puede ser negativo')
      return
    }

    if (!estadoSalida) {
      setErrorLocal('Debes seleccionar el estado al que pasa la unidad al salir del taller')
      return
    }

    await onCerrarOrden(costoNumerico, estadoSalida)
  }

  const errorVisible = errorLocal || error

  return (
    <LiquidModal open={open} ariaLabel="Seguimiento y cierre de orden de servicio">
      <div className="v-glass v-glass--thick max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 shadow-2xl space-y-4 text-xs font-semibold">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40">
                  {orden.folio}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  {orden.estado}
                </span>
              </div>
              <h2 className="text-base font-black text-white mt-0.5">
                {orden.tipoTrabajo} · {vehiculoTitulo}
              </h2>
              <p className="text-[11px] text-white/50">{numeroStock}</p>
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

        {/* Resumen del Trabajo */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">
              Descripción
            </span>
            <p className="text-white font-medium mt-0.5">{orden.descripcion}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
            <div>
              <span className="text-white/50">Prioridad:</span>{' '}
              <span className="font-bold text-amber-300">{orden.prioridad}</span>
            </div>
            <div>
              <span className="text-white/50">Responsable:</span>{' '}
              <span className="font-bold text-white">{orden.responsable || 'Taller Interno'}</span>
            </div>
            <div>
              <span className="text-white/50">Costo est.:</span>{' '}
              <span className="font-bold text-emerald-400">
                {orden.costoEstimado != null ? `$${orden.costoEstimado.toLocaleString('es-MX')} MXN` : 'Sin estimar'}
              </span>
            </div>
            <div>
              <span className="text-white/50">Fecha est.:</span>{' '}
              <span className="font-bold text-white">
                {orden.fechaEstimada ? new Date(orden.fechaEstimada).toLocaleDateString('es-MX') : 'No fijada'}
              </span>
            </div>
          </div>
        </div>

        {/* Sección: Notas de Avance */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Notas de Avance ({orden.notasAvance?.length ?? 0})
            </h3>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {orden.notasAvance && orden.notasAvance.length > 0 ? (
              orden.notasAvance.map((nota) => (
                <div
                  key={nota.id}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1"
                >
                  <p className="text-white font-medium">{nota.nota}</p>
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>{nota.creadoPorNombre}</span>
                    <span>{formatearFechaHora(nota.fechaCreacion)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-white/40 italic py-2">
                Sin notas de avance registradas.
              </p>
            )}
          </div>

          {/* Formulario para agregar nota (solo en orden abierta) */}
          {!soloLectura && (
            <form onSubmit={manejarEnvioNota} className="flex gap-2">
              <input
                type="text"
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                placeholder="Escribe un avance del trabajo..."
                className="flex-1 rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="submit"
                disabled={cargandoNota || !nuevaNota.trim()}
                className="btn-squish rounded-xl bg-sky-500 hover:bg-sky-400 px-3.5 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                aria-label="Agregar nota"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Sección: Cierre de Orden o Resumen de Cierre */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          {soloLectura ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Orden Cerrada y Concluida
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-white/80">
                <div>
                  <span className="text-white/40 block">Fecha de cierre:</span>
                  <span className="font-bold text-white">
                    {orden.fechaCierre ? formatearFechaHora(orden.fechaCierre) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block">Cerrada por:</span>
                  <span className="font-bold text-white">{orden.cerradoPorNombre || 'Personal de Taller'}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Costo final:</span>
                  <span className="font-black text-emerald-400">
                    {orden.costoFinal != null ? `$${orden.costoFinal.toLocaleString('es-MX')} MXN` : 'Confidencial'}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block">Estado asignado:</span>
                  <span className="font-bold text-sky-300">{orden.estadoSalida || 'Disponible'}</span>
                </div>
              </div>
            </div>
          ) : !modoCierre ? (
            <button
              type="button"
              onClick={() => setModoCierre(true)}
              className="btn-squish w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:brightness-110"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Cerrar Orden de Servicio</span>
            </button>
          ) : (
            <form onSubmit={manejarConfirmarCierre} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Confirmar Cierre y Salida de Taller
              </h4>

              <div>
                <label htmlFor="costo-final" className="block text-[11px] font-bold text-white/80 mb-1">
                  Costo final real (MXN) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                  <input
                    id="costo-final"
                    type="number"
                    min="0"
                    step="50"
                    value={costoFinal}
                    onChange={(e) => setCostoFinal(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl bg-white/5 border border-white/20 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/80 mb-1.5">
                  Estado al salir del taller *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEstadoSalida('Disponible')}
                    className={`btn-squish rounded-xl p-2.5 text-center text-xs font-bold border transition ${
                      estadoSalida === 'Disponible'
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-md'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    Disponible para venta
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstadoSalida('EnLavado')}
                    className={`btn-squish rounded-xl p-2.5 text-center text-xs font-bold border transition ${
                      estadoSalida === 'EnLavado'
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-md'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    En zona de lavado
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModoCierre(false)}
                  className="v-glass btn-squish rounded-xl px-3 py-1.5 text-xs text-white/70 hover:text-white"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={cargandoCierre}
                  className="btn-squish rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
                >
                  {cargandoCierre ? 'Cerrando orden...' : 'Confirmar cierre'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </LiquidModal>
  )
}
