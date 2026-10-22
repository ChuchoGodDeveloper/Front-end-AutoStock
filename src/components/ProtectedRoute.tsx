import { useEffect, type ReactNode } from 'react'
import { Car } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const estaAutenticado = useAuthStore((estado) => estado.estaAutenticado)
  const sesionCargada = useAuthStore((estado) => estado.sesionCargada)
  const expiraEn = useAuthStore((estado) => estado.expiraEn)
  const requiereCambioPassword = useAuthStore(
    (estado) => estado.usuario?.requiereCambioPassword ?? false,
  )
  const hidratarSesion = useAuthStore((estado) => estado.hidratarSesion)
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion)
  const ubicacion = useLocation()

  useEffect(() => {
    if (!sesionCargada) {
      void hidratarSesion()
    }
  }, [sesionCargada, hidratarSesion])

  useEffect(() => {
    if (!estaAutenticado || !expiraEn) return

    const verificarVigencia = () => {
      if (new Date(expiraEn).getTime() <= Date.now()) {
        void cerrarSesion()
      }
    }

    const intervalo = window.setInterval(verificarVigencia, 30 * 1000)

    return () => window.clearInterval(intervalo)
  }, [estaAutenticado, expiraEn, cerrarSesion])

  if (!sesionCargada) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100">
        <Car className="h-10 w-10 animate-pulse text-blue-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-700">Verificando sesión...</p>
      </main>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  if (requiereCambioPassword && ubicacion.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />
  }

  return <>{children}</>
}
