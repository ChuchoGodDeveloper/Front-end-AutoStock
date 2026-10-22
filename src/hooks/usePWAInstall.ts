import { useCallback, useEffect, useRef, useState } from 'react'

export const CLAVE_RECHAZO_PWA = 'pwa_install_rejected_date'
export const DIAS_OLVIDO_RECHAZO_PWA = 7

interface EventoInstalacionPWA extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: EventoInstalacionPWA
  }
}

function rechazoReciente(): boolean {
  const guardado = localStorage.getItem(CLAVE_RECHAZO_PWA)
  if (!guardado) return false

  const fechaGuardada = Number(guardado)
  if (!Number.isFinite(fechaGuardada)) return false

  const dias = (Date.now() - fechaGuardada) / (1000 * 60 * 60 * 24)
  return dias < DIAS_OLVIDO_RECHAZO_PWA
}

export function usePWAInstall() {
  const eventoRef = useRef<EventoInstalacionPWA | null>(null)
  const [mostrarAviso, setMostrarAviso] = useState(false)

  useEffect(() => {
    const manejarAntesDeInstalar = (evento: EventoInstalacionPWA) => {
      evento.preventDefault()
      eventoRef.current = evento

      if (!rechazoReciente()) {
        setMostrarAviso(true)
      }
    }

    const manejarInstalado = () => {
      eventoRef.current = null
      localStorage.removeItem(CLAVE_RECHAZO_PWA)
      setMostrarAviso(false)
    }

    window.addEventListener('beforeinstallprompt', manejarAntesDeInstalar)
    window.addEventListener('appinstalled', manejarInstalado)

    return () => {
      window.removeEventListener('beforeinstallprompt', manejarAntesDeInstalar)
      window.removeEventListener('appinstalled', manejarInstalado)
    }
  }, [])

  const rechazarInstalacion = useCallback(() => {
    localStorage.setItem(CLAVE_RECHAZO_PWA, String(Date.now()))
    eventoRef.current = null
    setMostrarAviso(false)
  }, [])

  const instalarApp = useCallback(async () => {
    const evento = eventoRef.current
    if (!evento) {
      setMostrarAviso(false)
      return
    }

    try {
      await evento.prompt()
      const { outcome } = await evento.userChoice

      if (outcome === 'accepted') {
        setMostrarAviso(false)
      } else {
        rechazarInstalacion()
      }
    } catch {
      setMostrarAviso(false)
    } finally {
      eventoRef.current = null
    }
  }, [rechazarInstalacion])

  return { mostrarAviso, instalarApp, rechazarInstalacion }
}
