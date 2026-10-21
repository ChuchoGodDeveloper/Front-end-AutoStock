import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { SesionActiva } from '../types/sesion'

interface AutoStockPwaDb extends DBSchema {
  sesion_activa: {
    key: string
    value: SesionActiva
  }
}

const NOMBRE_DB = 'autostock-pwa-db'
const VERSION_DB = 1
const STORE_SESION = 'sesion_activa'
const LLAVE_SESION = 'sesion-actual'

let promesaDb: Promise<IDBPDatabase<AutoStockPwaDb>> | null = null

function obtenerDb(): Promise<IDBPDatabase<AutoStockPwaDb>> {
  if (!promesaDb) {
    promesaDb = openDB<AutoStockPwaDb>(NOMBRE_DB, VERSION_DB, {
      upgrade(baseDeDatos) {
        if (!baseDeDatos.objectStoreNames.contains(STORE_SESION)) {
          baseDeDatos.createObjectStore(STORE_SESION)
        }
      },
    })
  }

  return promesaDb
}

export async function guardarSesion(sesion: SesionActiva): Promise<void> {
  try {
    const baseDeDatos = await obtenerDb()
    await baseDeDatos.put(STORE_SESION, sesion, LLAVE_SESION)
  } catch {
    // El dispositivo puede no disponer de IndexedDB (modo privado); la sesión sigue en memoria.
  }
}

export async function leerSesion(): Promise<SesionActiva | null> {
  try {
    const baseDeDatos = await obtenerDb()
    const sesion = await baseDeDatos.get(STORE_SESION, LLAVE_SESION)
    return sesion ?? null
  } catch {
    return null
  }
}

export async function borrarSesion(): Promise<void> {
  try {
    const baseDeDatos = await obtenerDb()
    await baseDeDatos.delete(STORE_SESION, LLAVE_SESION)
  } catch {
    // Sin IndexedDB no hay nada que borrar.
  }
}

export function esSesionVigente(sesion: SesionActiva | null): sesion is SesionActiva {
  if (!sesion || !sesion.token) return false

  const expiracion = new Date(sesion.expiraEn).getTime()

  return Number.isFinite(expiracion) && expiracion > Date.now()
}
