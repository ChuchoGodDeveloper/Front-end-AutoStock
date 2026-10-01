const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api'

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('autostock-auth')
    ? JSON.parse(localStorage.getItem('autostock-auth')).state?.token
    : null

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers })

  if (response.status === 401) {
    localStorage.removeItem('autostock-auth')
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Error en la solicitud')
  }

  return response.json()
}

export const authService = {
  login: (credencial, password) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ credencial, password }),
    }),

  recuperarContrasena: (correo) =>
    fetchWithAuth('/auth/recuperar', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    }),
}

export const catalogoService = {
  obtenerCatalogo: (pagina = 1, filtros = {}) => {
    const params = new URLSearchParams({ pagina: String(pagina) })
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda)
    if (filtros.estados?.length) params.append('estados', filtros.estados.join(','))
    if (filtros.tipo) params.append('tipo', filtros.tipo)
    if (filtros.precioMin) params.append('precioMin', filtros.precioMin)
    if (filtros.precioMax) params.append('precioMax', filtros.precioMax)
    return fetchWithAuth(`/catalogo?${params}`)
  },

  obtenerVehiculo: (id) => fetchWithAuth(`/vehiculos/${id}`),

  registrarVehiculo: (datos) =>
    fetchWithAuth('/vehiculos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  cambiarEstado: (id, estado) =>
    fetchWithAuth(`/vehiculos/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    }),

  reubicar: (id, zona, cajon) =>
    fetchWithAuth(`/vehiculos/${id}/ubicacion`, {
      method: 'PUT',
      body: JSON.stringify({ zona, cajon }),
    }),

  actualizarKilometraje: (id, kilometraje, notas) =>
    fetchWithAuth(`/vehiculos/${id}/kilometraje`, {
      method: 'PUT',
      body: JSON.stringify({ kilometraje, notas }),
    }),

  marcarVendido: (id, datos) =>
    fetchWithAuth(`/vehiculos/${id}/vendido`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  revertirVenta: (id, motivo) =>
    fetchWithAuth(`/vehiculos/${id}/revertir-venta`, {
      method: 'PUT',
      body: JSON.stringify({ motivo }),
    }),
}

export const usuarioService = {
  listar: (filtro = '') => fetchWithAuth(`/usuarios${filtro ? `?filtro=${filtro}` : ''}`),

  crear: (datos) =>
    fetchWithAuth('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  actualizar: (id, datos) =>
    fetchWithAuth(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  desactivar: (id) =>
    fetchWithAuth(`/usuarios/${id}/desactivar`, { method: 'PUT' }),

  reactivar: (id) =>
    fetchWithAuth(`/usuarios/${id}/reactivar`, { method: 'PUT' }),

  restablecerContrasena: (id) =>
    fetchWithAuth(`/usuarios/${id}/restablecer-contrasena`, { method: 'PUT' }),
}

export const permisoService = {
  obtenerPermisos: () => fetchWithAuth('/permisos'),

  actualizarPermisos: (rol, permisos) =>
    fetchWithAuth('/permisos', {
      method: 'PUT',
      body: JSON.stringify({ rol, permisos }),
    }),
}

export const metricaService = {
  obtenerMetricas: () => fetchWithAuth('/metricas'),

  obtenerResumen: () => fetchWithAuth('/metricas/resumen'),
}

export const reporteService = {
  obtenerVentas: (periodo, fechaInicio, fechaFin) => {
    const params = new URLSearchParams({ periodo })
    if (fechaInicio) params.append('fechaInicio', fechaInicio)
    if (fechaFin) params.append('fechaFin', fechaFin)
    return fetchWithAuth(`/reportes/ventas?${params}`)
  },
}

export const ordenServicioService = {
  crear: (vehiculoId, datos) =>
    fetchWithAuth('/ordenes-servicio', {
      method: 'POST',
      body: JSON.stringify({ vehiculoId, ...datos }),
    }),

  obtener: (id) => fetchWithAuth(`/ordenes-servicio/${id}`),

  agregarNota: (id, nota) =>
    fetchWithAuth(`/ordenes-servicio/${id}/notas`, {
      method: 'POST',
      body: JSON.stringify({ nota }),
    }),

  cerrar: (id, costoFinal, estadoSalida) =>
    fetchWithAuth(`/ordenes-servicio/${id}/cerrar`, {
      method: 'PUT',
      body: JSON.stringify({ costoFinal, estadoSalida }),
    }),

  historial: (vehiculoId) =>
    fetchWithAuth(`/vehiculos/${vehiculoId}/mantenimiento`),
}
