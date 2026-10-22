import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  Check,
  Copy,
  IdCard,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { OfflineBanner } from '../components/OfflineBanner'
import { MENSAJES } from '../config/mensajes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { HttpError } from '../services/httpClient'
import { usuariosService, type UsuarioCreadoBackend } from '../services/usuariosService'

interface OpcionRol {
  id: number
  nombre: string
}

const ROLES_SISTEMA: readonly OpcionRol[] = [
  { id: 4, nombre: 'Asesor de Ventas' },
  { id: 3, nombre: 'Encargado de Lote y Recepción' },
  { id: 2, nombre: 'Gerente de Ventas' },
  { id: 1, nombre: 'Administrador' },
]

interface ErroresNuevoUsuario {
  nombreCompleto?: string
  empleadoId?: string
  correo?: string
  rolId?: string
}

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
}

export function NuevoUsuarioPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [empleadoId, setEmpleadoId] = useState('')
  const [correo, setCorreo] = useState('')
  const [rolId, setRolId] = useState<string>('4')

  const [erroresCampo, setErroresCampo] = useState<ErroresNuevoUsuario>({})
  const [mensajeError, setMensajeError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [usuarioCreado, setUsuarioCreado] = useState<UsuarioCreadoBackend | null>(null)
  const [copiado, setCopiado] = useState(false)

  const manejarCopiarPassword = async () => {
    if (!usuarioCreado?.passwordTemporal) return

    try {
      await navigator.clipboard.writeText(usuarioCreado.passwordTemporal)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()

    const nuevosErrores: ErroresNuevoUsuario = {}

    if (!nombreCompleto.trim()) {
      nuevosErrores.nombreCompleto = MENSAJES.campoObligatorio
    }

    if (!empleadoId.trim()) {
      nuevosErrores.empleadoId = MENSAJES.campoObligatorio
    }

    if (!correo.trim()) {
      nuevosErrores.correo = MENSAJES.campoObligatorio
    } else if (!esCorreoValido(correo)) {
      nuevosErrores.correo = MENSAJES.correoInvalido
    }

    const rolNumerico = Number(rolId)
    if (!rolId || !ROLES_SISTEMA.some((rol) => rol.id === rolNumerico)) {
      nuevosErrores.rolId = MENSAJES.campoObligatorio
    }

    if (
      nuevosErrores.nombreCompleto ||
      nuevosErrores.empleadoId ||
      nuevosErrores.correo ||
      nuevosErrores.rolId
    ) {
      setErroresCampo(nuevosErrores)
      setMensajeError('')
      return
    }

    setErroresCampo({})
    setMensajeError('')
    setGuardando(true)

    try {
      const creado = await usuariosService.crearUsuario({
        nombreCompleto: nombreCompleto.trim(),
        empleadoId: empleadoId.trim(),
        correo: correo.trim(),
        rolId: rolNumerico,
      })

      setUsuarioCreado(creado)
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.status === 400) {
          setMensajeError(error.message.trim() || MENSAJES.usuarioDuplicado)
        } else {
          setMensajeError(error.message.trim() || MENSAJES.errorCrearUsuario)
        }
      } else {
        setMensajeError(MENSAJES.errorCrearUsuario)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-10">
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-6">
        <OfflineBanner visible={!enLinea} />

        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                ADMINISTRACIÓN · AUTOSTOCK
              </p>
              <h1 className="text-2xl font-black text-slate-900">Nuevo usuario</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Registra personal autorizado de la concesionaria
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/usuarios')}
              disabled={guardando}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={manejarEnvio} noValidate aria-busy={guardando} className="space-y-4">
            <div>
              <label
                htmlFor="nombre-completo"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Nombre completo{' '}
                <span className="text-red-600" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="nombre-completo"
                  name="nombreCompleto"
                  type="text"
                  placeholder="Ej. Ana Sofía Morales"
                  value={nombreCompleto}
                  onChange={(evento) => {
                    setNombreCompleto(evento.target.value)
                    setErroresCampo((prev) => ({ ...prev, nombreCompleto: undefined }))
                  }}
                  disabled={guardando}
                  aria-invalid={Boolean(erroresCampo.nombreCompleto)}
                  aria-describedby={
                    erroresCampo.nombreCompleto ? 'nombre-completo-error' : undefined
                  }
                  className={`campo-base pl-11 ${
                    erroresCampo.nombreCompleto ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
              </div>
              {erroresCampo.nombreCompleto && (
                <p
                  id="nombre-completo-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {erroresCampo.nombreCompleto}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="empleado-id"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                ID de empleado{' '}
                <span className="text-red-600" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative">
                <IdCard
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="empleado-id"
                  name="empleadoId"
                  type="text"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="Ej. EMP-00425"
                  value={empleadoId}
                  onChange={(evento) => {
                    setEmpleadoId(evento.target.value)
                    setErroresCampo((prev) => ({ ...prev, empleadoId: undefined }))
                  }}
                  disabled={guardando}
                  aria-invalid={Boolean(erroresCampo.empleadoId)}
                  aria-describedby={erroresCampo.empleadoId ? 'empleado-id-error' : undefined}
                  className={`campo-base pl-11 ${
                    erroresCampo.empleadoId ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
              </div>
              {erroresCampo.empleadoId && (
                <p
                  id="empleado-id-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {erroresCampo.empleadoId}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="correo"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Correo electrónico{' '}
                <span className="text-red-600" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Ej. usuario@autostock.com"
                  value={correo}
                  onChange={(evento) => {
                    setCorreo(evento.target.value)
                    setErroresCampo((prev) => ({ ...prev, correo: undefined }))
                  }}
                  disabled={guardando}
                  aria-invalid={Boolean(erroresCampo.correo)}
                  aria-describedby={erroresCampo.correo ? 'correo-error' : undefined}
                  className={`campo-base pl-11 ${
                    erroresCampo.correo ? 'campo-invalido' : 'campo-valido'
                  }`}
                />
              </div>
              {erroresCampo.correo && (
                <p
                  id="correo-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {erroresCampo.correo}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="rol-id"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Rol{' '}
                <span className="text-red-600" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="relative">
                <Shield
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <select
                  id="rol-id"
                  name="rolId"
                  value={rolId}
                  onChange={(evento) => {
                    setRolId(evento.target.value)
                    setErroresCampo((prev) => ({ ...prev, rolId: undefined }))
                  }}
                  disabled={guardando}
                  aria-invalid={Boolean(erroresCampo.rolId)}
                  aria-describedby={erroresCampo.rolId ? 'rol-id-error' : undefined}
                  className={`campo-base pl-11 ${
                    erroresCampo.rolId ? 'campo-invalido' : 'campo-valido'
                  }`}
                >
                  {ROLES_SISTEMA.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {erroresCampo.rolId && (
                <p
                  id="rol-id-error"
                  role="alert"
                  className="mt-1.5 text-sm font-medium text-red-600"
                >
                  {erroresCampo.rolId}
                </p>
              )}
            </div>

            {mensajeError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {mensajeError}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
              <button
                type="submit"
                disabled={guardando}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" aria-hidden="true" />
                    Guardar
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/usuarios')}
                disabled={guardando}
                className="flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      </div>

      {usuarioCreado && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-usuario-creado-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-white shadow-md">
              <KeyRound className="h-7 w-7" aria-hidden="true" />
            </div>

            <h2
              id="modal-usuario-creado-titulo"
              className="text-center text-xl font-black text-slate-900"
            >
              Usuario registrado con éxito
            </h2>
            <p className="mt-1 text-center text-sm text-slate-600">
              Entrega esta contraseña temporal al colaborador.{' '}
              <strong className="font-bold text-slate-900">
                Solo se mostrará esta única vez.
              </strong>
            </p>

            <dl className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-slate-500">Nombre:</dt>
                <dd className="font-bold text-slate-900">{usuarioCreado.nombreCompleto}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-slate-500">ID de empleado:</dt>
                <dd className="font-bold text-slate-900">{usuarioCreado.empleadoId}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-slate-500">Rol:</dt>
                <dd className="font-bold text-blue-700">{usuarioCreado.rol}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-slate-500">Estado:</dt>
                <dd className="font-bold text-green-700">
                  {usuarioCreado.activo ? 'Activo' : 'Inactivo'}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Contraseña temporal (12 caracteres)
              </p>
              <p className="mt-2 select-all font-mono text-2xl font-black tracking-wider text-slate-900">
                {usuarioCreado.passwordTemporal}
              </p>
              <button
                type="button"
                onClick={() => void manejarCopiarPassword()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-white px-3.5 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
              >
                {copiado ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                    ¡Contraseña copiada!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copiar contraseña
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/usuarios', { replace: true })}
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Entendido, volver a la lista
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
