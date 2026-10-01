import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { usuarioService } from '../services/api'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await usuarioService.listar(filtro)
        setUsuarios(data)
      } catch (error) {
        console.error('Error cargando usuarios:', error)
      } finally {
        setCargando(false)
      }
    }
    cargarUsuarios()
  }, [filtro])

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Administración de usuarios</h2>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
            Nuevo usuario
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFiltro('')}
            className={`px-3 py-1 rounded ${filtro === '' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro('activos')}
            className={`px-3 py-1 rounded ${filtro === 'activos' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
          >
            Activos
          </button>
          <button
            onClick={() => setFiltro('desactivados')}
            className={`px-3 py-1 rounded ${filtro === 'desactivados' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
          >
            Desactivados
          </button>
        </div>

        {cargando ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID Empleado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rol</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td className="px-4 py-3">{usuario.nombreCompleto}</td>
                    <td className="px-4 py-3 font-mono text-sm">{usuario.idEmpleado}</td>
                    <td className="px-4 py-3">{usuario.rol}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        usuario.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {usuario.activo ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-primary-600 hover:text-primary-700 text-sm mr-2">
                        Editar
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm">
                        {usuario.activo ? 'Desactivar' : 'Reactivar'}
                      </button>
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
