import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, Wifi, WifiOff } from 'lucide-react'
import { MENSAJES } from '../config/mensajes'
import { leerMetaInventario, type MetaInventario } from '../services/offlineDb'

interface OfflineBannerProps {
  visible: boolean
  mensajeReconexion?: boolean
}

export function OfflineBanner({ visible, mensajeReconexion }: OfflineBannerProps) {
  const [meta, setMeta] = useState<MetaInventario | null>(null)

  useEffect(() => {
    let montado = true
    void leerMetaInventario().then((datos) => {
      if (montado) setMeta(datos)
    })
    return () => {
      montado = false
    }
  }, [visible])

  if (mensajeReconexion) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="v-glass tone--green mx-auto flex w-full max-w-lg items-center justify-center gap-2.5 rounded-full px-5 py-2.5 text-center text-sm font-bold shadow-lg animate-fade-in"
        style={{ color: 'var(--ink)' }}
      >
        <Wifi className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <span>{MENSAJES.offlineDatosActualizados}</span>
      </div>
    )
  }

  if (!visible) return null

  const esAntiguo = meta?.ultimaActualizacion
    ? Date.now() - new Date(meta.ultimaActualizacion).getTime() > 24 * 60 * 60 * 1000
    : false

  const fechaFormateada = meta?.ultimaActualizacion
    ? new Date(meta.ultimaActualizacion).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="mx-auto w-full max-w-xl space-y-2">
      <div
        role="status"
        aria-live="polite"
        className="v-glass tone--orange flex w-full flex-col sm:flex-row items-center justify-between gap-2 rounded-2xl px-5 py-2.5 text-center sm:text-left text-xs sm:text-sm font-bold shadow-lg"
        style={{ color: 'var(--ink)' }}
      >
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span>{MENSAJES.bannerOffline}</span>
        </div>
        {fechaFormateada && (
          <div className="flex items-center gap-1.5 text-xs opacity-90 font-medium" style={{ color: 'var(--ink-2)' }}>
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span>Última sincr.: {fechaFormateada}</span>
          </div>
        )}
      </div>

      {esAntiguo && (
        <div
          role="alert"
          className="v-glass tone--coral flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow"
          style={{ color: 'var(--ink)' }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
          <span>{MENSAJES.offlineDatosAntiguosAviso}</span>
        </div>
      )}
    </div>
  )
}
