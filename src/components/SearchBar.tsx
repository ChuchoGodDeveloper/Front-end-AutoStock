import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useCatalogoStore } from '../stores/catalogoStore'

const RETRASO_BUSQUEDA_MS = 300
const LONGITUD_MINIMA_TERMINO = 2

export function SearchBar() {
  const setTerminoBusqueda = useCatalogoStore((estado) => estado.setTerminoBusqueda)

  const [texto, setTexto] = useState('')
  const [textoDebounced, setTextoDebounced] = useState('')

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setTextoDebounced(texto)
    }, RETRASO_BUSQUEDA_MS)

    return () => window.clearTimeout(temporizador)
  }, [texto])

  useEffect(() => {
    const termino = textoDebounced.trim()
    void setTerminoBusqueda(termino.length >= LONGITUD_MINIMA_TERMINO ? termino : '')
  }, [textoDebounced, setTerminoBusqueda])

  const limpiar = () => {
    setTexto('')
    setTextoDebounced('')
    void setTerminoBusqueda('')
  }

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder="Buscar por VIN, placa o modelo…"
        aria-label="Buscar unidades por VIN, placa o modelo"
        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      {texto && (
        <button
          type="button"
          onClick={limpiar}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
