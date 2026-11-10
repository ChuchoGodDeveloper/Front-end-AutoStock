---
trigger: manual
description: "Reglas de ramas Git, commits y despliegues."
---

# Metodología de Trabajo en Git, Flujo de Ramas y Despliegue CI/CD (AutoStock)

## 1. Rotación de Equipo y Configuración de Autor en Git (Obligatorio)
El desarrollo del proyecto se divide entre dos desarrolladores. Cada Historia de Usuario (HU) tiene un responsable asignado. **Antes de ejecutar cualquier comando de Git para una nueva HU, el agente DEBE configurar localmente el autor correspondiente** para que los commits queden a su nombre:

### Desarrollador 1: José de Jesús López Islas
* **Asignado a:** Historias impares (`HU-01`, `HU-03`, `HU-05`, `HU-07`, `HU-09`, `HU-11`, `HU-13`, `HU-15`, `HU-17`, `HU-19`, `HU-21`, `HU-23`, `HU-25`).
* **Comando obligatorio antes de iniciar su HU:**
  ```bash
  git config user.name "ChuchoGodDeveloper"
  git config user.email "loij030909hmcpssa0@gmail.com"
  ```

### Desarrollador 2: Delia Leslie Jimenez Neri
* **Asignada a:** Historias pares (`HU-02`, `HU-04`, `HU-06`, `HU-08`, `HU-10`, `HU-12`, `HU-14`, `HU-16`, `HU-18`, `HU-20`, `HU-22`, `HU-24`).
* **Comando obligatorio antes de iniciar su HU:**
  ```bash
  git config user.name "Leslie-Neri"
  git config user.email "23300765@uttt.edu.mx"
  ```

---

## 2. Flujo de Ramas (GitFlow) y Reglas de Commits
* **Rama de integración del sprint en Frontend (`Front-end-AutoStock`):** `sprint1` (con `s` minúscula).
* **Rama de integración del sprint en Backend (`BackEnd-AutoStock`):** `Sprint1` (con `S` mayúscula).
* **Configuración de saltos de línea:** Mantener `git config core.autocrlf false` para evitar ruido de conversión LF/CRLF en los diffs.
* **Procedimiento obligatorio por Historia de Usuario:**
  1. Configurar `git config user.name` y `git config user.email` según el responsable de la HU.
  2. Crear una rama `feature/HU-XX-nombre-historia` a partir de la rama principal del sprint (`sprint1` o `Sprint1`).
  3. Desarrollar y verificar calidad/pruebas localmente (`npm run lint`, `npm run typecheck`, `npm run build`).
  4. Hacer `git commit` usando formato Conventional Commits (`feat(HU-XX): ...` o `fix(HU-XX): ...`) y ejecutar `git push origin feature/HU-XX-nombre-historia`.
  5. Cambiar a la rama principal del sprint (`sprint1`), hacer `git merge feature/HU-XX-nombre-historia` y hacer `git push` de la rama del sprint.
  6. **Promoción Secuencial hasta Producción (`main`):** Todo cambio integrado en la rama del sprint debe promoverse secuencialmente por la jerarquía de ramas del repositorio (`sprint1` -> `develop` -> `release` -> `main`), haciendo `merge` y `push` en cada etapa hasta llegar a `main` para disparar el despliegue continuo en Azure.

---

## 3. Configuración de Despliegue Automático (CI/CD en GitHub Actions y Azure)
* **Repositorios en GitHub:**
  * **Frontend:** `https://github.com/ChuchoGodDeveloper/Front-end-AutoStock`
  * **Backend:** `https://github.com/ChuchoGodDeveloper/BackEnd-AutoStock`
* **Recursos y URLs en Azure:**
  * **Frontend Publicado (Azure Static Web Apps):** `https://icy-pebble-0a56fdd00.6.azurestaticapps.net`
  * **Backend Publicado (Azure App Service):** `https://autostock-backend-cyfwg9f4fbcgewfq.centralus-01.azurewebsites.net`
  * **Servidor Azure SQL:** `autostock-sql-srv-2026.database.windows.net` (Grupo: `rg-autostock`, Región: `centralus`, Base de datos: `AutoStockDb`)
* **Pipelines de GitHub Actions en `Front-end-AutoStock`:**
  * **Calidad Continua (`.github/workflows/ci-code-quality.yml`):** Ejecuta `npm ci`, `npm run lint`, `npm run typecheck` y `npm run build` en `push` y `pull_request` hacia `main`, `develop`, `sprint1` y `feature/**`.
  * **Despliegue a Azure Static Web Apps (`.github/workflows/azure-static-web-apps-icy-pebble-0a56fdd00.yml`):** Se dispara al hacer push o PR a `main` con `app_location: "/"` y `output_location: "dist"`, inyectando `VITE_API_URL` con protocolo `https://` desde las variables de entorno de Azure Static Web Apps.
