import { create } from 'zustand'

export type TipoToast = 'exito' | 'info' | 'advertencia' | 'error'

export interface ToastItem {
  id: string
  titulo?: string
  mensaje: string
  tipo: TipoToast
}

interface EstadoToast {
  toasts: ToastItem[]
  mostrarAlerta: (mensaje: string, tipo?: TipoToast, titulo?: string) => void
  cerrarAlerta: (id: string) => void
}

export const useToastStore = create<EstadoToast>()((set) => ({
  toasts: [],

  mostrarAlerta: (mensaje, tipo = 'exito', titulo) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random()}`

    set((state) => ({
      toasts: [...state.toasts.slice(-3), { id, titulo, mensaje, tipo }],
    }))

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 4500)
  },

  cerrarAlerta: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
