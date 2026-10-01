import { create } from 'zustand'

export const useOfflineStore = create((set, get) => ({
  isOnline: navigator.onLine,
  cambiosPendientes: [],
  ultimaActualizacion: null,

  setOnline: (valor) => set({ isOnline: valor }),

  agregarCambioPendiente: (cambio) => set((state) => ({
    cambiosPendientes: [...state.cambiosPendientes, { ...cambio, id: Date.now(), estado: 'pendiente' }],
  })),

  actualizarCambio: (id, datos) => set((state) => ({
    cambiosPendientes: state.cambiosPendientes.map((c) =>
      c.id === id ? { ...c, ...datos } : c
    ),
  })),

  eliminarCambio: (id) => set((state) => ({
    cambiosPendientes: state.cambiosPendientes.filter((c) => c.id !== id),
  })),

  limpiarPendientes: () => set({ cambiosPendientes: [] }),

  setUltimaActualizacion: (fecha) => set({ ultimaActualizacion: fecha }),
}))
