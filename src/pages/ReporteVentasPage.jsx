import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { reporteService } from '../services/api'

export default function ReporteVentasPage() {
  const [periodo, setPeriodo] = useState('mes')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [ventas, setVentas] = useState([])
  const [totalUnidades, setTotalUnidades] = useState(0)
  const [totalMonto, setTotalMonto] = useState(0)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const cargarVentas = async () => {
      setCargando(true)
      try {
        const data = await reporteService.obtenerVentas(periodo, fechaInicio, fechaFin)
        setVentas(data.ventas)
        setTotalUnidades(data.totalUnidades)
        setTotalMonto(data.totalMonto)
      } catch (error) {
        console.error('Error cargando ventas:', error)
      } finally {
        setCargando(false)
      }
    }
    cargarVentas()
  }, [periodo, fechaInicio, fechaFin])

  const imprimir = () => {
    window.print()
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Reporte de ventas</h2>
          <button
            onClick={imprimir}
            disabled={ventas.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            Imprimir / Guardar como PDF
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="hoy">Hoy</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
                <option value="rango">Rango de fechas</option>
              </select>
            </div>
            {periodo === 'rango' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Unidades vendidas</p>
            <p className="text-2xl font-bold">{totalUnidades}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Monto total</p>
            <p className="text-2xl font-bold">${totalMonto.toLocaleString('es-MX')} MXN</p>
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-8">Cargando...</div>
        ) : ventas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No hay ventas en este periodo
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Unidad</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">VIN</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Asesor</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Precio final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ventas.map((venta) => (
                  <tr key={venta.id}>
                    <td className="px-4 py-3 text-sm">
                      {new Date(venta.fechaVenta).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {venta.marca} {venta.modelo} {venta.anio}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{venta.vin}</td>
                    <td className="px-4 py-3 text-sm">{venta.asesor}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      ${venta.precioFinal.toLocaleString('es-MX')} MXN
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
