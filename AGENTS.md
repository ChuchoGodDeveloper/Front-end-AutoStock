# AutoStock — Frontend PWA

Aplicación Web Progresiva (PWA) de inventario automotriz con **React 18**, **TypeScript**, **Vite**, **Tailwind CSS** y **React Router DOM v6**.

## Arquitectura del Frontend
- **Estado global:** Zustand (`src/stores/authStore.ts`, `src/stores/catalogoStore.ts`, `src/stores/themeStore.ts`).
- **PWA y Offline:** Service Worker con `vite-plugin-pwa` (`generateSW`) y sesión local en **IndexedDB** (`src/services/sessionDb.ts`).
- **Servicios HTTP:** Cliente en `src/services/httpClient.ts` configurado vía `src/config/env.ts` (`VITE_API_URL`).
- **Reglas detalladas:** `.agents/rules/frontend.md` (UI/TS/PWA) y `.agents/rules/git-workflow.md` (Git/CI-CD).

## Comandos Básicos
```bash
npm install        # Instalar dependencias
npm run dev        # Servidor de desarrollo local (Vite)
npm run lint       # Análisis estático (ESLint)
npm run typecheck  # Verificación de tipos (TypeScript)
npm run build      # Compilación de producción (Vite + PWA)
```
