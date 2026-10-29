import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Lock,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { OfflineBanner } from '../components/OfflineBanner'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { HttpError } from '../services/httpClient'
import {
  permisosService,
  type AccionPermisoBackend,
  type MatrizPermisosBackend,
} from '../services/permisosService'

const CODIGO_CONSULTAR_CATALOGO = 'consultar_catalogo'
const ROL_ADMINISTRADOR = 'Administrador'

function formatearFecha(fechaIso?: string | null): string {
  if (!fechaIso) return 'Sin registros previos'
  try {
    const fecha = new Date(fechaIso)
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(fecha)
  } catch {
    return fechaIso
  }
}

export function PermisosPage() {
  const navigate = useNavigate()
  const enLinea = useOnlineStatus()

  const [matrizOriginal, setMatrizOriginal] = useState<MatrizPermisosBackend | null>(null)
  const [permisosEditados, setPermisosEditados] = useState<Record<number, Record<string, boolean>>>({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [restableciendo, setRestableciendo] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const [modalConfirmarRestablecer, setModalConfirmarRestablecer] = useState(false)
  const [modalDescartarCambios, setModalDescartarCambios] = useState(false)

  const cargarMatriz = useCallback(async () => {
    setCargando(true)
    setMensajeError(null)

    try {
      const datos = await permisosService.obtenerMatriz()
      setMatrizOriginal(datos)

      const mapaInicial: Record<number, Record<string, boolean>> = {}
      for (const rol of datos.roles) {
        mapaInicial[rol.rolId] = { ...rol.permisos }
      }
      setPermisosEditados(mapaInicial)
    } catch (err) {
      if (err instanceof HttpError && err.message.trim()) {
        setMensajeError(err.message.trim())
      } else {
        setMensajeError('No se pudo cargar la matriz de permisos. Intenta nuevamente.')
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarMatriz()
  }, [cargarMatriz])

  // Detección de cambios sin guardar
  const hayCambiosSinGuardar = useMemo(() => {
    if (!matrizOriginal) return false

    for (const rol of matrizOriginal.roles) {
      const editados = permisosEditados[rol.rolId]
      if (!editados) continue

      for (const [codigo, valorOriginal] of Object.entries(rol.permisos)) {
        if (editados[codigo] !== valorOriginal) {
          return true
        }
      }
    }

    return false
  }, [matrizOriginal, permisosEditados])

  // Advertencia de cierre de pestaña si hay cambios sin guardar
  useEffect(() => {
    const manejarBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hayCambiosSinGuardar) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', manejarBeforeUnload)
    return () => window.removeEventListener('beforeunload', manejarBeforeUnload)
  }, [hayCambiosSinGuardar])

  const manejarCambioPermiso = (rolId: number, nombreRol: string, codigo: string, nuevoValor: boolean) => {
    setMensajeExito(null)
    setMensajeError(null)

    // Criterio 4: Los permisos del Administrador no se pueden modificar
    if (nombreRol === ROL_ADMINISTRADOR) {
      return
    }

    // Criterio 5: El permiso de catálogo es obligatorio para todos los roles
    if (codigo === CODIGO_CONSULTAR_CATALOGO && !nuevoValor) {
      setMensajeError('El permiso de consultar catálogo y ficha técnica es obligatorio y no se puede quitar.')
      return
    }

    setPermisosEditados((prev) => ({
      ...prev,
      [rolId]: {
        ...prev[rolId],
        [codigo]: nuevoValor,
      },
    }))
  }

  const manejarGuardar = async () => {
    if (!enLinea) {
      setMensajeError('Se requiere conexión para modificar permisos')
      return
    }

    if (!matrizOriginal) return

    setGuardando(true)
    setMensajeError(null)
    setMensajeExito(null)

    try {
      const payloadRoles = matrizOriginal.roles.map((rol) => ({
        rolId: rol.rolId,
        permisos: permisosEditados[rol.rolId] ?? rol.permisos,
      }))

      const respuesta = await permisosService.guardarMatriz({ roles: payloadRoles })
      setMensajeExito(respuesta.mensaje || 'Permisos actualizados')
      await cargarMatriz()
    } catch (err) {
      if (err instanceof HttpError && err.message.trim()) {
        setMensajeError(err.message.trim())
      } else {
        setMensajeError('Error al guardar los permisos. Verifica tu conexión.')
      }
    } finally {
      setGuardando(false)
    }
  }

  const confirmarRestablecer = async () => {
    if (!enLinea) {
      setMensajeError('Se requiere conexión para modificar permisos')
      setModalConfirmarRestablecer(false)
      return
    }

    setRestableciendo(true)
    setMensajeError(null)
    setMensajeExito(null)

    try {
      const respuesta = await permisosService.restablecerValoresIniciales()
      setMensajeExito(respuesta.mensaje || 'Permisos restablecidos a los valores iniciales')
      setModalConfirmarRestablecer(false)
      await cargarMatriz()
    } catch (err) {
      if (err instanceof HttpError && err.message.trim()) {
        setMensajeError(err.message.trim())
      } else {
        setMensajeError('Error al restablecer los permisos iniciales.')
      }
    } finally {
      setRestableciendo(false)
    }
  }

  const manejarSalida = () => {
    if (hayCambiosSinGuardar) {
      setModalDescartarCambios(true)
    } else {
      navigate('/dashboard')
    }
  }

  const accionesAgrupadas = useMemo(() => {
    if (!matrizOriginal?.acciones) return []
    return matrizOriginal.acciones
  }, [matrizOriginal])

  return (
    <main className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-12">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <OfflineBanner visible={!enLinea} />

        {/* Encabezado Responsivo */}
        <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={manejarSalida}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label="Volver al Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Seguridad y Accesos
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    <ShieldCheck className="h-3 w-3" />
                    Solo Administrador
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Permisos por rol
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Configura qué acciones y módulos están habilitados para cada perfil de usuario.
                </p>
              </div>
            </div>

            {/* Botones de acción principales */}
            <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
              <button
                type="button"
                onClick={() => setModalConfirmarRestablecer(true)}
                disabled={cargando || guardando || restableciendo}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4 text-slate-500" />
                Restablecer valores iniciales
              </button>

              <button
                type="button"
                onClick={() => void manejarGuardar()}
                disabled={cargando || guardando || !hayCambiosSinGuardar || !enLinea}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  hayCambiosSinGuardar && enLinea
                    ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-500/20'
                    : 'bg-slate-400 cursor-not-allowed opacity-75'
                }`}
              >
                <Save className="h-4 w-4" />
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          {/* Barra de estado / Auditoría */}
          {matrizOriginal && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Última modificación:{' '}
                  <strong className="text-slate-700 font-semibold">
                    {formatearFecha(matrizOriginal.ultimaModificacion)}
                  </strong>
                  {matrizOriginal.modificadoPorNombre && (
                    <> por <strong className="text-slate-700 font-semibold">{matrizOriginal.modificadoPorNombre}</strong></>
                  )}
                </span>
              </div>

              {hayCambiosSinGuardar && (
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Cambios pendientes sin guardar
                </span>
              )}
            </div>
          )}
        </header>

        {/* Mensajes de retroalimentación */}
        {mensajeExito && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-sm"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {mensajeError && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Matriz de Permisos */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Matriz de Control de Acciones
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Usa los interruptores para activar o remover facultades por rol.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                Bloqueado por regla de negocio
              </span>
            </div>
          </div>

          {cargando ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]" />
              <p className="text-sm font-semibold">Cargando matriz de permisos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6 w-2/5">Acción / Capacidad</th>
                    {matrizOriginal?.roles.map((rol) => (
                      <th key={rol.rolId} className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{rol.nombreRol}</span>
                          {rol.nombreRol === ROL_ADMINISTRADOR && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 font-semibold lowercase bg-blue-100 px-1.5 py-0.2 rounded-full">
                              <Lock className="h-2.5 w-2.5" /> inmutable
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {accionesAgrupadas.map((accion: AccionPermisoBackend) => {
                    const esCatalogoFijo = accion.codigo === CODIGO_CONSULTAR_CATALOGO

                    return (
                      <tr key={accion.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {accion.nombre}
                              </span>
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {accion.modulo}
                              </span>
                              {esCatalogoFijo && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <Lock className="h-3 w-3" />
                                  Obligatorio
                                </span>
                              )}
                            </div>
                            {accion.descripcion && (
                              <p className="text-xs text-slate-500 font-normal">
                                {accion.descripcion}
                              </p>
                            )}
                          </div>
                        </td>

                        {matrizOriginal?.roles.map((rol) => {
                          const esAdmin = rol.nombreRol === ROL_ADMINISTRADOR
                          const valorActivo = esAdmin
                            ? true
                            : permisosEditados[rol.rolId]?.[accion.codigo] ?? false

                          const deshabilitado = esAdmin || esCatalogoFijo || !enLinea

                          return (
                            <td key={rol.rolId} className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center">
                                <label
                                  className={`relative inline-flex items-center ${
                                    deshabilitado ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                                  }`}
                                  title={
                                    esAdmin
                                      ? 'Los permisos del Administrador son inmutables'
                                      : esCatalogoFijo
                                      ? 'El permiso de consultar catálogo y ficha técnica no se puede quitar'
                                      : !enLinea
                                      ? 'Se requiere conexión para modificar permisos'
                                      : `Alternar permiso para ${rol.nombreRol}`
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={valorActivo}
                                    disabled={deshabilitado}
                                    onChange={(e) =>
                                      manejarCambioPermiso(
                                        rol.rolId,
                                        rol.nombreRol,
                                        accion.codigo,
                                        e.target.checked,
                                      )
                                    }
                                  />
                                  <div
                                    className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                      esAdmin
                                        ? 'peer-checked:bg-slate-800'
                                        : valorActivo
                                        ? 'peer-checked:bg-blue-600'
                                        : 'bg-slate-200'
                                    }`}
                                  />
                                  {deshabilitado && (
                                    <Lock
                                      className="absolute -top-1 -right-2 h-3.5 w-3.5 text-slate-400"
                                      aria-hidden="true"
                                    />
                                  )}
                                </label>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal de Confirmación para Restablecer Valores Iniciales (Criterio 7) */}
        {modalConfirmarRestablecer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  ¿Restablecer valores iniciales?
                </h3>
              </div>
              <p className="text-sm text-slate-600">
                Esta acción sobrescribirá las modificaciones actuales y restaurará la matriz base recomendada para
                Asesor de Ventas, Encargado de Lote y Gerente.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalConfirmarRestablecer(false)}
                  disabled={restableciendo}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void confirmarRestablecer()}
                  disabled={restableciendo}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 transition shadow-sm"
                >
                  {restableciendo ? 'Restableciendo...' : 'Sí, restablecer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Advertencia de Salida con Cambios sin Guardar (Criterio 6) */}
        {modalDescartarCambios && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Tienes cambios sin guardar
                </h3>
              </div>
              <p className="text-sm text-slate-600">
                Realizaste cambios en la matriz de permisos que aún no han sido guardados. Si sales ahora, se descartarán
                todas las modificaciones realizadas.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalDescartarCambios(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Continuar editando
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalDescartarCambios(false)
                    navigate('/dashboard')
                  }}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition shadow-sm"
                >
                  Descartar y salir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
