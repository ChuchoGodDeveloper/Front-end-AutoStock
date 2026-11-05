import { create } from 'zustand'

export type ShowroomTheme = 'dark' | 'light'

const STORAGE_KEY = 'autostock-showroom-theme'

function leerTemaInicial(): ShowroomTheme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const guardado = window.localStorage.getItem(STORAGE_KEY)
    if (guardado === 'light' || guardado === 'dark') {
      return guardado
    }
  } catch {
    // Ignorar restricciones de almacenamiento privado
  }
  return 'dark'
}

function aplicarTemaDOM(tema: ShowroomTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = tema
  root.style.colorScheme = tema
}

interface ThemeState {
  tema: ShowroomTheme
  alternarTema: () => void
  establecerTema: (tema: ShowroomTheme) => void
}

const temaInicial = leerTemaInicial()
aplicarTemaDOM(temaInicial)

export const useThemeStore = create<ThemeState>((set, get) => ({
  tema: temaInicial,
  alternarTema: () => {
    const siguiente: ShowroomTheme = get().tema === 'dark' ? 'light' : 'dark'
    try {
      window.localStorage.setItem(STORAGE_KEY, siguiente)
    } catch {
      // Ignorar fallo de localStorage
    }
    aplicarTemaDOM(siguiente)
    set({ tema: siguiente })
  },
  establecerTema: (tema) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, tema)
    } catch {
      // Ignorar fallo de localStorage
    }
    aplicarTemaDOM(tema)
    set({ tema })
  },
}))
