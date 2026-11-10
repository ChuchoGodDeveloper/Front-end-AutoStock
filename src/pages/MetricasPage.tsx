import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Car,
  Clock,
  Gauge,
  History,
  RefreshCw,
  TrendingUp,
  WifiOff,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatedCounter, SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { OfflineBanner } from '../components/OfflineBanner'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { apiFetch } from '../services/httpClient'

interface MovimientoReciente {
  id: string
  vehiculoId: string
  vehiculoTitulo: string
  numeroStock: string
  estadoAnterior: string
  estadoNuevo: string
  cambiadoPor: string
  fechaCambio: string
}

interface MetricasCompletas {
  totalActivas: number
  disponibles: number
  enTestDrive: number
  enTaller: number
  enLavado: number
  reservadas: number
  nuevas: number
  seminuevas: number
  ventasMesActual: number
  promedioDiasEnLote: number
  fechaHoraServidor: string
  ultimosMovimientos: MovimientoReciente[]
}

export function MetricasPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()
  const [metricas, setMetricas] = useState<MetricasCompletas | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarMetricas = async () => {
    if (!navigator.onLine) {
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)
    try {
      const data = await apiFetch<MetricasCompletas>('/metricas/lote-completo')
      setMetricas(data)
    } catch {
      setError('No fue posible cargar las métricas del lote. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarMetricas()
  }, [])

  if (!enLinea) {
    return (
      <main className="showroom-page">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <OfflineBanner visible />
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-10 text-center">
            <WifiOff className="h-12 w-12 text-amber-400" />
            <h2 className="text-lg font-black" style={{ color: 'var(--ink)' }}>
              Métricas del lote no disponibles sin conexión
            </h2>
            <p className="max-w-md text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Esta pantalla requiere conexión activa a internet para calcular la rotación en tiempo real.
              Puedes consultar el inventario y catálogo en modo offline.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="v-glass btn-squish mt-2 rounded-xl px-4 py-2 text-xs font-bold text-sky-400"
            >
              Volver al inicio
            </button>
          </SpotlightCard>
        </div>
      </main>
    )
  }

  const calcularPorcentaje = (cantidad: number, total: number) => {
    if (total === 0) return 0
    return Math.round((cantidad / total) * 100)
  }

  return (
    <main className="showroom-page">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <SpotlightCard as="header" tone="ink" className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: 'var(--champagne)' }}
              >
                AUTOSTOCK PRO · TELEMETRÍA DEL LOTE
              </p>
              <SplitTitle
                text="Métricas & Rotación del Stock"
                className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5"
              />
              <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                {metricas?.fechaHoraServidor
                  ? `Actualizado: ${new Date(metricas.fechaHoraServidor).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Cargando telemetría...'}
              </p>
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

        {cargando && (
          <SpotlightCard as="section" className="flex items-center justify-center p-12">
            <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
          </SpotlightCard>
        )}

        {error && (
          <SpotlightCard as="section" tone="coral" className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm font-bold text-rose-400">{error}</p>
            <button
              type="button"
              onClick={() => void cargarMetricas()}
              className="v-glass rounded-xl px-4 py-2 text-xs font-bold"
              style={{ color: 'var(--ink)' }}
            >
              Reintentar
            </button>
          </SpotlightCard>
        )}

        {metricas && !cargando && (
          <>
            {/* Fila de Tarjetas Clave */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SpotlightCard tone="ink" className="p-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-1">
                  Flota Activa
                </span>
                <span className="text-3xl font-black text-white">
                  <AnimatedCounter value={metricas.totalActivas} />
                </span>
                <span className="text-xs font-semibold block mt-1" style={{ color: 'var(--ink-2)' }}>
                  Unidades en lote
                </span>
              </SpotlightCard>

              <SpotlightCard tone="green" className="p-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                  Disponibles
                </span>
                <span className="text-3xl font-black text-white">
                  <AnimatedCounter value={metricas.disponibles} />
                </span>
                <span className="text-xs font-semibold block mt-1" style={{ color: 'var(--ink-2)' }}>
                  {calcularPorcentaje(metricas.disponibles, metricas.totalActivas)}% del total
                </span>
              </SpotlightCard>

              <SpotlightCard tone="ink" className="p-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
                  Ventas del Mes
                </span>
                <span className="text-3xl font-black text-white">
                  <AnimatedCounter value={metricas.ventasMesActual} />
                </span>
                <Link
                  to="/reporte-ventas"
                  className="text-xs font-bold text-sky-400 flex items-center gap-1 mt-1 hover:underline"
                >
                  <span>Ver reporte</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </SpotlightCard>

              <SpotlightCard tone="ink" className="p-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
                  Permanencia Media
                </span>
                <span className="text-3xl font-black text-white">
                  {metricas.promedioDiasEnLote}
                </span>
                <span className="text-xs font-semibold block mt-1" style={{ color: 'var(--ink-2)' }}>
                  Días en inventario
                </span>
              </SpotlightCard>
            </div>

            {/* Desglose Gráfico por Estados */}
            <SpotlightCard as="section" className="p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <BarChart3 className="h-4 w-4 text-sky-400" />
                Distribución por Estado Operativo
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'Disponible para venta', valor: metricas.disponibles, color: 'bg-emerald-500' },
                  { label: 'En prueba de manejo (Test Drive)', valor: metricas.enTestDrive, color: 'bg-sky-500' },
                  { label: 'En taller / mantenimiento', valor: metricas.enTaller, color: 'bg-amber-500' },
                  { label: 'En zona de lavado / preparación', valor: metricas.enLavado, color: 'bg-cyan-500' },
                  { label: 'Reservado / apartado', valor: metricas.reservadas, color: 'bg-teal-500' },
                ].map((item) => {
                  const pct = calcularPorcentaje(item.valor, metricas.totalActivas)
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span style={{ color: 'var(--ink)' }}>{item.label}</span>
                        <span style={{ color: 'var(--ink-2)' }}>
                          {item.valor} unidades ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/10">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </SpotlightCard>

            {/* Composición Nuevas vs Seminuevas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SpotlightCard className="p-6">
                <h3 className="text-xs font-extrabold uppercase tracking-wider mb-3 text-sky-400">
                  Composición del Inventario
                </h3>
                <div className="flex items-center justify-around gap-4">
                  <div className="text-center">
                    <span className="text-2xl font-black text-white">{metricas.nuevas}</span>
                    <p className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
                      Nuevos ({calcularPorcentaje(metricas.nuevas, metricas.totalActivas)}%)
                    </p>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="text-center">
                    <span className="text-2xl font-black text-white">{metricas.seminuevas}</span>
                    <p className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
                      Seminuevos ({calcularPorcentaje(metricas.seminuevas, metricas.totalActivas)}%)
                    </p>
                  </div>
                </div>
              </SpotlightCard>

              {/* Enlace rápido a Reporte de Ventas */}
              <SpotlightCard className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider mb-2 text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" />
                    Reporte de Ventas (HU-22)
                  </h3>
                  <p className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                    Consulta las unidades vendidas por periodo y genera reportes listos para imprimir.
                  </p>
                </div>
                <Link
                  to="/reporte-ventas"
                  className="btn-squish mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg"
                >
                  <span>Abrir reporte de ventas</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </SpotlightCard>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

