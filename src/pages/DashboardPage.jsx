import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuthStore } from '../stores/authStore'
import { metricaService } from '../services/api'

export default function DashboardPage() {
  const { usuario } = useAuthStore()
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const data = await metricaService.obtenerResumen()
        setResumen(data)
      } catch (error) {
        console.error('Error cargando resumen:', error)
      } finally {
        setCargando(false)
      }
    }
    cargarResumen()
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenido, {usuario?.nombreCompleto}
          </h2>
          <p className="text-gray-600">{usuario?.rol}</p>
        </div>

        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Disponibles</h3>
              <p className="text-3xl font-bold text-green-600">{resumen.disponibles}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Test Drive</h3>
              <p className="text-3xl font-bold text-blue-600">{resumen.testDrive}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">En Taller</h3>
              <p className="text-3xl font-bold text-orange-600">{resumen.enTaller}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Acciones rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/catalogo"
              className="bg-primary-50 text-primary-700 px-4 py-3 rounded-lg text-center hover:bg-primary-100"
            >
              Buscar inventario
            </Link>
            {usuario?.rol === 'Encargado de Lote y Recepción' && (
              <Link
                to="/registrar-vehiculo"
                className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-center hover:bg-green-100"
              >
                Registrar vehículo
              </Link>
            )}
            {(usuario?.rol === 'Gerente de Ventas' || usuario?.rol === 'Administrador') && (
              <>
                <Link
                  to="/metricas"
                  className="bg-purple-50 text-purple-700 px-4 py-3 rounded-lg text-center hover:bg-purple-100"
                >
                  Métricas
                </Link>
                <Link
                  to="/reporte-ventas"
                  className="bg-orange-50 text-orange-700 px-4 py-3 rounded-lg text-center hover:bg-orange-100"
                >
                  Reporte ventas
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
