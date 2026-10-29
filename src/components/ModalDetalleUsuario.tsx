import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  IdCard,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  RotateCcw,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
  UserX,
  X,
} from 'lucide-react'
import { HttpError } from '../services/httpClient'
import {
  usuariosService,
  type UsuarioBackend,
} from '../services/usuariosService'
import { useAuthStore } from '../stores/authStore'

interface ModalDetalleUsuarioProps {
  abierto: boolean
  usuario: UsuarioBackend | null
  onCerrar: () => void
  onUsuarioActualizado: (mensajeExito?: string) => void
}

const ROLES_DISPONIBLES = [
  'Administrador',
  'Gerente de Ventas',
  'Encargado de Lote y Recepción',
  'Asesor de Ventas',
]

export function ModalDetalleUsuario({
  abierto,
  usuario,
  onCerrar,
  onUsuarioActualizado,
}: ModalDetalleUsuarioProps) {
  const usuarioSesion = useAuthStore((estado) => estado.usuario)

  const [modoEdicion, setModoEdicion] = useState(false)
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [correo, setCorreo] = useState('')
  const [rol, setRol] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [mensajeExitoLocal, setMensajeExitoLocal] = useState<string | null>(null)

  // Diálogo para cambiar estatus (desactivar / reactivar)
  const [confirmandoEstatus, setConfirmandoEstatus] = useState(false)
  const [cambiandoEstatus, setCambiandoEstatus] = useState(false)

  // Diálogo para restablecer contraseña
  const [confirmandoResetPassword, setConfirmandoResetPassword] = useState(false)
  const [restableciendoPassword, setRestableciendoPassword] = useState(false)
  const [passwordTemporalGenerada, setPasswordTemporalGenerada] = useState<string | null>(null)
  const [passwordCopiada, setPasswordCopiada] = useState(false)

  const esCuentaPropia = Boolean(
    usuarioSesion &&
      usuario &&
      (String(usuarioSesion.id) === String(usuario.id) ||
        usuarioSesion.empleadoId === usuario.empleadoId ||
        (usuarioSesion.correo &&
          usuario.correo &&
          usuarioSesion.correo.trim().toLowerCase() === usuario.correo.trim().toLowerCase())),
  )

  useEffect(() => {
    if (abierto && usuario) {
      setModoEdicion(false)
      setNombreCompleto(usuario.nombreCompleto)
      setCorreo(usuario.correo)
      setRol(usuario.rol)
      setFechaNacimiento(usuario.fechaNacimiento ?? '')
      setErrorGlobal(null)
      setMensajeExitoLocal(null)
      setConfirmandoEstatus(false)
      setConfirmandoResetPassword(false)
      setPasswordTemporalGenerada(null)
      setPasswordCopiada(false)
    }
  }, [abierto, usuario])

  if (!abierto || !usuario) return null

  const manejarGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorGlobal(null)
    setMensajeExitoLocal(null)

    const nombreLimpio = nombreCompleto.trim()
    const correoLimpio = correo.trim().toLowerCase()

    if (!nombreLimpio) {
      setErrorGlobal('El nombre completo es obligatorio')
      return
    }

    if (nombreLimpio.length < 3) {
      setErrorGlobal('El nombre completo debe tener al menos 3 caracteres')
      return
    }

    if (!correoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setErrorGlobal('Ingresa un correo electrónico válido')
      return
    }

    // CA 7: Protección de rol de cuenta propia
    if (esCuentaPropia && rol.trim().toLowerCase() !== usuario.rol.trim().toLowerCase()) {
      setErrorGlobal('No puedes desactivar tu cuenta ni cambiar tu propio rol')
      return
    }

    setGuardando(true)

    try {
      await usuariosService.editarUsuario(usuario.id, {
        nombreCompleto: nombreLimpio,
        correo: correoLimpio,
        rol,
        fechaNacimiento: fechaNacimiento || undefined,
      })

      const mensaje = 'Usuario actualizado'
      setMensajeExitoLocal(mensaje)
      setModoEdicion(false)
      onUsuarioActualizado(mensaje)
    } catch (err) {
      if (err instanceof HttpError) {
        setErrorGlobal(err.message.trim())
      } else if (err instanceof Error) {
        setErrorGlobal(err.message)
      } else {
        setErrorGlobal('Ocurrió un error inesperado al actualizar el usuario')
      }
    } finally {
      setGuardando(false)
    }
  }

  const manejarCambiarEstatus = async () => {
    // CA 7: Protección de desactivación de cuenta propia
    if (esCuentaPropia && usuario.activo) {
      setErrorGlobal('No puedes desactivar tu cuenta ni cambiar tu propio rol')
      setConfirmandoEstatus(false)
      return
    }

    setCambiandoEstatus(true)
    setErrorGlobal(null)

    const nuevoEstatus = !usuario.activo

    try {
      await usuariosService.cambiarEstatusUsuario(usuario.id, nuevoEstatus)
      const mensaje = nuevoEstatus ? 'Usuario reactivado' : 'Usuario desactivado'
      setMensajeExitoLocal(mensaje)
      setConfirmandoEstatus(false)
      onUsuarioActualizado(mensaje)
    } catch (err) {
      if (err instanceof HttpError) {
        setErrorGlobal(err.message.trim())
      } else if (err instanceof Error) {
        setErrorGlobal(err.message)
      } else {
        setErrorGlobal('Ocurrió un error al cambiar el estatus del usuario')
      }
    } finally {
      setCambiandoEstatus(false)
    }
  }

  const manejarRestablecerPassword = async () => {
    setRestableciendoPassword(true)
    setErrorGlobal(null)

    try {
      const respuesta = await usuariosService.restablecerPassword(usuario.id)
      setPasswordTemporalGenerada(respuesta.passwordTemporal)
      setConfirmandoResetPassword(false)
      setMensajeExitoLocal('Contraseña temporal generada con éxito')
      onUsuarioActualizado()
    } catch (err) {
      if (err instanceof HttpError) {
        setErrorGlobal(err.message.trim())
      } else if (err instanceof Error) {
        setErrorGlobal(err.message)
      } else {
        setErrorGlobal('Ocurrió un error al restablecer la contraseña')
      }
    } finally {
      setRestableciendoPassword(false)
    }
  }

  const manejarCopiarPassword = async () => {
    if (!passwordTemporalGenerada) return
    try {
      await navigator.clipboard.writeText(passwordTemporalGenerada)
      setPasswordCopiada(true)
      setTimeout(() => setPasswordCopiada(false), 3000)
    } catch {
      // Fallback
      setPasswordCopiada(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-usuario-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <User className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="modal-usuario-titulo" className="text-lg font-black text-slate-900">
                {modoEdicion ? 'Editar Usuario' : 'Detalle de Usuario'}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Gestión administrativa y control de credenciales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando || cambiandoEstatus || restableciendoPassword}
            aria-label="Cerrar modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensaje de Éxito Local */}
        {mensajeExitoLocal && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 animate-fadeIn"
          >
            <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{mensajeExitoLocal}</span>
          </div>
        )}

        {/* Mensaje de Error Global */}
        {errorGlobal && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="font-bold">Error en la operación</p>
              <p className="text-red-700 mt-0.5">{errorGlobal}</p>
            </div>
          </div>
        )}

        {/* Sub-vista: Contraseña temporal generada (CA 6) */}
        {passwordTemporalGenerada && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900">
              <KeyRound className="h-5 w-5 text-blue-600 shrink-0" />
              <h3 className="text-sm font-bold">Nueva Contraseña Temporal Generada</h3>
            </div>
            <p className="text-xs text-blue-800">
              Proporciona esta contraseña al colaborador. Se le solicitará cambiarla obligatoriamente
              en su próximo inicio de sesión.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={passwordTemporalGenerada}
                aria-label="Contraseña temporal"
                className="w-full font-mono text-sm font-black text-slate-900 bg-white border border-blue-300 rounded-xl px-3.5 py-2 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={manejarCopiarPassword}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                {passwordCopiada ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-200" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Diálogo de Confirmación: Cambiar Estatus (CA 4 & CA 5) */}
        {confirmandoEstatus && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold text-sm">
                  {usuario.activo ? '¿Desactivar este usuario?' : '¿Reactivar este usuario?'}
                </p>
                <p className="mt-1">
                  {usuario.activo
                    ? 'El colaborador ya no podrá iniciar sesión en el sistema. Los registros históricos y de auditoría se conservarán intactos.'
                    : 'El colaborador podrá iniciar sesión nuevamente con sus credenciales activas.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmandoEstatus(false)}
                disabled={cambiandoEstatus}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={manejarCambiarEstatus}
                disabled={cambiandoEstatus}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition ${
                  usuario.activo
                    ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                }`}
              >
                {cambiandoEstatus ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : usuario.activo ? (
                  <UserX className="h-3.5 w-3.5" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5" />
                )}
                {usuario.activo ? 'Confirmar Desactivación' : 'Confirmar Reactivación'}
              </button>
            </div>
          </div>
        )}

        {/* Diálogo de Confirmación: Restablecer Contraseña (CA 6) */}
        {confirmandoResetPassword && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-bold text-sm">¿Restablecer contraseña temporal?</p>
                <p className="mt-1">
                  Se invalidará la contraseña actual y se generará una contraseña temporal de un solo
                  uso que deberás compartir con el colaborador.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmandoResetPassword(false)}
                disabled={restableciendoPassword}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={manejarRestablecerPassword}
                disabled={restableciendoPassword}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                {restableciendoPassword ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                Confirmar Restablecimiento
              </button>
            </div>
          </div>
        )}

        {/* Contenido: Modo Visualización (CA 1) vs Modo Edición (CA 2) */}
        {!modoEdicion ? (
          <div className="mt-5 space-y-4">
            {/* Banner resumen de usuario */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  <IdCard className="w-3.5 h-3.5 text-blue-600" />
                  ID: {usuario.empleadoId}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    usuario.activo
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-slate-300 bg-slate-100 text-slate-600'
                  }`}
                >
                  {usuario.activo ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Activo
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5 text-slate-500" />
                      Inactivo
                    </>
                  )}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500">Nombre Completo</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{usuario.nombreCompleto}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60 text-xs">
                <div>
                  <p className="font-semibold text-slate-500 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Correo Electrónico
                  </p>
                  <p className="font-medium text-slate-800 mt-0.5 truncate">{usuario.correo}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-slate-400" /> Rol Asignado
                  </p>
                  <p className="font-bold text-blue-700 mt-0.5">{usuario.rol}</p>
                </div>
                {usuario.fechaNacimiento && (
                  <div>
                    <p className="font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Fecha de Nacimiento
                    </p>
                    <p className="font-medium text-slate-800 mt-0.5">{usuario.fechaNacimiento}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Aviso si es cuenta propia (CA 7) */}
            {esCuentaPropia && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Esta es tu cuenta de Administrador activa</p>
                  <p className="text-amber-800 mt-0.5">
                    Por seguridad, no puedes desactivar tu cuenta ni cambiar tu propio rol.
                  </p>
                </div>
              </div>
            )}

            {/* Botones de Acción (CA 1, CA 4, CA 5, CA 6) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setModoEdicion(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <Pencil className="h-3.5 w-3.5 text-slate-600" />
                Editar Datos
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmandoResetPassword(true)
                    setConfirmandoEstatus(false)
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100/80 transition"
                >
                  <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                  Restablecer Contraseña
                </button>

                <button
                  type="button"
                  disabled={esCuentaPropia && usuario.activo}
                  title={
                    esCuentaPropia && usuario.activo
                      ? 'No puedes desactivar tu cuenta ni cambiar tu propio rol'
                      : undefined
                  }
                  onClick={() => {
                    if (esCuentaPropia && usuario.activo) return
                    setConfirmandoEstatus(true)
                    setConfirmandoResetPassword(false)
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                    esCuentaPropia && usuario.activo
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : usuario.activo
                        ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {usuario.activo ? (
                    <>
                      <UserX className="h-3.5 w-3.5 text-rose-600" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                      Reactivar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Formulario de Edición (CA 2, CA 3, CA 7) */
          <form onSubmit={manejarGuardarEdicion} className="mt-5 space-y-4">
            {/* ID de empleado (Inmutable) */}
            <div>
              <label
                htmlFor="input-empleadoid"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                ID de Empleado (No editable)
              </label>
              <input
                id="input-empleadoid"
                type="text"
                value={usuario.empleadoId}
                disabled
                className="w-full font-mono text-sm font-bold text-slate-600 bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2 cursor-not-allowed"
              />
            </div>

            {/* Nombre Completo */}
            <div>
              <label
                htmlFor="input-nombre"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                id="input-nombre"
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                required
                className="w-full text-sm font-medium text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Correo Electrónico */}
            <div>
              <label
                htmlFor="input-correo"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                id="input-correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                className="w-full text-sm font-medium text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Rol Asignado */}
            <div>
              <label
                htmlFor="select-rol"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
              >
                Rol Asignado <span className="text-red-500">*</span>
              </label>
              <select
                id="select-rol"
                value={rol}
                disabled={esCuentaPropia}
                onChange={(e) => setRol(e.target.value)}
                className={`w-full text-sm font-semibold rounded-xl border px-3.5 py-2 transition ${
                  esCuentaPropia
                    ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                }`}
              >
                {ROLES_DISPONIBLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {esCuentaPropia && (
                <p className="mt-1 text-[11px] font-semibold text-amber-700">
                  No puedes cambiar tu propio rol de Administrador.
                </p>
              )}
            </div>

            {/* Fecha de Nacimiento (Opcional / Informativa) */}
            {usuario.fechaNacimiento && (
              <div>
                <label
                  htmlFor="input-fecha-nac"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Fecha de Nacimiento
                </label>
                <input
                  id="input-fecha-nac"
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            )}

            {/* Acciones de Edición */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModoEdicion(false)}
                disabled={guardando}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
