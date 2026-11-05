import { useEffect, useState } from 'react'
import { Check, SlidersHorizontal, X } from 'lucide-react'
import { FILTROS_VACIOS, useCatalogoStore } from '../stores/catalogoStore'
import { EstadoOperativo, TipoVehiculo } from '../types/vehiculo'

const OPCIONES_ESTADO: { valor: EstadoOperativo; etiqueta: string }[] = [
  { valor: EstadoOperativo.Disponible, etiqueta: 'Disponible' },
  { valor: EstadoOperativo.TestDrive, etiqueta: 'Test Drive' },
  { valor: EstadoOperativo.EnTaller, etiqueta: 'En Taller' },
  { valor: EstadoOperativo.EnLavado, etiqueta: 'En Lavado' },
  { valor: EstadoOperativo.Reservado, etiqueta: 'Reservado' },
  { valor: EstadoOperativo.Vendido, etiqueta: 'Vendido' },
]

const OPCIONES_TIPO: { valor: TipoVehiculo | null; etiqueta: string }[] = [
  { valor: null, etiqueta: 'Todos' },
  { valor: TipoVehiculo.Nuevo, etiqueta: 'Nuevos' },
  { valor: TipoVehiculo.Seminuevo, etiqueta: 'Seminuevos' },
]

const MENSAJE_ERROR_PRECIO = 'El precio mínimo no puede ser mayor que el máximo'

function aNumero(valor: string): number | null {
  const limpio = valor.trim()
  if (!limpio) return null
  const numero = Number(limpio)
  return Number.isFinite(numero) ? numero : null
}

export function FilterPanel({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const filtros = useCatalogoStore((estado) => estado.filtros)
  const setFiltros = useCatalogoStore((estado) => estado.setFiltros)

  const [estados, setEstados] = useState<EstadoOperativo[]>(filtros.estados)
  const [tipo, setTipo] = useState<TipoVehiculo | null>(filtros.tipo)
  const [precioMin, setPrecioMin] = useState(
    filtros.precioMin != null ? String(filtros.precioMin) : '',
  )
  const [precioMax, setPrecioMax] = useState(
    filtros.precioMax != null ? String(filtros.precioMax) : '',
  )
  const [errorPrecio, setErrorPrecio] = useState<string | null>(null)

  useEffect(() => {
    if (!abierto) return

    setEstados(filtros.estados)
    setTipo(filtros.tipo)
    setPrecioMin(filtros.precioMin != null ? String(filtros.precioMin) : '')
    setPrecioMax(filtros.precioMax != null ? String(filtros.precioMax) : '')
    setErrorPrecio(null)
  }, [abierto, filtros])

  useEffect(() => {
    if (!abierto) return

    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }

    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [abierto, onCerrar])

  const alternarEstado = (estado: EstadoOperativo) => {
    setEstados((actuales) =>
      actuales.includes(estado)
        ? actuales.filter((item) => item !== estado)
        : [...actuales, estado],
    )
  }

  const limpiar = () => {
    setEstados([])
    setTipo(null)
    setPrecioMin('')
    setPrecioMax('')
    setErrorPrecio(null)
    void setFiltros(FILTROS_VACIOS)
    onCerrar()
  }

  const aplicar = () => {
    const min = aNumero(precioMin)
    const max = aNumero(precioMax)

    if (min != null && max != null && min > max) {
      setErrorPrecio(MENSAJE_ERROR_PRECIO)
      return
    }

    setErrorPrecio(null)
    void setFiltros({ estados, tipo, precioMin: min, precioMax: max })
    onCerrar()
  }

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Filtros de inventario"
    >
      <button
        type="button"
        aria-label="Cerrar filtros"
        onClick={onCerrar}
        className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
      />

      <div className="v-glass v-glass--thick relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-sky-400" aria-hidden="true" />
            <h2 className="text-lg font-black" style={{ color: 'var(--ink)' }}>
              Filtros
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="btn-squish flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            style={{ color: 'var(--ink-2)' }}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <section className="mt-5">
          <h3
            className="text-xs font-extrabold uppercase tracking-[0.2em]"
            style={{ color: 'var(--ink-2)' }}
          >
            Estado
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {OPCIONES_ESTADO.map((opcion) => {
              const marcado = estados.includes(opcion.valor)

              return (
                <label
                  key={opcion.valor}
                  className={`btn-squish flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition ${
                    marcado
                      ? 'border-sky-400/60 bg-sky-500/20 text-sky-300'
                      : 'border-white/10 bg-white/5 hover:border-sky-400/40'
                  }`}
                  style={marcado ? undefined : { color: 'var(--ink)' }}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternarEstado(opcion.valor)}
                    className="h-4 w-4 accent-sky-500"
                  />
                  {opcion.etiqueta}
                </label>
              )
            })}
          </div>
        </section>

        <section className="mt-5">
          <h3
            className="text-xs font-extrabold uppercase tracking-[0.2em]"
            style={{ color: 'var(--ink-2)' }}
          >
            Tipo
          </h3>
          <div className="mt-3 flex gap-2.5">
            {OPCIONES_TIPO.map((opcion) => {
              const marcado = tipo === opcion.valor

              return (
                <label
                  key={opcion.etiqueta}
                  className={`btn-squish flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                    marcado
                      ? 'border-sky-400/60 bg-sky-500/20 text-sky-300'
                      : 'border-white/10 bg-white/5 hover:border-sky-400/40'
                  }`}
                  style={marcado ? undefined : { color: 'var(--ink)' }}
                >
                  <input
                    type="radio"
                    name="tipo-vehiculo"
                    checked={marcado}
                    onChange={() => setTipo(opcion.valor)}
                    className="h-4 w-4 accent-sky-500"
                  />
                  {opcion.etiqueta}
                </label>
              )
            })}
          </div>
        </section>

        <section className="mt-5">
          <h3
            className="text-xs font-extrabold uppercase tracking-[0.2em]"
            style={{ color: 'var(--ink-2)' }}
          >
            Precio (MXN)
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
              Mínimo
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={precioMin}
                onChange={(evento) => setPrecioMin(evento.target.value)}
                placeholder="Ej. 150000"
                className="campo-base campo-valido mt-1.5 py-2 text-sm font-semibold"
              />
            </label>
            <label className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
              Máximo
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={precioMax}
                onChange={(evento) => setPrecioMax(evento.target.value)}
                placeholder="Ej. 600000"
                className="campo-base campo-valido mt-1.5 py-2 text-sm font-semibold"
              />
            </label>
          </div>
          {errorPrecio && (
            <p role="alert" className="mt-2 text-sm font-bold text-rose-400">
              {errorPrecio}
            </p>
          )}
        </section>

        <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={limpiar}
            className="v-glass btn-squish flex-1 rounded-xl px-4 py-3 text-sm font-bold transition hover:border-white/30"
            style={{ color: 'var(--ink)' }}
          >
            Limpiar filtros
          </button>
          <button
            type="button"
            onClick={aplicar}
            className="btn-squish flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg transition hover:brightness-110"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
