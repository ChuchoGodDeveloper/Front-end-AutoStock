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
      className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900 shadow-sm"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{MENSAJES.bannerOffline}</span>
    </div>
  )
}
