import { useEffect, type ReactNode } from 'react'
import { Car } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface PermisoRouteProps {
  codigoPermiso: string
  children: ReactNode
}

export function PermisoRoute({ codigoPermiso, children }: PermisoRouteProps) {
  const estaAutenticado = useAuthStore((estado) => estado.estaAutenticado)
  const sesionCargada = useAuthStore((estado) => estado.sesionCargada)
  const usuario = useAuthStore((estado) => estado.usuario)
  const tienePermiso = useAuthStore((estado) => estado.tienePermiso)
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

  if (!tienePermiso(codigoPermiso)) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{ mensajeNoAutorizado: 'No tienes permiso para acceder a esta sección' }}
      />
    )
  }

  return <>{children}</>
}
