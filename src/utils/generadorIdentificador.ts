const PALABRAS_IGNORADAS = new Set([
  'DE',
  'DEL',
  'LA',
  'LAS',
  'LOS',
  'Y',
  'E',
  'SAN',
  'SANTA',
])

export function obtenerIniciales(nombreCompleto: string): string {
  if (!nombreCompleto || !nombreCompleto.trim()) {
    return 'USR'
  }

  // Quitar acentos y diacríticos
  const normalizado = nombreCompleto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  const partes = normalizado
    .split(/\s+/)
    .map((p) => p.replace(/[^A-Z]/g, ''))
    .filter((p) => p.length > 0 && !PALABRAS_IGNORADAS.has(p))

  if (partes.length === 0) {
    const todas = normalizado
      .split(/\s+/)
      .map((p) => p.replace(/[^A-Z]/g, ''))
      .filter((p) => p.length > 0)
    if (todas.length === 0) return 'USR'
    return todas.map((p) => p[0]).slice(0, 4).join('')
  }

  if (partes.length === 1) {
    const unica = partes[0]
    return unica.length >= 2 ? unica.slice(0, 2) : unica.padEnd(2, 'X')
  }

  const iniciales = partes.slice(0, 4).map((p) => p[0]).join('')
  return iniciales.length < 2 ? iniciales.padEnd(2, 'X') : iniciales
}

export function formatearFechaAAMMDD(fechaStr: string): string {
  if (!fechaStr) return '000000'
  const partes = fechaStr.split('-') // Formato YYYY-MM-DD
  if (partes.length !== 3) return '000000'
  const anio = partes[0].slice(-2)
  const mes = partes[1].padStart(2, '0')
  const dia = partes[2].padStart(2, '0')
  return `${anio}${mes}${dia}`
}

export function calcularEdad(fechaStr: string): number {
  if (!fechaStr) return 0
  const fecha = new Date(fechaStr + 'T00:00:00')
  if (isNaN(fecha.getTime())) return 0
  const hoy = new Date()
  let edad = hoy.getFullYear() - fecha.getFullYear()
  const m = hoy.getMonth() - fecha.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
    edad--
  }
  return edad
}

export function generarIdentificadorPreview(nombreCompleto: string, fechaNacimiento: string): string {
  if (!nombreCompleto.trim() || !fechaNacimiento) {
    return '---'
  }
  const iniciales = obtenerIniciales(nombreCompleto)
  const fecha = formatearFechaAAMMDD(fechaNacimiento)
  return `${iniciales}-${fecha}-01`
}
