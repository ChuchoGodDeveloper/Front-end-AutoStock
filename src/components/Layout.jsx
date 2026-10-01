import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useOfflineStore } from '../stores/offlineStore'

const menuItems = [
  { path: '/', label: 'Menú Principal', roles: ['Asesor de Ventas', 'Encargado de Lote y Recepción', 'Gerente de Ventas', 'Administrador'] },
  { path: '/catalogo', label: 'Buscar inventario', roles: ['Asesor de Ventas', 'Encargado de Lote y Recepción', 'Gerente de Ventas', 'Administrador'] },
  { path: '/registrar-vehiculo', label: 'Registrar vehículo', roles: ['Encargado de Lote y Recepción', 'Administrador'] },
  { path: '/metricas', label: 'Métricas del lote', roles: ['Gerente de Ventas', 'Administrador'] },
  { path: '/reporte-ventas', label: 'Reporte de ventas', roles: ['Gerente de Ventas', 'Administrador'] },
  { path: '/usuarios', label: 'Administración de usuarios', roles: ['Administrador'] },
  { path: '/permisos', label: 'Permisos por rol', roles: ['Administrador'] },
  { path: '/pendientes', label: 'Pendientes', roles: ['Asesor de Ventas', 'Encargado de Lote y Recepción', 'Gerente de Ventas', 'Administrador'] },
]

export default function Layout({ children }) {
  const { usuario, logout } = useAuthStore()
  const { cambiosPendientes } = useOfflineStore()

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(usuario?.rol)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">AutoStock</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">{usuario?.nombreCompleto} ({usuario?.rol})</span>
            <button
              onClick={logout}
              className="bg-primary-900 px-3 py-1 rounded text-sm hover:bg-primary-950"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {visibleMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-3 py-2 text-sm rounded hover:bg-gray-100 whitespace-nowrap relative"
              >
                {item.label}
                {item.path === '/pendientes' && cambiosPendientes.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cambiosPendientes.length}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
