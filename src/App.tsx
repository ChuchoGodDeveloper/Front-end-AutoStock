import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/AdminRoute'
import { InstallPrompt } from './components/InstallPrompt'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CambiarPasswordPage } from './pages/CambiarPasswordPage'
import { CatalogoPage } from './pages/CatalogoPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NuevoUsuarioPage } from './pages/NuevoUsuarioPage'
import { RegistroVehiculoPage } from './pages/RegistroVehiculoPage'
import { UsuariosPage } from './pages/UsuariosPage'
import { VehiculoDetallePage } from './pages/VehiculoDetallePage'
import { useAuthStore } from './stores/authStore'

export default function App() {
  const sesionCargada = useAuthStore((estado) => estado.sesionCargada)
  const hidratarSesion = useAuthStore((estado) => estado.hidratarSesion)

  useEffect(() => {
    if (!sesionCargada) {
      void hidratarSesion()
    }
  }, [sesionCargada, hidratarSesion])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/cambiar-password"
          element={
            <ProtectedRoute>
              <CambiarPasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalogo"
          element={
            <ProtectedRoute>
              <CatalogoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehiculo/:id"
          element={
            <ProtectedRoute>
              <VehiculoDetallePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrar-vehiculo"
          element={
            <ProtectedRoute>
              <RegistroVehiculoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <AdminRoute>
              <UsuariosPage />
            </AdminRoute>
          }
        />
        <Route
          path="/usuarios/nuevo"
          element={
            <AdminRoute>
              <NuevoUsuarioPage />
            </AdminRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <InstallPrompt />
    </BrowserRouter>
  )
}
