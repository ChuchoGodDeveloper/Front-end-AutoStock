import { useEffect } from 'react'

export type TipoSiluetaVehiculo = 'suv' | 'sedan' | 'pickup' | 'coupe'

export function inferirSiluetaVehiculo(
  marca?: string,
  modelo?: string,
): TipoSiluetaVehiculo {
  const texto = `${marca ?? ''} ${modelo ?? ''}`.toLowerCase()
  if (
    texto.includes('hilux') ||
    texto.includes('tacoma') ||
    texto.includes('lobo') ||
    texto.includes('ranger') ||
    texto.includes('frontier') ||
    texto.includes('np300') ||
    texto.includes('silverado') ||
    texto.includes('ram') ||
    texto.includes('saveiro') ||
    texto.includes('pickup')
  ) {
    return 'pickup'
  }
  if (
    texto.includes('rav4') ||
    texto.includes('cr-v') ||
    texto.includes('crv') ||
    texto.includes('cx-5') ||
    texto.includes('cx-30') ||
    texto.includes('tiguan') ||
    texto.includes('taos') ||
    texto.includes('kicks') ||
    texto.includes('x-trail') ||
    texto.includes('tracker') ||
    texto.includes('captiva') ||
    texto.includes('sportage') ||
    texto.includes('tucson') ||
    texto.includes('seltos') ||
    texto.includes('suv')
  ) {
    return 'suv'
  }
  if (
    texto.includes('mustang') ||
    texto.includes('camaro') ||
    texto.includes('corvette') ||
    texto.includes('911') ||
    texto.includes('supra') ||
    texto.includes('mx-5') ||
    texto.includes('gt') ||
    texto.includes('coupe') ||
    texto.includes('coupé')
  ) {
    return 'coupe'
  }
  return 'sedan'
}

export function useGlobalRippleAndSquish(): void {
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '.btn-squish, .dock-btn',
      )
      if (!target || target.hasAttribute('disabled')) return

      const rect = target.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 0.9
      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${e.clientX - rect.left}px`
      ripple.style.top = `${e.clientY - rect.top}px`
      target.appendChild(ripple)
      window.setTimeout(() => {
        ripple.remove()
      }, 600)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>('.v-glass')
      if (!card) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--gx', `${e.clientX - rect.left}px`)
      card.style.setProperty('--gy', `${e.clientY - rect.top}px`)
    }

    document.addEventListener('pointerdown', handlePointerDown, { passive: true })
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])
}
