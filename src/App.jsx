import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CatalogoPage from './pages/CatalogoPage'
import FichaTecnicaPage from './pages/FichaTecnicaPage'
import UsuariosPage from './pages/UsuariosPage'
import PermisosPage from './pages/PermisosPage'
import PendientesPage from './pages/PendientesPage'
import MetricasPage from './pages/MetricasPage'
import ReporteVentasPage from './pages/ReporteVentasPage'
import RegistrarVehiculoPage from './pages/RegistrarVehiculoPage'
import OrdenServicioPage from './pages/OrdenServicioPage'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/catalogo" element={<ProtectedRoute><CatalogoPage /></ProtectedRoute>} />
      <Route path="/vehiculo/:id" element={<ProtectedRoute><FichaTecnicaPage /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
      <Route path="/permisos" element={<ProtectedRoute><PermisosPage /></ProtectedRoute>} />
      <Route path="/pendientes" element={<ProtectedRoute><PendientesPage /></ProtectedRoute>} />
      <Route path="/metricas" element={<ProtectedRoute><MetricasPage /></ProtectedRoute>} />
      <Route path="/reporte-ventas" element={<ProtectedRoute><ReporteVentasPage /></ProtectedRoute>} />
      <Route path="/registrar-vehiculo" element={<ProtectedRoute><RegistrarVehiculoPage /></ProtectedRoute>} />
      <Route path="/orden-servicio/:vehiculoId" element={<ProtectedRoute><OrdenServicioPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
