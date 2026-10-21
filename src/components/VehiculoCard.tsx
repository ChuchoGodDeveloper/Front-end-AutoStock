import { useState } from 'react'
import { Car, MapPin, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EstadoOperativo, type Vehiculo } from '../types/vehiculo'

const formateadorMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const formateadorKilometraje = new Intl.NumberFormat('es-MX')

interface EstiloEstado {
  etiqueta: string
  clases: string
}

const ESTILOS_ESTADO: Partial<Record<EstadoOperativo, EstiloEstado>> = {
  [EstadoOperativo.Disponible]: {
    etiqueta: 'Disponible',
    clases: 'border-green-300 bg-green-100 text-green-800',
  },
  [EstadoOperativo.TestDrive]: {
    etiqueta: 'Test Drive',
    clases: 'border-blue-300 bg-blue-100 text-blue-800',
  },
  [EstadoOperativo.EnTaller]: {
    etiqueta: 'En Taller',
    clases: 'border-orange-300 bg-orange-100 text-orange-800',
  },
  [EstadoOperativo.EnLavado]: {
    etiqueta: 'En Lavado',
    clases: 'border-yellow-300 bg-yellow-100 text-yellow-800',
  },
  [EstadoOperativo.Reservado]: {
    etiqueta: 'Reservado',
    clases: 'border-red-300 bg-red-100 text-red-800',
  },
}

export function VehiculoCard({ vehiculo }: { vehiculo: Vehiculo }) {
  const [fotoFallida, setFotoFallida] = useState(false)

  const urlFoto = vehiculo.fotoPrincipalUrl?.trim() || null
  const estiloEstado = ESTILOS_ESTADO[vehiculo.estado]
  const ubicacion = `${vehiculo.zonaLote} - Cajón ${vehiculo.cajonLote}`
  const nombreVehiculo = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {urlFoto && !fotoFallida ? (
        <img
          src={urlFoto}
          alt={nombreVehiculo}
          loading="lazy"
          onError={() => setFotoFallida(true)}
          className="h-44 w-full bg-slate-100 object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`${nombreVehiculo} sin fotografía`}
          className="flex h-44 w-full items-center justify-center border-b border-slate-200 bg-slate-100"
        >
          <Car className="h-14 w-14 text-slate-400" aria-hidden="true" />
        </div>
      )}

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-900">
              {vehiculo.marca} {vehiculo.modelo}
            </h3>
            <p className="text-sm font-semibold text-slate-500">{vehiculo.anio}</p>
          </div>

          {estiloEstado && (
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${estiloEstado.clases}`}
            >
              {estiloEstado.etiqueta}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-black text-blue-700">
            {formateadorMoneda.format(vehiculo.precio)}
          </p>
          <p className="text-sm font-semibold text-slate-600">
            {formateadorKilometraje.format(vehiculo.kilometraje)} km
          </p>
        </div>

        <dl className="space-y-1.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <dt className="sr-only">Placa</dt>
            <dd className="font-semibold">
              {vehiculo.placa?.trim() ? vehiculo.placa.toUpperCase() : 'Sin placa'}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <dt className="sr-only">Ubicación</dt>
            <dd>{ubicacion}</dd>
          </div>
        </dl>

        <Link
          to={`/vehiculo/${vehiculo.id}`}
          className="block rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Ver Ficha Técnica
        </Link>
      </div>
    </article>
  )
}
