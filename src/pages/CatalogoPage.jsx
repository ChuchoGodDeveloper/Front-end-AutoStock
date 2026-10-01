import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useCatalogoStore } from '../stores/catalogoStore'
import { catalogoService } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'

export default function CatalogoPage() {
  const navigate = useNavigate()
  const {
    vehiculos, totalUnidades, paginaActual, totalPaginas,
    filtros, setVehiculos, setFiltros, limpiarFiltros, cargando, setCargando
  } = useCatalogoStore()

  const [busquedaInput, setBusquedaInput] = useState(filtros.busqueda)
  const debouncedBusqueda = useDebounce(busquedaInput, 300)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const data = await catalogoService.obtenerCatalogo(paginaActual, {
        ...filtros,
        busqueda: debouncedBusqueda,
      })
      setVehiculos(data)
    } catch (error) {
      console.error('Error cargando catálogo:', error)
    } finally {
      setCargando(false)
    }
  }, [paginaActual, filtros, debouncedBusqueda, setVehiculos, setCargando])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  useEffect(() => {
    setFiltros({ busqueda: debouncedBusqueda })
  }, [debouncedBusqueda, setFiltros])

  return (
    <Layout>
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar por VIN, placa, marca o modelo..."
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-green-100 text-green-700 rounded-md">
                Disponibles
              </button>
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md">
                Seminuevos
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md">
                Nuevos
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">
            {totalUnidades} unidades encontradas
          </p>
        </div>

        {cargando ? (
          <div className="text-center py-8">Cargando...</div>
        ) : vehiculos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No hay unidades registradas
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehiculos.map((vehiculo) => (
              <div
                key={vehiculo.id}
                onClick={() => navigate(`/vehiculo/${vehiculo.id}`)}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="h-48 bg-gray-200">
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
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {vehiculo.marca} {vehiculo.modelo}
                    </h3>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: vehiculo.colorEstado }}
                    >
                      {vehiculo.estadoOperativo}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{vehiculo.anio}</p>
                  <p className="text-lg font-bold text-primary-700 mt-2">
                    ${vehiculo.precioMXN.toLocaleString('es-MX')} MXN
                  </p>
                  <p className="text-sm text-gray-500">
                    {vehiculo.kilometraje.toLocaleString('es-MX')} km
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {vehiculo.zona} - {vehiculo.cajon}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setFiltros({ pagina: i + 1 })}
                className={`px-3 py-1 rounded ${
                  paginaActual === i + 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
