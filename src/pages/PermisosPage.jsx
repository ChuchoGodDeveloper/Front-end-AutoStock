import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { permisoService } from '../services/api'

const roles = ['Asesor de Ventas', 'Encargado de Lote y Recepción', 'Gerente de Ventas', 'Administrador']

const permisos = [
  { id: 'cambiar_estado', label: 'Cambiar estado operativo' },
  { id: 'registrar_vehiculos', label: 'Registrar vehículos' },
  { id: 'capturar_fotografias', label: 'Capturar fotografías' },
  { id: 'reubicar_cajon', label: 'Asignar o reubicar cajón' },
  { id: 'editar_kilometraje', label: 'Editar kilometraje y notas' },
  { id: 'gestionar_ordenes', label: 'Gestionar órdenes de servicio' },
  { id: 'marcar_vendido', label: 'Marcar unidades como vendidas' },
  { id: 'ver_reporte_ventas', label: 'Ver reporte de ventas' },
  { id: 'ver_metricas', label: 'Ver métricas del lote' },
]

const permisosIniciales = {
  'Asesor de Ventas': ['cambiar_estado'],
  'Encargado de Lote y Recepción': ['cambiar_estado', 'registrar_vehiculos', 'capturar_fotografias', 'reubicar_cajon', 'editar_kilometraje', 'gestionar_ordenes'],
  'Gerente de Ventas': ['cambiar_estado', 'editar_kilometraje', 'gestionar_ordenes', 'marcar_vendido', 'ver_reporte_ventas', 'ver_metricas'],
  'Administrador': permisos.map((p) => p.id),
}

export default function PermisosPage() {
  const [permisosActuales, setPermisosActuales] = useState(permisosIniciales)
  const [cargando, setCargando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  const togglePermiso = (rol, permisoId) => {
    setPermisosActuales((prev) => {
      const rolPermisos = prev[rol] || []
      const nuevos = rolPermisos.includes(permisoId)
        ? rolPermisos.filter((p) => p !== permisoId)
        : [...rolPermisos, permisoId]
      return { ...prev, [rol]: nuevos }
    })
    setGuardado(false)
  }

  const guardarCambios = async () => {
    setCargando(true)
    try {
      for (const rol of roles) {
        await permisoService.actualizarPermisos(rol, permisosActuales[rol] || [])
      }
      setGuardado(true)
    } catch (error) {
      console.error('Error guardando permisos:', error)
    } finally {
      setCargando(false)
    }
  }

  const restablecer = () => {
    setPermisosActuales(permisosIniciales)
    setGuardado(false)
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Permisos por rol</h2>
          <div className="flex gap-2">
            <button
              onClick={restablecer}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Restablecer valores iniciales
            </button>
            <button
              onClick={guardarCambios}
              disabled={cargando}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {guardado && (
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md">
            Permisos actualizados correctamente
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acción</th>
                {roles.map((rol) => (
                  <th key={rol} className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    {rol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {permisos.map((permiso) => (
                <tr key={permiso.id}>
                  <td className="px-4 py-3 text-sm">{permiso.label}</td>
                  {roles.map((rol) => (
                    <td key={rol} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={(permisosActuales[rol] || []).includes(permiso.id)}
                        onChange={() => togglePermiso(rol, permiso.id)}
                        disabled={rol === 'Administrador'}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
