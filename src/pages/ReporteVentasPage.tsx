import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Filter,
  Printer,
  RefreshCw,
  ShoppingBag,
  User,
  WifiOff,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimatedCounter, SplitTitle, SpotlightCard } from '../components/LiquidUI'
import { OfflineBanner } from '../components/OfflineBanner'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { vehiculosService } from '../services/vehiculosService'
import { useAuthStore } from '../stores/authStore'
import type { ReporteVentas } from '../types/vehiculo'

type TipoPeriodo = 'hoy' | 'esta_semana' | 'este_mes' | 'personalizado'

function formatearMonedaMXN(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(valor)
}

function formatearFecha(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso)
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return fechaIso
  }
}

export function ReporteVentasPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()
  const usuario = useAuthStore((estado) => estado.usuario)

  const [periodo, setPeriodo] = useState<TipoPeriodo>('este_mes')
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  const [reporte, setReporte] = useState<ReporteVentas | null>(null)
  const [cargando, setCargando] = useState(false)
  const [errorAlerta, setErrorAlerta] = useState<string | null>(null)

  const cargarReporte = async (
    tipoPeriodo: TipoPeriodo,
    inicio?: string,
    fin?: string,
  ) => {
    if (!navigator.onLine) {
      return
    }

    if (tipoPeriodo === 'personalizado') {
      if (!inicio || !fin) {
        setErrorAlerta('Debes seleccionar una fecha inicial y una fecha final')
        return
      }
      if (new Date(inicio) > new Date(fin)) {
        setErrorAlerta('La fecha inicial no puede ser posterior a la final')
        return
      }
    }

    setCargando(true)
    setErrorAlerta(null)

    try {
      const data = await vehiculosService.obtenerReporteVentas({
        periodo: tipoPeriodo,
        fechaInicio: tipoPeriodo === 'personalizado' ? inicio : undefined,
        fechaFin: tipoPeriodo === 'personalizado' ? fin : undefined,
      })
      setReporte(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al consultar el reporte de ventas'
      setErrorAlerta(msg)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarReporte('este_mes')
  }, [])

  const cambiarPeriodo = (nuevo: TipoPeriodo) => {
    setPeriodo(nuevo)
    setErrorAlerta(null)
    if (nuevo !== 'personalizado') {
      void cargarReporte(nuevo)
    }
  }

  const aplicarRangoPersonalizado = (e: React.FormEvent) => {
    e.preventDefault()
    void cargarReporte('personalizado', fechaInicio, fechaFin)
  }

  const manejarImprimir = () => {
    if (!reporte || reporte.ventas.length === 0) return
    window.print()
  }

  if (!enLinea) {
    return (
      <main className="showroom-page">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <OfflineBanner visible />
          <SpotlightCard as="section" className="flex flex-col items-center gap-3 p-10 text-center">
            <WifiOff className="h-12 w-12 text-amber-400" />
            <h2 className="text-lg font-black" style={{ color: 'var(--ink)' }}>
              Reporte de ventas no disponible sin conexión
            </h2>
            <p className="max-w-md text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
              Consultar e imprimir el reporte comercial de ventas requiere conexión activa a internet.
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

  const totalVentas = reporte?.ventas.length ?? 0
  const puedeImprimir = totalVentas > 0 && !cargando

  return (
    <>
      {/* Vista Normal en Pantalla (oculta al imprimir) */}
      <main className="showroom-page print:hidden">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          {/* Header */}
          <SpotlightCard as="header" tone="ink" className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p
                  className="text-xs font-extrabold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--champagne)' }}
                >
                  AUTOSTOCK PRO · GESTIÓN COMERCIAL
                </p>
                <SplitTitle
                  text="Reporte de Ventas"
                  className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5"
                />
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                  Generado por: <span className="text-sky-300 font-bold">{usuario?.nombreCompleto || 'Usuario'}</span> · Período activo: <span className="text-emerald-400 font-bold uppercase">{reporte?.periodo || periodo}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="v-glass btn-squish flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold"
                  style={{ color: 'var(--ink)' }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Volver</span>
                </button>

                <button
                  type="button"
                  onClick={manejarImprimir}
                  disabled={!puedeImprimir}
                  className={`btn-squish flex items-center gap-2 rounded-full px-5 py-2 text-xs font-black shadow-lg transition-all ${
                    puedeImprimir
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:brightness-110'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                  aria-label="Imprimir o guardar como PDF"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>
            </div>
          </SpotlightCard>

          {/* Selector de Períodos */}
          <SpotlightCard as="section" className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 mr-1 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  Período:
                </span>
                {(
                  [
                    { id: 'hoy', label: 'Hoy' },
                    { id: 'esta_semana', label: 'Esta semana' },
                    { id: 'este_mes', label: 'Este mes' },
                    { id: 'personalizado', label: 'Rango de fechas' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => cambiarPeriodo(item.id)}
                    className={`btn-squish rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      periodo === item.id
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                        : 'v-glass text-white/70 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {cargando && (
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Actualizando ventas...</span>
                </div>
              )}
            </div>

            {/* Rango Personalizado Formulario */}
            {periodo === 'personalizado' && (
              <form
                onSubmit={aplicarRangoPersonalizado}
                className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-end gap-3"
              >
                <div className="w-full sm:w-auto">
                  <label
                    htmlFor="fecha-inicio"
                    className="block text-[11px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    Fecha inicial
                  </label>
                  <input
                    id="fecha-inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full sm:w-44 rounded-xl bg-white/5 border border-white/15 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                    required
                  />
                </div>

                <div className="w-full sm:w-auto">
                  <label
                    htmlFor="fecha-fin"
                    className="block text-[11px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    Fecha final
                  </label>
                  <input
                    id="fecha-fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full sm:w-44 rounded-xl bg-white/5 border border-white/15 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="btn-squish rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-2 text-xs font-black text-white shadow-md transition-all"
                >
                  Aplicar rango
                </button>
              </form>
            )}
          </SpotlightCard>

          {/* Alerta de Error / Validación */}
          {errorAlerta && (
            <div
              role="alert"
              className="v-glass tone--coral flex items-center justify-between gap-3 rounded-2xl p-4 text-sm font-semibold shadow-lg"
              style={{ color: 'var(--ink)' }}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" aria-hidden="true" />
                <span>{errorAlerta}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorAlerta(null)}
                className="btn-squish rounded-lg p-1.5 hover:bg-white/10"
                aria-label="Cerrar alerta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Tarjetas de Totales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SpotlightCard tone="green" className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-md">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Unidades Vendidas
                </span>
                <span className="text-3xl font-black text-white">
                  <AnimatedCounter value={reporte?.totalUnidades ?? 0} />
                </span>
                <span className="text-xs font-medium block mt-0.5" style={{ color: 'var(--ink-2)' }}>
                  En el período seleccionado
                </span>
              </div>
            </SpotlightCard>

            <SpotlightCard tone="ink" className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/25 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-md">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Monto Total Recaudado
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {formatearMonedaMXN(reporte?.montoTotal ?? 0)}
                </span>
                <span className="text-xs font-medium block mt-0.5" style={{ color: 'var(--ink-2)' }}>
                  Total en pesos mexicanos (MXN)
                </span>
              </div>
            </SpotlightCard>
          </div>

          {/* Tabla y Listado de Ventas */}
          <SpotlightCard as="section" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-400" />
                Detalle de Ventas del Período
              </h3>
              <span className="text-xs font-bold text-sky-400">
                {totalVentas} {totalVentas === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {totalVentas === 0 && !cargando && (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-2xl">
                <ShoppingBag className="h-10 w-10 text-white/30 mb-2" />
                <p className="text-sm font-bold text-white">No hay ventas en este periodo</p>
                <p className="text-xs text-white/50 mt-1 max-w-sm">
                  Prueba seleccionando otro rango de fechas o consulta el catálogo de unidades activas.
                </p>
              </div>
            )}

            {totalVentas > 0 && (
              <>
                {/* Tabla Desktop */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white/60 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 px-3">Fecha Venta</th>
                        <th className="pb-3 px-3">Unidad (Stock)</th>
                        <th className="pb-3 px-3">VIN</th>
                        <th className="pb-3 px-3">Asesor de Ventas</th>
                        <th className="pb-3 px-3 text-right">Precio Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-semibold">
                      {reporte?.ventas.map((v) => (
                        <tr key={v.ventaId} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 text-white/80">
                            {formatearFecha(v.fechaVenta)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">
                              {v.marca} {v.modelo} {v.anio}
                            </span>
                            <span className="text-[10px] text-sky-400 font-mono">
                              {v.numeroStock}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-white/70">
                            {v.vin}
                          </td>
                          <td className="py-3 px-3 text-white/90">
                            <span className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-white/40" />
                              {v.asesorNombre || 'Sin asignar'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-emerald-400">
                            {formatearMonedaMXN(v.precioFinal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tarjetas Móvil */}
                <div className="sm:hidden space-y-3">
                  {reporte?.ventas.map((v) => (
                    <div
                      key={v.ventaId}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-black text-white text-sm block">
                            {v.marca} {v.modelo} {v.anio}
                          </span>
                          <span className="text-[10px] font-mono text-sky-400">
                            {v.numeroStock}
                          </span>
                        </div>
                        <span className="text-sm font-black text-emerald-400">
                          {formatearMonedaMXN(v.precioFinal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-white/70 pt-2 border-t border-white/5">
                        <span className="font-mono">{v.vin}</span>
                        <span>{formatearFecha(v.fechaVenta)}</span>
                      </div>

                      <div className="text-[11px] text-white/80 flex items-center gap-1">
                        <User className="h-3 w-3 text-sky-400" />
                        <span>Asesor: {v.asesorNombre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SpotlightCard>
        </div>
      </main>

      {/* VISTA LIMPIA EXCLUSIVA PARA IMPRESIÓN (Visible solo en @media print) */}
      <div className="hidden print:block p-8 bg-white text-black font-sans text-xs">
        {/* Encabezado Membretado */}
        <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-black">
              AutoStock · Reporte Comercial de Ventas
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Concesionaria Automotriz · Sistema de Control de Stock y Piso de Exhibición
            </p>
          </div>
          <div className="text-right text-[11px] text-neutral-700">
            <p><strong>Fecha emisión:</strong> {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Generado por:</strong> {usuario?.nombreCompleto || 'Usuario'}</p>
          </div>
        </div>

        {/* Resumen del Período */}
        <div className="bg-neutral-100 p-3 rounded mb-4 flex justify-between items-center text-xs">
          <div>
            <p><strong>Período evaluado:</strong> <span className="uppercase">{reporte?.periodo || periodo}</span></p>
            <p className="text-[10px] text-neutral-600">
              Desde: {reporte?.fechaInicio ? formatearFecha(reporte.fechaInicio) : '-'} | Hasta: {reporte?.fechaFin ? formatearFecha(reporte.fechaFin) : '-'}
            </p>
          </div>
          <div className="text-right">
            <p><strong>Total Unidades:</strong> {reporte?.totalUnidades ?? 0}</p>
            <p className="text-sm font-black text-black">
              <strong>Monto Total:</strong> {formatearMonedaMXN(reporte?.montoTotal ?? 0)}
            </p>
          </div>
        </div>

        {/* Tabla de Impresión */}
        <table className="w-full text-left text-[11px] border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-black bg-neutral-200">
              <th className="py-2 px-2">#</th>
              <th className="py-2 px-2">Fecha Venta</th>
              <th className="py-2 px-2">Vehículo</th>
              <th className="py-2 px-2">Stock</th>
              <th className="py-2 px-2">VIN</th>
              <th className="py-2 px-2">Asesor de Ventas</th>
              <th className="py-2 px-2 text-right">Precio Final</th>
            </tr>
          </thead>
          <tbody>
            {reporte?.ventas.map((v, i) => (
              <tr key={v.ventaId} className="border-b border-neutral-300">
                <td className="py-1.5 px-2 text-neutral-600">{i + 1}</td>
                <td className="py-1.5 px-2">{formatearFecha(v.fechaVenta)}</td>
                <td className="py-1.5 px-2 font-bold">{v.marca} {v.modelo} {v.anio}</td>
                <td className="py-1.5 px-2 font-mono">{v.numeroStock}</td>
                <td className="py-1.5 px-2 font-mono text-[10px]">{v.vin}</td>
                <td className="py-1.5 px-2">{v.asesorNombre}</td>
                <td className="py-1.5 px-2 text-right font-black">{formatearMonedaMXN(v.precioFinal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-black bg-neutral-100">
              <td colSpan={6} className="py-2 px-2 text-right uppercase">Total General del Período:</td>
              <td className="py-2 px-2 text-right text-xs">{formatearMonedaMXN(reporte?.montoTotal ?? 0)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Pie de página de Impresión */}
        <div className="pt-4 border-t border-neutral-300 text-[10px] text-neutral-500 flex justify-between">
          <p>Documento oficial emitido por AutoStock PWA. Todos los montos en moneda nacional MXN.</p>
          <p>Página 1 de 1</p>
        </div>
      </div>
    </>
  )
}
