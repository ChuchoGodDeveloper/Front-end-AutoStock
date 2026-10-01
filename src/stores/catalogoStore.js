import { create } from 'zustand'

export const useCatalogoStore = create((set, get) => ({
  vehiculos: [],
  totalUnidades: 0,
  paginaActual: 1,
  totalPaginas: 1,
  filtros: {
    estados: [],
    tipo: null,
    precioMin: null,
    precioMax: null,
    busqueda: '',
  },
  cargando: false,
  error: null,

  setVehiculos: (data) => set({
    vehiculos: data.items,
    totalUnidades: data.totalUnidades,
    paginaActual: data.paginaActual,
    totalPaginas: data.totalPaginas,
  }),

  setFiltros: (nuevosFiltros) => set((state) => ({
    filtros: { ...state.filtros, ...nuevosFiltros },
  })),

  limpiarFiltros: () => set({
    filtros: { estados: [], tipo: null, precioMin: null, precioMax: null, busqueda: '' },
  }),

  setCargando: (valor) => set({ cargando: valor }),
  setError: (error) => set({ error }),
}))
