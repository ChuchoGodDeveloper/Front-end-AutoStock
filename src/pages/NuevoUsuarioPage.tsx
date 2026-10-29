import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  IdCard,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  Sparkles,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { OfflineBanner } from '../components/OfflineBanner'
import { MENSAJES } from '../config/mensajes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { HttpError } from '../services/httpClient'
import { usuariosService, type UsuarioCreadoBackend } from '../services/usuariosService'
import { calcularEdad, generarIdentificadorPreview } from '../utils/generadorIdentificador'

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
  fechaNacimiento?: string
  empleadoId?: string
  correo?: string
  rolId?: string
}

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
}

// Fecha máxima para asegurar que tenga al menos 18 años
function obtenerFechaMaxima18Anios(): string {
  const hoy = new Date()
  const anio = hoy.getFullYear() - 18
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function NuevoUsuarioPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [empleadoIdPersonalizado, setEmpleadoIdPersonalizado] = useState('')
  const [usarIdManual, setUsarIdManual] = useState(false)
  const [correo, setCorreo] = useState('')
  const [rolId, setRolId] = useState<string>('4')

  const [erroresCampo, setErroresCampo] = useState<ErroresNuevoUsuario>({})
  const [mensajeError, setMensajeError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [usuarioCreado, setUsuarioCreado] = useState<UsuarioCreadoBackend | null>(null)
  const [copiado, setCopiado] = useState(false)

  // Cálculo en tiempo real del identificador automático
  const idPreview = generarIdentificadorPreview(nombreCompleto, fechaNacimiento)
  const edadCalculada = fechaNacimiento ? calcularEdad(fechaNacimiento) : null
  const fechaMaxima = obtenerFechaMaxima18Anios()

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

    const nombreLimpio = nombreCompleto.trim()
    if (!nombreLimpio) {
      nuevosErrores.nombreCompleto = MENSAJES.campoObligatorio
    } else if (nombreLimpio.length < 3) {
      nuevosErrores.nombreCompleto = 'El nombre completo debe tener al menos 3 caracteres'
    } else if (nombreLimpio.length > 150) {
      nuevosErrores.nombreCompleto = 'El nombre completo no puede exceder 150 caracteres'
    }

    if (!fechaNacimiento) {
      nuevosErrores.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
    } else {
      const edad = calcularEdad(fechaNacimiento)
      if (edad < 18) {
        nuevosErrores.fechaNacimiento = 'El colaborador debe tener al menos 18 años de edad'
      } else if (edad > 99) {
        nuevosErrores.fechaNacimiento = 'Verifique la fecha de nacimiento ingresada'
      }
    }

    if (usarIdManual && !empleadoIdPersonalizado.trim()) {
      nuevosErrores.empleadoId = 'Ingrese un identificador o desactive la opción manual'
    } else if (usarIdManual && empleadoIdPersonalizado.trim().length > 20) {
      nuevosErrores.empleadoId = 'El ID de empleado no puede exceder 20 caracteres'
    }

    const correoLimpio = correo.trim()
    if (!correoLimpio) {
      nuevosErrores.correo = MENSAJES.campoObligatorio
    } else if (correoLimpio.length > 100) {
      nuevosErrores.correo = 'El correo electrónico no puede exceder 100 caracteres'
    } else if (!esCorreoValido(correoLimpio)) {
      nuevosErrores.correo = MENSAJES.correoInvalido
    }

    const rolNumerico = Number(rolId)
    if (!rolId || !ROLES_SISTEMA.some((rol) => rol.id === rolNumerico)) {
      nuevosErrores.rolId = MENSAJES.campoObligatorio
    }

    if (
      nuevosErrores.nombreCompleto ||
      nuevosErrores.fechaNacimiento ||
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
        nombreCompleto: nombreLimpio,
        fechaNacimiento,
        empleadoId: usarIdManual ? empleadoIdPersonalizado.trim() : undefined,
        correo: correoLimpio,
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
    <main className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-12">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <OfflineBanner visible={!enLinea} />

        <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3" />
                Administración
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserPlus className="w-7 h-7 text-blue-600" />
              Alta de Personal
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Registra personal autorizado con generación inteligente de ID y asignación de rol
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            disabled={guardando}
            className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a usuarios
          </button>
        </header>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <form onSubmit={manejarEnvio} noValidate aria-busy={guardando} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nombre Completo */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="nombre-completo"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {nombreCompleto.length}/150
                  </span>
                </div>
                <div className="relative">
                  <UserRound
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="nombre-completo"
                    name="nombreCompleto"
                    type="text"
                    maxLength={150}
                    autoComplete="name"
                    placeholder="Ej. Ana Sofía Morales Gómez"
                    value={nombreCompleto}
                    onChange={(evento) => {
                      setNombreCompleto(evento.target.value)
                      setErroresCampo((prev) => ({ ...prev, nombreCompleto: undefined }))
                    }}
                    disabled={guardando}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
                  />
                </div>
                {erroresCampo.nombreCompleto && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                    {erroresCampo.nombreCompleto}
                  </p>
                )}
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label
                  htmlFor="fecha-nacimiento"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Fecha de nacimiento <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="fecha-nacimiento"
                    name="fechaNacimiento"
                    type="date"
                    max={fechaMaxima}
                    min="1920-01-01"
                    value={fechaNacimiento}
                    onChange={(evento) => {
                      setFechaNacimiento(evento.target.value)
                      setErroresCampo((prev) => ({ ...prev, fechaNacimiento: undefined }))
                    }}
                    disabled={guardando}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition bg-white"
                  />
                </div>
                {edadCalculada !== null && edadCalculada >= 0 && (
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    Edad calculada: <strong className="text-slate-800">{edadCalculada} años</strong>
                    {edadCalculada < 18 && (
                      <span className="text-red-600 ml-1 font-semibold">(Menor de edad)</span>
                    )}
                  </p>
                )}
                {erroresCampo.fechaNacimiento && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                    {erroresCampo.fechaNacimiento}
                  </p>
                )}
              </div>

              {/* Rol */}
              <div>
                <label
                  htmlFor="rol-id"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Rol asignado <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition bg-white"
                  >
                    {ROLES_SISTEMA.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {erroresCampo.rolId && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                    {erroresCampo.rolId}
                  </p>
                )}
              </div>

              {/* Correo Electrónico */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="correo"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Correo electrónico corporativo <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {correo.length}/100
                  </span>
                </div>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    inputMode="email"
                    maxLength={100}
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="Ej. ana.morales@autostock.com"
                    value={correo}
                    onChange={(evento) => {
                      setCorreo(evento.target.value)
                      setErroresCampo((prev) => ({ ...prev, correo: undefined }))
                    }}
                    disabled={guardando}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
                  />
                </div>
                {erroresCampo.correo && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                    {erroresCampo.correo}
                  </p>
                )}
              </div>
            </div>

            {/* Tarjeta de Previsualización y Control de Identificador */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Identificador de Empleado (ID)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUsarIdManual(!usarIdManual)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition underline underline-offset-2"
                >
                  {usarIdManual ? 'Usar ID Automático' : 'Personalizar ID manual'}
                </button>
              </div>

              {!usarIdManual ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">
                      Generado automáticamente con iniciales del nombre + AAMMDD + consecutivo:
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-blue-200 shadow-xs">
                      <span className="font-mono text-base font-black text-blue-700 tracking-wider">
                        {idPreview}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        Auto
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="empleado-id-manual" className="block text-xs font-semibold text-slate-700">
                    ID manual personalizado (máximo 20 caracteres)
                  </label>
                  <input
                    id="empleado-id-manual"
                    type="text"
                    maxLength={20}
                    placeholder="Ej. EMP-00425"
                    value={empleadoIdPersonalizado}
                    onChange={(e) => setEmpleadoIdPersonalizado(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-mono font-bold uppercase bg-white"
                  />
                  {erroresCampo.empleadoId && (
                    <p role="alert" className="text-xs font-semibold text-red-600">
                      {erroresCampo.empleadoId}
                    </p>
                  )}
                </div>
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

            <div className="flex flex-col sm:flex-row-reverse gap-3 pt-2">
              <button
                type="submit"
                disabled={guardando || !enLinea}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Registrando Usuario...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Completar Registro
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/usuarios')}
                disabled={guardando}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Modal de Éxito con Contraseña Temporal */}
      {usuarioCreado && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-usuario-creado-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
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

            <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-slate-500">Nombre:</dt>
                <dd className="font-bold text-slate-900">{usuarioCreado.nombreCompleto}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-slate-500">ID de empleado:</dt>
                <dd className="font-mono font-bold text-blue-700">{usuarioCreado.empleadoId}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-slate-500">Rol:</dt>
                <dd className="font-bold text-slate-900">{usuarioCreado.rol}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="font-semibold text-slate-500">Estado:</dt>
                <dd className="font-bold text-emerald-700">
                  {usuarioCreado.activo ? 'Activo' : 'Inactivo'}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Contraseña temporal (12 caracteres)
              </p>
              <p className="mt-2 select-all font-mono text-2xl font-black tracking-wider text-slate-900">
                {usuarioCreado.passwordTemporal}
              </p>
              <button
                type="button"
                onClick={() => void manejarCopiarPassword()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                {copiado ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
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
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Entendido, volver a la lista
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
