import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  const [enLinea, setEnLinea] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const alConectar = () => setEnLinea(true)
    const alDesconectar = () => setEnLinea(false)

    window.addEventListener('online', alConectar)
    window.addEventListener('offline', alDesconectar)

    return () => {
      window.removeEventListener('online', alConectar)
      window.removeEventListener('offline', alDesconectar)
    }
  }, [])

  return enLinea
}
