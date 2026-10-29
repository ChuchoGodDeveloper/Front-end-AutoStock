export interface MarcaConModelos {
  marca: string
  modelos: string[]
}

export const CATALOGO_MARCAS_MODELOS: readonly MarcaConModelos[] = [
  {
    marca: 'Toyota',
    modelos: ['Corolla', 'RAV4', 'Tacoma', 'Yaris', 'Camry', 'Hilux', 'Prius', 'Avanza', 'Highlander'],
  },
  {
    marca: 'Nissan',
    modelos: ['Versa', 'Kicks', 'Sentra', 'Frontier', 'March', 'X-Trail', 'Altima', 'NP300', 'Urvan'],
  },
  {
    marca: 'Chevrolet',
    modelos: ['Aveo', 'Tracker', 'Onix', 'Captiva', 'Silverado', 'S10', 'Groove', 'Cavalier', 'Trax'],
  },
  {
    marca: 'Mazda',
    modelos: ['3', 'CX-5', 'CX-30', '2', 'CX-50', 'CX-90', 'MX-5'],
  },
  {
    marca: 'Volkswagen',
    modelos: ['Jetta', 'Tiguan', 'Taos', 'Virtus', 'Polo', 'Nivus', 'Saveiro', 'T-Cross', 'Teramont'],
  },
  {
    marca: 'Honda',
    modelos: ['Civic', 'CR-V', 'HR-V', 'Accord', 'City', 'BR-V', 'Pilot', 'Odyssey'],
  },
  {
    marca: 'Kia',
    modelos: ['Sportage', 'Rio', 'Forte', 'Seltos', 'K3', 'Soul', 'Sorento', 'Carnival'],
  },
  {
    marca: 'Hyundai',
    modelos: ['Elantra', 'Tucson', 'Creta', 'Grand i10', 'Santa Fe', 'HB20', 'Palisade'],
  },
  {
    marca: 'Ford',
    modelos: ['Maverick', 'Explorer', 'Ranger', 'Bronco', 'Bronco Sport', 'Escape', 'F-150', 'Mustang', 'Territory'],
  },
  {
    marca: 'Renault',
    modelos: ['Kwid', 'Duster', 'Oroch', 'Stepway', 'Koleos', 'Megane', 'Captur'],
  },
  {
    marca: 'MG',
    modelos: ['ZS', 'GT', 'MG5', 'RX5', 'ONE', 'MG4', 'HS'],
  },
  {
    marca: 'Suzuki',
    modelos: ['Swift', 'Vitara', 'Jimny', 'Baleno', 'S-Cross', 'Ertiga', 'Ignis'],
  },
  {
    marca: 'Jeep',
    modelos: ['Compass', 'Renegade', 'Grand Cherokee', 'Wrangler', 'Gladiator', 'Commander'],
  },
  {
    marca: 'Subaru',
    modelos: ['Forester', 'Crosstrek', 'Outback', 'WRX', 'BRZ', 'Evoltis'],
  },
  {
    marca: 'BMW',
    modelos: ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'X1', 'X3', 'X5'],
  },
  {
    marca: 'Audi',
    modelos: ['A1', 'A3', 'A4', 'A5', 'Q2', 'Q3', 'Q5', 'Q7'],
  },
  {
    marca: 'Mercedes-Benz',
    modelos: ['Clase A', 'Clase C', 'Clase E', 'GLA', 'GLB', 'GLC', 'GLE'],
  },
] as const

export function obtenerMarcas(): string[] {
  return CATALOGO_MARCAS_MODELOS.map((m) => m.marca).sort((a, b) => a.localeCompare(b))
}

export function obtenerModelosPorMarca(marca: string): string[] {
  if (!marca) return []
  const encontrada = CATALOGO_MARCAS_MODELOS.find(
    (m) => m.marca.toLowerCase() === marca.trim().toLowerCase(),
  )
  return encontrada ? [...encontrada.modelos].sort((a, b) => a.localeCompare(b)) : []
}

export function esCombinacionValida(marca: string, modelo: string): boolean {
  if (!marca || !modelo) return false
  const modelos = obtenerModelosPorMarca(marca)
  if (modelos.length === 0) {
    // Si es una marca externa que no está en el catálogo, solo validar que no esté vacío y tenga formato válido
    return modelo.trim().length >= 1 && modelo.trim().length <= 50
  }
  return modelos.some((m) => m.toLowerCase() === modelo.trim().toLowerCase())
}
