import type { LiquidTone } from '../components/LiquidUI'
import { EstadoOperativo } from '../types/vehiculo'

export interface EstiloEstado {
  etiqueta: string
  clases: string
  tono: LiquidTone
  colorAcento: string
}

export const ESTILOS_ESTADO: Partial<Record<EstadoOperativo, EstiloEstado>> = {
  [EstadoOperativo.Disponible]: {
    etiqueta: 'Disponible',
    clases: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300',
    tono: 'green',
    colorAcento: '#2EE59D',
  },
  [EstadoOperativo.TestDrive]: {
    etiqueta: 'Test Drive',
    clases: 'border-sky-400/40 bg-sky-500/20 text-sky-300',
    tono: 'blue',
    colorAcento: '#4DA6FF',
  },
  [EstadoOperativo.EnTaller]: {
    etiqueta: 'En Taller',
    clases: 'border-amber-400/40 bg-amber-500/20 text-amber-300',
    tono: 'orange',
    colorAcento: '#FFB020',
  },
  [EstadoOperativo.EnLavado]: {
    etiqueta: 'En Lavado',
    clases: 'border-cyan-400/40 bg-cyan-500/20 text-cyan-300',
    tono: 'teal',
    colorAcento: '#38EF7D',
  },
  [EstadoOperativo.Reservado]: {
    etiqueta: 'Reservado',
    clases: 'border-rose-400/40 bg-rose-500/20 text-rose-300',
    tono: 'coral',
    colorAcento: '#FF5E62',
  },
  [EstadoOperativo.Vendido]: {
    etiqueta: 'Vendido',
    clases: 'border-slate-400/40 bg-slate-500/25 text-slate-300',
    tono: 'ink',
    colorAcento: '#94A3B8',
  },
}
