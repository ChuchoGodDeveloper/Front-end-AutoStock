import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { ordenServicioService } from '../services/api'

export default function OrdenServicioPage() {
  const { vehiculoId } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tipoTrabajo: '',
    descripcion: '',
    prioridad: 'Media',
    costoEstimado: '',
    responsable: '',
    fechaEstimada: '',
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
      await ordenServicioService.crear(vehiculoId, {
        ...formData,
        costoEstimado: formData.costoEstimado ? parseFloat(formData.costoEstimado) : null,
      })
      navigate(`/vehiculo/${vehiculoId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear orden de servicio</h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de trabajo</label>
            <select
              name="tipoTrabajo"
              value={formData.tipoTrabajo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Seleccionar...</option>
              <option value="Mecanico">Mecánico</option>
              <option value="Estetico">Estético</option>
              <option value="MecanicoEstetico">Mecánico y estético</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo estimado (MXN)</label>
              <input
                type="number"
                name="costoEstimado"
                value={formData.costoEstimado}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <input
                type="text"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha estimada</label>
              <input
                type="date"
                name="fechaEstimada"
                value={formData.fechaEstimada}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              {cargando ? 'Guardando...' : 'Guardar orden'}
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
