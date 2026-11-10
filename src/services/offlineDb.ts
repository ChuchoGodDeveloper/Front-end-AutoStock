import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Vehiculo, VehiculoDetalle } from '../types/vehiculo'

export interface MetaInventario {
  ultimaActualizacion: string // ISO string
  totalRegistros: number
}

export type TipoOperacionOffline =
  | 'CAMBIO_ESTADO'
  | 'REUBICACION'
  | 'ACTUALIZAR_KM_NOTAS'
  | 'REGISTRAR_VEHICULO'
  | 'SUBIR_FOTO'

export interface OperacionOffline {
  id: string // UUID
  tipo: TipoOperacionOffline
  vehiculoId?: string
  datos: unknown
  descripcion: string
  creadoEn: string // ISO string
  estado: 'Esperando conexión' | 'Sincronizando' | 'No se pudo sincronizar'
  error?: string
  intentos: number
}

interface AutoStockOfflineDb extends DBSchema {
  inventario_catalogo: {
    key: string // vehiculo.id
    value: Vehiculo
  }
  fichas_tecnicas: {
    key: string // vehiculo.id
    value: VehiculoDetalle
  }
  meta_inventario: {
    key: string // 'meta'
    value: MetaInventario
  }
  cola_sincronizacion: {
    key: string // id
    value: OperacionOffline
  }
}

const NOMBRE_DB = 'autostock-offline-db'
const VERSION_DB = 2
const STORE_CATALOGO = 'inventario_catalogo'
const STORE_FICHAS = 'fichas_tecnicas'
const STORE_META = 'meta_inventario'
const STORE_COLA = 'cola_sincronizacion'
const LLAVE_META = 'meta'

let promesaDb: Promise<IDBPDatabase<AutoStockOfflineDb>> | null = null

function obtenerDb(): Promise<IDBPDatabase<AutoStockOfflineDb>> {
  if (!promesaDb) {
    promesaDb = openDB<AutoStockOfflineDb>(NOMBRE_DB, VERSION_DB, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_CATALOGO)) {
          db.createObjectStore(STORE_CATALOGO, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORE_FICHAS)) {
          db.createObjectStore(STORE_FICHAS, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META)
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains(STORE_COLA)) {
          db.createObjectStore(STORE_COLA, { keyPath: 'id' })
        }
      },
    })
  }
  return promesaDb
}

export async function encolarOperacionOffline(op: OperacionOffline): Promise<void> {
  try {
    const db = await obtenerDb()
    await db.put(STORE_COLA, op)
  } catch {
    // Modo privado fallback
  }
}

export async function leerColaOffline(): Promise<OperacionOffline[]> {
  try {
    const db = await obtenerDb()
    const operaciones = await db.getAll(STORE_COLA)
    return operaciones.sort(
      (a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime(),
    )
  } catch {
    return []
  }
}

export async function actualizarOperacionOffline(op: OperacionOffline): Promise<void> {
  try {
    const db = await obtenerDb()
    await db.put(STORE_COLA, op)
  } catch {
    // Continuar
  }
}

export async function eliminarOperacionOffline(id: string): Promise<void> {
  try {
    const db = await obtenerDb()
    await db.delete(STORE_COLA, id)
  } catch {
    // Continuar
  }
}

export async function contarOperacionesPendientes(): Promise<number> {
  try {
    const db = await obtenerDb()
    return await db.count(STORE_COLA)
  } catch {
    return 0
  }
}

export async function guardarInventarioLocal(
  vehiculos: Vehiculo[],
  fichas?: VehiculoDetalle[],
): Promise<void> {
  try {
    const db = await obtenerDb()
    const tx = db.transaction([STORE_CATALOGO, STORE_META, STORE_FICHAS], 'readwrite')
    const catalogoStore = tx.objectStore(STORE_CATALOGO)
    const metaStore = tx.objectStore(STORE_META)
    const fichasStore = tx.objectStore(STORE_FICHAS)

    for (const v of vehiculos) {
      await catalogoStore.put(v)
    }

    if (fichas) {
      for (const f of fichas) {
        await fichasStore.put(f)
      }
    }

    const meta: MetaInventario = {
      ultimaActualizacion: new Date().toISOString(),
      totalRegistros: vehiculos.length,
    }
    await metaStore.put(meta, LLAVE_META)
    await tx.done
  } catch {
    // Continúa en memoria
  }
}

export async function guardarFichaTecnicaLocal(ficha: VehiculoDetalle): Promise<void> {
  try {
    const db = await obtenerDb()
    await db.put(STORE_FICHAS, ficha)
  } catch {
    // Continúa
  }
}

export async function leerFichaTecnicaLocal(id: string): Promise<VehiculoDetalle | null> {
  try {
    const db = await obtenerDb()
    const ficha = await db.get(STORE_FICHAS, id)
    return ficha ?? null
  } catch {
    return null
  }
}

export async function leerInventarioLocal(): Promise<Vehiculo[]> {
  try {
    const db = await obtenerDb()
    return await db.getAll(STORE_CATALOGO)
  } catch {
    return []
  }
}

export async function leerMetaInventario(): Promise<MetaInventario | null> {
  try {
    const db = await obtenerDb()
    const meta = await db.get(STORE_META, LLAVE_META)
    return meta ?? null
  } catch {
    return null
  }
}

export async function limpiarInventarioLocal(): Promise<void> {
  try {
    const db = await obtenerDb()
    const tx = db.transaction([STORE_CATALOGO, STORE_FICHAS, STORE_META, STORE_COLA], 'readwrite')
    await tx.objectStore(STORE_CATALOGO).clear()
    await tx.objectStore(STORE_FICHAS).clear()
    await tx.objectStore(STORE_META).clear()
    await tx.objectStore(STORE_COLA).clear()
    await tx.done
  } catch {
    // Continúa
  }
}
