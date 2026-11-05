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
            className={`btn-squish flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-extrabold tracking-wide transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              activa
                ? 'border-sky-400/60 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg scale-[1.02]'
                : hayFiltrosActivos(filtros) && preset.etiqueta === 'Todos'
                  ? 'v-glass border-white/15 hover:border-sky-400/50'
                  : 'v-glass border-white/15 hover:border-sky-400/50'
            }`}
            style={activa ? undefined : { color: 'var(--ink)' }}
          >
            {preset.etiqueta}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                activa ? 'bg-white/25 text-white' : 'bg-white/10'
              }`}
              style={activa ? undefined : { color: 'var(--ink-2)' }}
            >
              {preset.conteo(conteos)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
