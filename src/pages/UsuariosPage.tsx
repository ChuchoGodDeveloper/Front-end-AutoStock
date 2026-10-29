import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Check,
  IdCard,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ModalDetalleUsuario } from '../components/ModalDetalleUsuario'
import { OfflineBanner } from '../components/OfflineBanner'
import { MENSAJES } from '../config/mensajes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { HttpError } from '../services/httpClient'
import { usuariosService, type UsuarioBackend } from '../services/usuariosService'

type FiltroEstatus = 'todos' | 'activos' | 'desactivados'

export function UsuariosPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()

  const [usuarios, setUsuarios] = useState<UsuarioBackend[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState<FiltroEstatus>('todos')

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioBackend | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [mensajeExitoGlobal, setMensajeExitoGlobal] = useState<string | null>(null)

  const cargarUsuarios = useCallback(async () => {
    setCargando(true)
    setError(null)

    try {
      const lista = await usuariosService.obtenerUsuarios()
      setUsuarios(lista)
    } catch (err) {
      if (err instanceof HttpError && err.message.trim()) {
        setError(err.message.trim())
      } else {
        setError(MENSAJES.errorUsuarios)
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarUsuarios()
  }, [cargarUsuarios])

  const conteos = useMemo(() => {
    return {
      todos: usuarios.length,
      activos: usuarios.filter((u) => u.activo).length,
      desactivados: usuarios.filter((u) => !u.activo).length,
    }
  }, [usuarios])

  const usuariosFiltrados = useMemo(() => {
    let lista = usuarios

    if (filtroEstatus === 'activos') {
      lista = lista.filter((u) => u.activo)
    } else if (filtroEstatus === 'desactivados') {
      lista = lista.filter((u) => !u.activo)
    }

    if (!busqueda.trim()) return lista
    const termino = busqueda.toLowerCase().trim()
    return lista.filter(
      (u) =>
        u.nombreCompleto.toLowerCase().includes(termino) ||
        u.empleadoId.toLowerCase().includes(termino) ||
        u.correo.toLowerCase().includes(termino) ||
        u.rol.toLowerCase().includes(termino),
    )
  }, [usuarios, filtroEstatus, busqueda])

  const manejarAbrirDetalle = (usuario: UsuarioBackend) => {
    setUsuarioSeleccionado(usuario)
    setModalAbierto(true)
  }

  const manejarUsuarioActualizado = async (mensaje?: string) => {
    if (mensaje) {
      setMensajeExitoGlobal(mensaje)
      setTimeout(() => setMensajeExitoGlobal(null), 5000)
    }
    await cargarUsuarios()
    if (usuarioSeleccionado) {
      try {
        const detalle = await usuariosService.obtenerUsuarioPorId(usuarioSeleccionado.id)
        setUsuarioSeleccionado(detalle)
      } catch {
        // En caso de que se haya cerrado o falle la recarga puntual
      }
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-12">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <OfflineBanner visible={!enLinea} />

        {/* Notificación Global de Éxito (CA 2: Usuario actualizado) */}
        {mensajeExitoGlobal && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 shadow-sm animate-fadeIn"
          >
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{mensajeExitoGlobal}</span>
          </div>
        )}

        {/* Header Responsivo */}
        <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3" />
                Seguridad y Accesos
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" />
              Directorio de Personal
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              {usuarios.length} colaboradores autorizados en el sistema AutoStock
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Menú Principal
            </button>
            <Link
              to="/usuarios/nuevo"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Nuevo Personal
            </Link>
          </div>
        </header>

        {/* Controles: Búsqueda y Filtro de Estatus (CA 8) */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, ID de empleado, correo o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {/* Filtro por estatus con conteos (CA 8) */}
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtro de estatus de usuario">
            <button
              type="button"
              role="tab"
              aria-selected={filtroEstatus === 'todos'}
              onClick={() => setFiltroEstatus('todos')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                filtroEstatus === 'todos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Todos
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-black ${
                  filtroEstatus === 'todos' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {conteos.todos}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filtroEstatus === 'activos'}
              onClick={() => setFiltroEstatus('activos')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                filtroEstatus === 'activos'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Activos
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-black ${
                  filtroEstatus === 'activos' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {conteos.activos}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filtroEstatus === 'desactivados'}
              onClick={() => setFiltroEstatus('desactivados')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                filtroEstatus === 'desactivados'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserX className="h-3.5 w-3.5" />
              Desactivados
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-black ${
                  filtroEstatus === 'desactivados' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {conteos.desactivados}
              </span>
            </button>
          </div>
        </div>

        {cargando && (
          <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
            <Users className="h-10 w-10 animate-pulse text-blue-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">Cargando directorio de personal...</p>
          </section>
        )}

        {error && !cargando && (
          <section className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-center text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void cargarUsuarios()}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </section>
        )}

        {!cargando && !error && usuariosFiltrados.length === 0 && (
          <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
            <Users className="h-10 w-10 text-slate-400" aria-hidden="true" />
            <p className="text-center text-sm font-semibold text-slate-700">
              {busqueda
                ? 'No se encontraron colaboradores que coincidan con la búsqueda'
                : 'No hay usuarios en este estatus'}
            </p>
          </section>
        )}

        {!cargando && !error && usuariosFiltrados.length > 0 && (
          <section
            aria-label="Lista de personal"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {usuariosFiltrados.map((item) => (
              <article
                key={item.id}
                tabIndex={0}
                role="button"
                onClick={() => manejarAbrirDetalle(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    manejarAbrirDetalle(item)
                  }
                }}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      <IdCard className="w-3.5 h-3.5" />
                      {item.empleadoId}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.activo
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-slate-300 bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition">
                    {item.nombreCompleto}
                  </h2>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.correo}</span>
                    </div>

                    {item.fechaNacimiento && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Nacimiento: {item.fechaNacimiento}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    {item.rol}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 opacity-80 group-hover:opacity-100 group-hover:underline">
                    <Pencil className="w-3 h-3" />
                    Gestionar
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {/* Modal de Detalle, Edición y Acciones (CA 1 - CA 7) */}
      <ModalDetalleUsuario
        abierto={modalAbierto}
        usuario={usuarioSeleccionado}
        onCerrar={() => setModalAbierto(false)}
        onUsuarioActualizado={(mensaje) => void manejarUsuarioActualizado(mensaje)}
      />
    </main>
  )
}
