import { ArrowLeft, Car } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MENSAJES } from '../config/mensajes'

export function VehiculoDetallePage() {
  return (
    <main className="min-h-screen bg-slate-100 pb-10">
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            AUTOSTOCK PRO
          </p>
          <h1 className="text-2xl font-black text-slate-900">Ficha Técnica</h1>
        </header>

        <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <Car className="h-10 w-10 text-slate-400" aria-hidden="true" />
          <p className="text-center text-sm font-semibold text-slate-700">
            {MENSAJES.moduloProximamente}
          </p>
        </section>

        <div className="text-center">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al catálogo
          </Link>
        </div>
      </div>
    </main>
  )
}
