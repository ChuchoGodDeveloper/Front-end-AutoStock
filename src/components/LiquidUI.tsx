import {
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

export type LiquidTone = 'green' | 'blue' | 'orange' | 'teal' | 'coral' | 'ink' | 'none'

interface LiquidModalProps {
  open: boolean
  children: ReactNode
  ariaLabel?: string
  ariaLabelledBy?: string
  zIndexClass?: string
  alignClass?: string
}

export function LiquidModal({
  open,
  children,
  ariaLabel,
  ariaLabelledBy,
  zIndexClass = 'z-[100]',
  alignClass = 'items-center justify-center p-4',
}: LiquidModalProps) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={`fixed inset-0 w-screen h-screen ${zIndexClass} flex ${alignClass} bg-slate-950/75 backdrop-blur-md overflow-y-auto`}
    >
      {children}
    </div>,
    document.body,
  )
}

interface SplitTitleProps {
  text: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'span'
}

export function SplitTitle({ text, className = '', as: Tag = 'h1' }: SplitTitleProps) {
  let charIndex = 0

  return (
    <Tag className={className} aria-label={text}>
      {text.split(' ').map((word, wIdx, arr) => (
        <span key={`${word}-${wIdx}`} className="split-word" aria-hidden="true">
          {Array.from(word).map((ch) => {
            const delayMs = charIndex * 22
            charIndex += 1
            return (
              <span
                key={`${wIdx}-${charIndex}`}
                className="split-char"
                style={{ animationDelay: `${delayMs}ms` }}
              >
                {ch}
              </span>
            )
          })}
          {wIdx < arr.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </Tag>
  )
}

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  format?: (val: number) => string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 850,
  prefix = '',
  suffix = '',
  format,
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(value)
  const previousRef = useRef<number>(0)

  useEffect(() => {
    const startVal = previousRef.current
    const targetVal = Number.isFinite(value) ? value : 0
    if (startVal === targetVal) {
      setDisplayValue(targetVal)
      return
    }

    let rafId = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (targetVal - startVal) * eased)
      setDisplayValue(current)

      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick)
      } else {
        previousRef.current = targetVal
      }
    }

    rafId = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [value, duration])

  const formatted = format ? format(displayValue) : displayValue.toLocaleString('es-MX')

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

export interface SegmentedOption<T extends string = string> {
  id: T
  label: string
  badge?: number | string
  icon?: ReactNode
}

interface LiquidSegmentedProps<T extends string = string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (nextValue: T) => void
  ariaLabel?: string
  className?: string
  size?: 'sm' | 'md'
}

export function LiquidSegmented<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel = 'Selector de vista',
  className = '',
  size = 'md',
}: LiquidSegmentedProps<T>) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({
    left: 4,
    width: 0,
  })

  const syncPill = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const activeIndex = Math.max(
      0,
      options.findIndex((opt) => opt.id === value),
    )
    const activeBtn = btnRefs.current[activeIndex]
    if (!activeBtn) return

    const left = activeBtn.offsetLeft
    const width = activeBtn.offsetWidth
    const totalW = wrap.offsetWidth || 1
    const rightInset = Math.max(0, totalW - left - width)

    wrap.style.setProperty('--seg-left', `${left}px`)
    wrap.style.setProperty('--seg-right', `${rightInset}px`)
    setPillStyle({ left, width })
  }, [options, value])

  useLayoutEffect(() => {
    syncPill()
  }, [syncPill])

  useEffect(() => {
    window.addEventListener('resize', syncPill)
    return () => window.removeEventListener('resize', syncPill)
  }, [syncPill])

  const sizeClass = size === 'sm' ? 'seg-btn--sm' : ''

  return (
    <div
      ref={wrapRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`v-glass v-glass--chrome seg-wrap ${className}`}
    >
      <div
        className="seg-pill"
        aria-hidden="true"
        style={{
          left: `${pillStyle.left}px`,
          width: `${pillStyle.width}px`,
        }}
      />
      <div className="seg-layer">
        {options.map((opt, idx) => {
          const active = opt.id === value
          return (
            <button
              key={opt.id}
              ref={(el) => {
                btnRefs.current[idx] = el
              }}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.id)}
              className={`seg-btn btn-squish ${sizeClass} ${active ? 'seg-btn--active' : ''}`}
            >
              {opt.icon}
              <span>{opt.label}</span>
              {opt.badge !== undefined && (
                <span className="seg-badge">{opt.badge}</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="seg-layer seg-layer--lit" aria-hidden="true">
        {options.map((opt) => (
          <button
            key={`${opt.id}-lit`}
            type="button"
            tabIndex={-1}
            className={`seg-btn ${sizeClass}`}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span className="seg-badge seg-badge--lit">{opt.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

interface SpotlightCardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'header'
  tone?: LiquidTone
  thickness?: 'normal' | 'chrome' | 'thick'
  interactive?: boolean
  children: ReactNode
}

export function SpotlightCard({
  as: Tag = 'div',
  tone = 'none',
  thickness = 'normal',
  interactive = false,
  className = '',
  onMouseMove,
  children,
  ...rest
}: SpotlightCardProps) {
  const handleMouseMove = (e: ReactMouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--gx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--gy', `${e.clientY - rect.top}px`)
    onMouseMove?.(e)
  }

  const thicknessClass =
    thickness === 'chrome'
      ? 'v-glass--chrome'
      : thickness === 'thick'
        ? 'v-glass--thick'
        : ''

  const toneClass = tone !== 'none' ? `tone--${tone}` : ''
  const interactiveClass = interactive ? 'car-card btn-squish' : ''

  return (
    <Tag
      onMouseMove={handleMouseMove}
      className={`v-glass ${thicknessClass} ${toneClass} ${interactiveClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  )
}
