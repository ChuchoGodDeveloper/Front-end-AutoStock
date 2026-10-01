import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { catalogoService } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function FichaTecnicaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const [vehiculo, setVehiculo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarVehiculo = async () => {
      try {
        const data = await catalogoService.obtenerVehiculo(id)
        setVehiculo(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargarVehiculo()
  }, [id])

  if (cargando) return <Layout><div className="text-center py-8">Cargando...</div></Layout>
  if (error) return <Layout><div className="text-center py-8 text-red-600">{error}</div></Layout>
  if (!vehiculo) return null

  const puedeEditar = ['Encargado de Lote y Recepción', 'Gerente de Ventas', 'Administrador'].includes(usuario?.rol)
  const puedeCambiarEstado = ['Asesor de Ventas', 'Encargado de Lote y Recepción', 'Gerente de Ventas', 'Administrador'].includes(usuario?.rol)

  return (
    <Layout>
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-primary-600 hover:text-primary-700"
        >
          ← Regresar
        </button>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="h-64 bg-gray-200">
            {vehiculo.fotoPrincipalUrl ? (
              <img
                src={vehiculo.fotoPrincipalUrl}
                alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Sin foto
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {vehiculo.marca} {vehiculo.modelo}
                </h1>
                <p className="text-gray-600">{vehiculo.anio}</p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: vehiculo.colorEstado }}
              >
                {vehiculo.estadoOperativo}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Precio</p>
                <p className="text-xl font-bold text-primary-700">
                  ${vehiculo.precioMXN?.toLocaleString('es-MX')} MXN
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kilometraje</p>
                <p className="text-xl font-bold">{vehiculo.kilometraje?.toLocaleString('es-MX')} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">VIN</p>
                <p className="text-sm font-mono">{vehiculo.vin}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Placa</p>
                <p className="text-sm">{vehiculo.placa || 'No registrado'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Ubicación</h3>
              <p className="text-gray-600">
                Zona {vehiculo.zona}, Cajón {vehiculo.cajon}
              </p>
            </div>

            {puedeCambiarEstado && vehiculo.estadoOperativo !== 'Vendido' && (
              <div className="mt-6 flex gap-3">
                <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                  Cambiar Estado Operativo
                </button>
                {puedeEditar && (
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200">
                    Editar Kilometraje / Datos
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
