import { ArrowLeft, PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MENSAJES } from '../config/mensajes'

export function RegistroVehiculoPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-slate-100 pb-10">
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                AUTOSTOCK PRO
              </p>
              <h1 className="text-2xl font-black text-slate-900">Registrar Unidad</h1>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </button>
          </div>
        </header>

        <section className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <PlusCircle className="h-10 w-10 text-slate-400" aria-hidden="true" />
          <p className="text-center text-sm font-semibold text-slate-700">
            {MENSAJES.moduloProximamente}
          </p>
        </section>
      </div>
    </main>
  )
}
