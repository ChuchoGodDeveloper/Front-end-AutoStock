import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,

      login: (token, usuario) => {
        set({ token, usuario, isAuthenticated: true })
      },

      logout: () => {
        set({ token: null, usuario: null, isAuthenticated: false })
      },

      hasPermission: (permission) => {
        const { usuario } = get()
        if (!usuario) return false
        if (usuario.rol === 'Administrador') return true
        return usuario.permisos?.includes(permission) ?? false
      },
    }),
    {
      name: 'autostock-auth',
    }
  )
)
