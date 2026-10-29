import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [coincide, setCoincide] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQueryList = window.matchMedia(query)
    const listener = (evento: MediaQueryListEvent) => {
      setCoincide(evento.matches)
    }

    setCoincide(mediaQueryList.matches)

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener)
    } else {
      mediaQueryList.addListener(listener)
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener)
      } else {
        mediaQueryList.removeListener(listener)
      }
    }
  }, [query])

  return coincide
}

export function useEsMovil(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
