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
      className="fixed inset-x-0 bottom-20 md:bottom-5 z-50 flex justify-center px-4"
    >
      <div className="v-glass v-glass--thick tone--blue flex w-full max-w-md items-center gap-3 rounded-3xl p-4 shadow-2xl">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md">
          <Download className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black" style={{ color: 'var(--ink)' }}>
            Instalar AutoStock
          </p>
          <p className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
            Accede al inventario desde tu pantalla de inicio
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => rechazarInstalacion()}
            aria-label="Ahora no"
            className="btn-squish flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            style={{ color: 'var(--ink-2)' }}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => void instalarApp()}
            className="btn-squish rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  )
}
