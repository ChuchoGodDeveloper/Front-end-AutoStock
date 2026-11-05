import { useState } from 'react'
import { ArrowUpRight, Gauge, MapPin, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SpotlightCard } from './LiquidUI'
import { VehicleSilhouette } from './ShowroomWall'
import { ESTILOS_ESTADO } from '../config/estadosOperativos'
import { inferirSiluetaVehiculo } from '../hooks/useShowroomEffects'
import type { Vehiculo } from '../types/vehiculo'
import { normalizarUrlImagenVehiculo } from '../utils/imagenVehiculo'

const formateadorMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const formateadorKilometraje = new Intl.NumberFormat('es-MX')

export function VehiculoCard({ vehiculo }: { vehiculo: Vehiculo }) {
  const [fotoFallida, setFotoFallida] = useState(false)

  const ubicacion = `${vehiculo.zonaLote} - Cajón ${vehiculo.cajonLote}`
  const nombreVehiculo = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`
  const urlFoto = normalizarUrlImagenVehiculo(
    vehiculo.fotoPrincipalUrl,
    nombreVehiculo,
    `${vehiculo.zonaLote} · CAJÓN ${vehiculo.cajonLote}`,
  )
  const estiloEstado = ESTILOS_ESTADO[vehiculo.estado]
  const tipoSilueta = inferirSiluetaVehiculo(vehiculo.marca, vehiculo.modelo)

  return (
    <SpotlightCard
      as="article"
      tone={estiloEstado?.tono ?? 'ink'}
      interactive
      className="flex flex-col justify-between overflow-hidden rounded-3xl"
    >
      <div>
        {urlFoto && !fotoFallida ? (
          <div className="relative h-44 w-full overflow-hidden border-b border-white/10 bg-black/30">
            <img
              src={urlFoto}
              alt={nombreVehiculo}
              loading="lazy"
              onError={() => setFotoFallida(true)}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          </div>
        ) : (
          <div
            role="img"
            aria-label={`${nombreVehiculo} sin fotografía`}
            className="relative flex h-44 w-full flex-col items-center justify-center border-b border-white/10 bg-gradient-to-b from-white/5 to-black/25 px-4"
          >
            <VehicleSilhouette
              tipo={tipoSilueta}
              colorAcento={estiloEstado?.colorAcento ?? '#4DA6FF'}
              className="h-24 w-full"
            />
            <span
              className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--ink-3)' }}
            >
              {vehiculo.zonaLote} · CAJÓN {vehiculo.cajonLote}
            </span>
          </div>
        )}

        <div className="space-y-3.5 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className="truncate text-base font-black tracking-tight"
                style={{ color: 'var(--ink)' }}
              >
                {vehiculo.marca} {vehiculo.modelo}
              </h3>
              <p className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
                Modelo {vehiculo.anio}
              </p>
            </div>

            {estiloEstado && (
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${estiloEstado.clases}`}
              >
                {estiloEstado.etiqueta}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
            <p
              className="text-lg font-black tracking-tight"
              style={{ color: 'var(--champagne)' }}
            >
              {formateadorMoneda.format(vehiculo.precio)}
            </p>
            <p
              className="inline-flex items-center gap-1 text-xs font-bold"
              style={{ color: 'var(--ink-2)' }}
            >
              <Gauge className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              {formateadorKilometraje.format(vehiculo.kilometraje)} km
            </p>
          </div>

          <dl className="space-y-1.5 text-xs" style={{ color: 'var(--ink-2)' }}>
            <div className="flex items-center gap-2">
              <Ticket className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
              <dt className="sr-only">Placa</dt>
              <dd className="font-bold" style={{ color: 'var(--ink)' }}>
                {vehiculo.placa?.trim() ? vehiculo.placa.toUpperCase() : 'Sin placa'}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
              <dt className="sr-only">Ubicación</dt>
              <dd className="font-semibold">{ubicacion}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="px-5 pb-5">
        <Link
          to={`/vehiculo/${vehiculo.id}`}
          className="btn-squish flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-center text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <span>Ver Ficha Técnica</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </SpotlightCard>
  )
}
