import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { metricaService } from '../services/api'

export default function MetricasPage() {
  const [metricas, setMetricas] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarMetricas = async () => {
      try {
        const data = await metricaService.obtenerMetricas()
        setMetricas(data)
      } catch (error) {
        console.error('Error cargando métricas:', error)
      } finally {
        setCargando(false)
      }
    }
    cargarMetricas()
  }, [])

  if (cargando) return <Layout><div className="text-center py-8">Cargando...</div></Layout>
  if (!metricas) return null

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Métricas del lote</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total unidades activas</h3>
            <p className="text-3xl font-bold text-gray-900">{metricas.totalActivas}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Nuevas</h3>
            <p className="text-3xl font-bold text-green-600">{metricas.nuevas}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Seminuevas</h3>
            <p className="text-3xl font-bold text-blue-600">{metricas.seminuevas}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Vendidas este mes</h3>
            <p className="text-3xl font-bold text-purple-600">{metricas.vendidasMes}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Unidades por estado</h3>
          <div className="space-y-3">
            {metricas.porEstado?.map((item) => (
              <div key={item.estado} className="flex items-center gap-4">
                <span className="w-32 text-sm text-gray-600">{item.estado}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full"
                    style={{
                      width: `${item.porcentaje}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="w-16 text-sm text-gray-600 text-right">
                  {item.cantidad} ({item.porcentaje}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Días promedio en el lote</h3>
          <p className="text-3xl font-bold text-gray-900">{metricas.diasPromedio} días</p>
        </div>
      </div>
    </Layout>
  )
}
