import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useOfflineStore } from '../stores/offlineStore'

export default function PendientesPage() {
  const { cambiosPendientes, isOnline, eliminarCambio } = useOfflineStore()
  const [sincronizando, setSincronizando] = useState(false)

  const sincronizarAhora = async () => {
    setSincronizando(true)
    // Lógica de sincronización aquí
    setTimeout(() => setSincronizando(false), 2000)
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Cambios pendientes</h2>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? 'Conectado' : 'Sin conexión'}
            </span>
            <button
              onClick={sincronizarAhora}
              disabled={!isOnline || sincronizando || cambiosPendientes.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {sincronizando ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
          </div>
        </div>

        {cambiosPendientes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No hay cambios pendientes. Todo está sincronizado.
          </div>
        ) : (
          <div className="space-y-3">
            {cambiosPendientes.map((cambio) => (
              <div key={cambio.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{cambio.descripcion}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(cambio.fecha).toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    cambio.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                    cambio.estado === 'sincronizado' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {cambio.estado === 'pendiente' ? 'Esperando conexión' :
                     cambio.estado === 'sincronizado' ? 'Sincronizado' : 'No se pudo sincronizar'}
                  </span>
                  <button
                    onClick={() => eliminarCambio(cambio.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
