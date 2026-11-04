import type { PaginaCatalogo, Vehiculo, VehiculoDetalle } from '../types/vehiculo'

const DOMINIO_SEMILLA_SIMULADO = 'cdn.autostock.mx'

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generarSvgVehiculoDataUrl(titulo: string, subtitulo?: string): string {
  const tituloSeguro = escaparXml(titulo.trim() || 'AutoStock')
  const subtituloSeguro = subtitulo ? escaparXml(subtitulo.trim()) : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="55%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#60a5fa" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <circle cx="650" cy="90" r="220" fill="url(#glow)"/>
  <ellipse cx="400" cy="332" rx="235" ry="22" fill="#020617" fill-opacity="0.45"/>
  <g transform="translate(175, 165)" fill="none" stroke="#e2e8f0" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M55 125 L95 55 C108 35 130 25 155 25 L285 25 C312 25 335 37 350 58 L392 125" fill="#1e293b" fill-opacity="0.55"/>
    <path d="M25 125 L425 125 C442 125 455 138 455 155 L455 182 C455 192 447 200 437 200 L388 200 M122 200 L268 200 M62 200 L22 200 C12 200 4 192 4 182 L4 155 C4 138 14 125 25 125 Z" fill="#3b82f6" fill-opacity="0.28"/>
    <line x1="220" y1="27" x2="220" y2="122" stroke="#93c5fd" stroke-width="6"/>
    <circle cx="92" cy="200" r="34" fill="#0f172a" stroke="#f8fafc" stroke-width="10"/>
    <circle cx="92" cy="200" r="13" fill="#60a5fa" stroke="none"/>
    <circle cx="356" cy="200" r="34" fill="#0f172a" stroke="#f8fafc" stroke-width="10"/>
    <circle cx="356" cy="200" r="13" fill="#60a5fa" stroke="none"/>
    <path d="M425 148 L448 148" stroke="#fde047" stroke-width="8"/>
    <path d="M10 148 L28 148" stroke="#f87171" stroke-width="8"/>
  </g>
  <text x="400" y="422" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="28" font-weight="800" fill="#f8fafc" letter-spacing="0.5">${tituloSeguro}</text>
  ${subtituloSeguro ? `<text x="400" y="456" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="16" font-weight="600" fill="#93c5fd" letter-spacing="1.5">${subtituloSeguro}</text>` : ''}
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function normalizarUrlImagenVehiculo(
  url: string | null | undefined,
  etiquetaVehiculo?: string,
  subtitulo?: string,
): string | null {
  const limpia = url?.trim()
  if (!limpia) return null

  if (limpia.toLowerCase().includes(DOMINIO_SEMILLA_SIMULADO)) {
    return generarSvgVehiculoDataUrl(etiquetaVehiculo || 'AutoStock', subtitulo)
  }

  return limpia
}

export function normalizarVehiculoCatalogo(vehiculo: Vehiculo): Vehiculo {
  const etiqueta = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`
  return {
    ...vehiculo,
    fotoPrincipalUrl: normalizarUrlImagenVehiculo(
      vehiculo.fotoPrincipalUrl,
      etiqueta,
      `${vehiculo.zonaLote} · CAJÓN ${vehiculo.cajonLote}`,
    ),
  }
}

export function normalizarPaginaCatalogo(pagina: PaginaCatalogo): PaginaCatalogo {
  return {
    ...pagina,
    items: (pagina.items ?? []).map(normalizarVehiculoCatalogo),
  }
}

export function normalizarVehiculoDetalle(detalle: VehiculoDetalle): VehiculoDetalle {
  const etiqueta = `${detalle.marca} ${detalle.modelo} ${detalle.anio}`
  return {
    ...detalle,
    fotoPrincipalUrl: normalizarUrlImagenVehiculo(
      detalle.fotoPrincipalUrl,
      etiqueta,
      detalle.numeroStock,
    ),
    imagenes: (detalle.imagenes ?? []).map((img) => ({
      ...img,
      url:
        normalizarUrlImagenVehiculo(img.url, etiqueta, img.tipoToma) ??
        generarSvgVehiculoDataUrl(etiqueta, img.tipoToma),
    })),
  }
}
