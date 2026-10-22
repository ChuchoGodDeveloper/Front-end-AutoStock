import { EstadoOperativo, TipoVehiculo } from '../types/vehiculo'
import { FILTROS_VACIOS, hayFiltrosActivos, useCatalogoStore } from '../stores/catalogoStore'
import type { ConteosRapidos, FiltrosCatalogo } from '../types/vehiculo'

interface PresetFiltro {
  etiqueta: string
  conteo: (conteos: ConteosRapidos) => number
  filtros: FiltrosCatalogo
}

const PRESETS: PresetFiltro[] = [
  {
    etiqueta: 'Todos',
    conteo: (conteos) => conteos.todos,
    filtros: FILTROS_VACIOS,
  },
  {
    etiqueta: 'Disponibles',
    conteo: (conteos) => conteos.disponibles,
    filtros: { ...FILTROS_VACIOS, estados: [EstadoOperativo.Disponible] },
  },
  {
    etiqueta: 'Seminuevos',
    conteo: (conteos) => conteos.seminuevos,
    filtros: { ...FILTROS_VACIOS, tipo: TipoVehiculo.Seminuevo },
  },
  {
    etiqueta: 'Nuevos',
    conteo: (conteos) => conteos.nuevos,
    filtros: { ...FILTROS_VACIOS, tipo: TipoVehiculo.Nuevo },
  },
]

function coincideConPreset(filtros: FiltrosCatalogo, preset: FiltrosCatalogo): boolean {
  return (
    filtros.tipo === preset.tipo &&
    filtros.precioMin === preset.precioMin &&
    filtros.precioMax === preset.precioMax &&
    filtros.estados.length === preset.estados.length &&
    filtros.estados.every((estado, indice) => estado === preset.estados[indice])
  )
}

export function FiltrosRapidos() {
  const filtros = useCatalogoStore((estado) => estado.filtros)
  const conteos = useCatalogoStore((estado) => estado.conteos)
  const setFiltros = useCatalogoStore((estado) => estado.setFiltros)

  return (
    <div
      role="group"
      aria-label="Filtros rápidos"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
    >
      {PRESETS.map((preset) => {
        const activa = coincideConPreset(filtros, preset.filtros)

        return (
          <button
            key={preset.etiqueta}
            type="button"
            onClick={() => void setFiltros(preset.filtros)}
            aria-pressed={activa}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              activa
                ? 'border-blue-600 bg-blue-600 text-white'
                : hayFiltrosActivos(filtros) && preset.etiqueta === 'Todos'
                  ? 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
            }`}
          >
            {preset.etiqueta}
            <span
              className={`rounded-full px-1.5 text-xs font-black ${
                activa ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {preset.conteo(conteos)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
