# AutoStock — Frontend (PWA)

Aplicación Progresiva (PWA) de inventario para concesionarias.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router DOM v6
- Zustand (estado global)
- IndexedDB con `idb` (sesión offline de 8 horas)
- `vite-plugin-pwa` (estrategia `generateSW`, `autoUpdate`)
- ESLint + `tsc --noEmit` (análisis estático)

## Scripts

| Comando              | Descripción                                |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Servidor de desarrollo (modo development)  |
| `npm run build`      | Build de producción en `dist/` + service worker |
| `npm run preview`    | Vista previa del build                     |
| `npm run lint`       | Análisis estático con ESLint               |
| `npm run typecheck`  | Verificación de tipos con TypeScript       |

## Configuración de ambientes

La URL del API **nunca** se escribe a mano en componentes ni stores: se lee siempre
de `ENV.API_BASE_URL` (`src/config/env.ts`), que normaliza el valor de
`VITE_API_URL` (con o sin `/api` final).

| Archivo               | Entorno     | `VITE_API_URL`                                                    |
| --------------------- | ----------- | ----------------------------------------------------------------- |
| `.env.development`    | local       | `http://localhost:5000`                                           |
| `.env.staging`        | staging     | `https://autostock-backend-cyfwg9f4fbcgewfq.centralus-01.azurewebsites.net` |
| `.env.production`     | producción  | `https://autostock-backend-cyfwg9f4fbcgewfq.centralus-01.azurewebsites.net` |

En Azure Static Web Apps la variable se configura como `VITE_API_URL`
(Settings → Configuration). Ver `.env.example`.

## Historia HU-01 — Iniciar sesión

- `/login`: inicio de sesión con ID de empleado o correo + contraseña, con
  mostrar/ocultar contraseña y validaciones (campos obligatorios, 401, 403,
  423 y sin conexión).
- `/dashboard`: menú principal protegido con saludo personalizado, rol del
  usuario, métricas rápidas, banner de modo sin conexión y botón
  **Cerrar sesión**.
- La sesión se guarda en IndexedDB (`autostock-pwa-db` / `sesion_activa`)
  con vigencia de 8 horas. La contraseña nunca se almacena en el dispositivo.

## Despliegue

Workflow de Azure Static Web Apps: `.github/workflows/azure-static-web-apps-icy-pebble-0a56fdd00.yml`
(`output_location: "dist"`).

Workflow de calidad de código: `.github/workflows/ci-code-quality.yml`
(`npm ci` → `lint` → `typecheck` → `build`).
