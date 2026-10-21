export type AppEnv = 'development' | 'staging' | 'production'

const APP_ENVS_VALIDOS: AppEnv[] = ['development', 'staging', 'production']

const crudoApiUrl = (import.meta.env.VITE_API_URL ?? '').trim()
const crudoAppEnv = (import.meta.env.VITE_APP_ENV ?? '').trim()

function normalizarBaseUrl(url: string): string {
  if (!url) return ''

  const sinBarraFinal = url.replace(/\/+$/, '').trim()

  if (sinBarraFinal.toLowerCase().endsWith('/api')) {
    return sinBarraFinal
  }

  return `${sinBarraFinal}/api`
}

function normalizarAppEnv(valor: string): AppEnv {
  return APP_ENVS_VALIDOS.includes(valor as AppEnv) ? (valor as AppEnv) : 'development'
}

export const ENV = {
  API_BASE_URL: normalizarBaseUrl(crudoApiUrl),
  APP_ENV: normalizarAppEnv(crudoAppEnv),
} as const
