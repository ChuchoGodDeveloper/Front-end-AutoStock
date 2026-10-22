import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
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
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Filtros de inventario">
      <button
        type="button"
        aria-label="Cerrar filtros"
        onClick={onCerrar}
        className="absolute inset-0 h-full w-full bg-slate-900/40"
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Filtros</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Estado</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {OPCIONES_ESTADO.map((opcion) => {
              const marcado = estados.includes(opcion.valor)

              return (
                <label
                  key={opcion.valor}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    marcado
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternarEstado(opcion.valor)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  {opcion.etiqueta}
                </label>
              )
            })}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Tipo</h3>
          <div className="mt-3 flex gap-2">
            {OPCIONES_TIPO.map((opcion) => {
              const marcado = tipo === opcion.valor

              return (
                <label
                  key={opcion.etiqueta}
                  className={`flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    marcado
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo-vehiculo"
                    checked={marcado}
                    onChange={() => setTipo(opcion.valor)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  {opcion.etiqueta}
                </label>
              )
            })}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Precio (MXN)</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold text-slate-700">
              Mínimo
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={precioMin}
                onChange={(evento) => setPrecioMin(evento.target.value)}
                placeholder="Ej. 150000"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Máximo
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={precioMax}
                onChange={(evento) => setPrecioMax(evento.target.value)}
                placeholder="Ej. 600000"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          {errorPrecio && (
            <p role="alert" className="mt-2 text-sm font-semibold text-red-600">
              {errorPrecio}
            </p>
          )}
        </section>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={limpiar}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Limpiar filtros
          </button>
          <button
            type="button"
            onClick={aplicar}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
