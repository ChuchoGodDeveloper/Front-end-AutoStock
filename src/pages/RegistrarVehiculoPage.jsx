import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { catalogoService } from '../services/api'

export default function RegistrarVehiculoPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tipo: 'Seminuevo',
    vin: '',
    marca: '',
    modelo: '',
    anio: '',
    placa: '',
    kilometraje: '',
    precio: '',
    estadoInicial: 'Disponible',
    zona: '',
    cajon: '',
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const vehiculo = await catalogoService.registrarVehiculo({
        ...formData,
        anio: parseInt(formData.anio),
        kilometraje: parseInt(formData.kilometraje),
        precio: parseFloat(formData.precio),
      })
      navigate(`/vehiculo/${vehiculo.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Registrar vehículo</h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de unidad</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Seminuevo">Seminuevo</option>
              <option value="Nuevo">Nuevo de planta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VIN (17 caracteres)</label>
            <input
              type="text"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              maxLength={17}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input
                type="number"
                name="anio"
                value={formData.anio}
                onChange={handleChange}
                min="1990"
                max={new Date().getFullYear() + 1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.tipo === 'Nuevo' ? 'Kilometraje (0)' : 'Kilometraje'}
              </label>
              <input
                type="number"
                name="kilometraje"
                value={formData.kilometraje}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          {formData.tipo === 'Seminuevo' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
              <input
                type="text"
                name="placa"
                value={formData.placa}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (MXN)</label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado inicial</label>
            <select
              name="estadoInicial"
              value={formData.estadoInicial}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Disponible">Disponible</option>
              <option value="En Taller">En Taller</option>
              <option value="En Lavado">En Lavado</option>
              <option value="Test Drive">Test Drive</option>
              <option value="Reservado">Reservado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
              <input
                type="text"
                name="zona"
                value={formData.zona}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cajón</label>
              <input
                type="text"
                name="cajon"
                value={formData.cajon}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
