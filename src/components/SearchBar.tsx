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
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder="Buscar por VIN, placa o modelo…"
        aria-label="Buscar unidades por VIN, placa o modelo"
        className="campo-base campo-valido py-2.5 pl-10 pr-9 text-sm font-semibold"
      />
      {texto && (
        <button
          type="button"
          onClick={limpiar}
          aria-label="Limpiar búsqueda"
          className="btn-squish absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          style={{ color: 'var(--ink-2)' }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
