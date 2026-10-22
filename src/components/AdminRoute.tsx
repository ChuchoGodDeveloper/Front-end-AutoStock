import { useEffect, type ReactNode } from 'react'
import { Car } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const ROL_ADMINISTRADOR = 'Administrador'

export function AdminRoute({ children }: { children: ReactNode }) {
  const estaAutenticado = useAuthStore((estado) => estado.estaAutenticado)
  const sesionCargada = useAuthStore((estado) => estado.sesionCargada)
  const usuario = useAuthStore((estado) => estado.usuario)
  const hidratarSesion = useAuthStore((estado) => estado.hidratarSesion)
  const ubicacion = useLocation()

  useEffect(() => {
    if (!sesionCargada) {
      void hidratarSesion()
    }
  }, [sesionCargada, hidratarSesion])

  if (!sesionCargada) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100">
        <Car className="h-10 w-10 animate-pulse text-blue-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-700">Verificando permisos...</p>
      </main>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  if (usuario?.requiereCambioPassword) {
    return <Navigate to="/cambiar-password" replace />
  }

  if (usuario?.rol !== ROL_ADMINISTRADOR) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
