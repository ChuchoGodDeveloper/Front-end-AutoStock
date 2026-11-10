import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CloudOff,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useSyncStore } from '../services/syncService'
import type { OperacionOffline } from '../services/offlineDb'

export function PendientesPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()
  const cola = useSyncStore((s) => s.cola)
  const sincronizando = useSyncStore((s) => s.sincronizando)
  const cargarCola = useSyncStore((s) => s.cargarCola)
  const sincronizarTodo = useSyncStore((s) => s.sincronizarTodo)
  const descartarOperacion = useSyncStore((s) => s.descartarOperacion)
  const ultimoResultado = useSyncStore((s) => s.ultimoResultado)

  const [idAEliminar, setIdAEliminar] = useState<string | null>(null)

  useEffect(() => {
    void cargarCola()
  }, [cargarCola])

  const manejarSincronizar = async () => {
    await sincronizarTodo()
  }

  const confirmarEliminar = async (id: string) => {
    await descartarOperacion(id)
    setIdAEliminar(null)
  }

  return (
    <main className="showroom-page">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <SpotlightCard as="header" tone="ink" className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: 'var(--champagne)' }}
              >
                AUTOSTOCK PRO · COLA OFFLINE
              </p>
              <SplitTitle
                text="Cambios Pendientes"
                className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5"
              />
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    enLinea
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {enLinea ? (
                    <>
                      <Wifi className="h-3.5 w-3.5" /> Conectado
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3.5 w-3.5" /> Sin conexión
                    </>
                  )}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                  {cola.length} {cola.length === 1 ? 'cambio pendiente' : 'cambios pendientes'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="v-glass btn-squish flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition hover:border-sky-400/50"
              style={{ color: 'var(--ink)' }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver</span>
            </button>
          </div>
        </SpotlightCard>

        {ultimoResultado && (
          <div
            role="status"
            className="v-glass tone--blue flex items-center justify-between gap-3 rounded-2xl p-4 text-sm font-bold shadow-lg"
            style={{ color: 'var(--ink)' }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-sky-400" />
              <span>{ultimoResultado}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void manejarSincronizar()}
            disabled={!enLinea || sincronizando || cola.length === 0}
            className="btn-squish flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
            <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
          </button>
        </div>

        {cola.length === 0 ? (
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-10 text-center">
            <CloudOff className="h-12 w-12 text-sky-400/60" />
            <h3 className="text-lg font-black" style={{ color: 'var(--ink)' }}>
              No tienes cambios pendientes
            </h3>
            <p className="max-w-md text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Todas tus operaciones están sincronizadas con el servidor. Cualquier cambio que
              realices sin conexión aparecerá aquí automáticamente.
            </p>
            <Link
              to="/catalogo"
              className="v-glass btn-squish mt-2 rounded-xl px-4 py-2 text-xs font-bold text-sky-400"
            >
              Ir al catálogo
            </Link>
          </SpotlightCard>
        ) : (
          <div className="space-y-3">
            {cola.map((op: OperacionOffline) => (
              <SpotlightCard
                key={op.id}
                tone={op.estado === 'No se pudo sincronizar' ? 'coral' : 'ink'}
                className="p-5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          op.estado === 'No se pudo sincronizar'
                            ? 'bg-rose-500/20 text-rose-400'
                            : op.estado === 'Sincronizando'
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {op.estado}
                      </span>
                      <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--ink-2)' }}>
                        <Clock className="h-3 w-3" />
                        {new Date(op.creadoEn).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                      {op.descripcion}
                    </p>

                    {op.error && (
                      <p className="flex items-center gap-1 text-xs font-semibold text-rose-400">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Motivo: {op.error}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIdAEliminar(op.id)}
                    className="v-glass btn-squish flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition self-end sm:self-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Descartar</span>
                  </button>
                </div>

                {idAEliminar === op.id && (
                  <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-rose-400">
                      ¿Descartar este cambio? No se podrá recuperar.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIdAEliminar(null)}
                        className="v-glass rounded-lg px-2.5 py-1 text-xs font-bold"
                        style={{ color: 'var(--ink)' }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => void confirmarEliminar(op.id)}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </SpotlightCard>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

