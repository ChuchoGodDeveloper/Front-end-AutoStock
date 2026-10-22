import { Download, X } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

export function InstallPrompt() {
  const { mostrarAviso, instalarApp, rechazarInstalacion } = usePWAInstall()

  if (!mostrarAviso) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Instalar AutoStock"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4"
    >
      <div className="flex w-full max-w-md items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <Download className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900">Instalar AutoStock</p>
          <p className="text-xs font-semibold text-slate-500">
            Accede al inventario desde tu pantalla de inicio
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => rechazarInstalacion()}
            aria-label="Ahora no"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => void instalarApp()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  )
}
