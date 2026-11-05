import { WifiOff } from 'lucide-react'
import { MENSAJES } from '../config/mensajes'

interface OfflineBannerProps {
  visible: boolean
}

export function OfflineBanner({ visible }: OfflineBannerProps) {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="v-glass tone--orange mx-auto flex w-full max-w-lg items-center justify-center gap-2.5 rounded-full px-5 py-2.5 text-center text-sm font-bold shadow-lg"
      style={{ color: 'var(--ink)' }}
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
      <span>{MENSAJES.bannerOffline}</span>
    </div>
  )
}
