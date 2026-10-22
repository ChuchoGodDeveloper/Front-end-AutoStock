# AGENTS.md — Estado, Metodología, Lineamientos y Arquitectura del Proyecto AutoStock (PWA de Inventario)

Este documento maestro concentra el estado actual del proyecto **AutoStock**, la metodología obligatoria de trabajo y rotación de equipo en Git, las reglas arquitectónicas inquebrantables, los lineamientos técnicos obligatorios del Proyecto Integrador PWA, la configuración de despliegue CI/CD en Azure y el backlog completo de Historias de Usuario (`HU-01` a `HU-25`).

---

## 1. Información General y Stack Tecnológico

* **Proyecto:** AutoStock — Aplicación Web Progresiva (PWA) Full-Stack de Inventario para Concesionarias.
* **Equipo:** José de Jesús López Islas (`ChuchoGodDeveloper`) y Delia Leslie Jimenez Neri (`Leslie-Neri`).
* **Ubicación Local del Proyecto:** `C:\Users\lesli\OneDrive\Documentos\CUATRIMESTRE 10\AutoStock`
  * **Backend:** `C:\Users\lesli\OneDrive\Documentos\CUATRIMESTRE 10\AutoStock\BackEnd-AutoStock`
  * **Frontend:** `C:\Users\lesli\OneDrive\Documentos\CUATRIMESTRE 10\AutoStock\Front-end-AutoStock`
  * **Documentación Funcional (HUs `.docx`):** `C:\Users\lesli\OneDrive\Documentos\CUATRIMESTRE 10\Aplicaciones Web Progresivas\Historias de Usuario`
* **Backend (Repositorio: `BackEnd-AutoStock`):**
  * **.NET 10** con **Clean Architecture** en 5 proyectos independientes (`Domain`, `Application`, `Infrastructure`, `API`, `UnitTests`).
  * **SQL Server (Azure SQL)** con **Entity Framework Core** (Migraciones versionadas y Data Seeder en `DbInitializer.cs`).
  * Autenticación **JWT** (vigencia de 8 horas) y hash de contraseñas con **BCrypt**.
  * Pruebas unitarias con **xUnit** y **Moq** (55/55 pruebas en verde hasta HU-10).
  * Análisis estático con **Roslynator** (`.editorconfig` y `Directory.Build.props`) y GitHub Actions (`.github/workflows/ci-quality-tests.yml`).
* **Frontend (Repositorio: `Front-end-AutoStock`):**
  * **React 18**, **TypeScript**, **Vite**, **Tailwind CSS** y **React Router DOM v6**.
  * Estado global con **Zustand** (`authStore.ts`, `catalogoStore.ts`).
  * **PWA nativa** con `vite-plugin-pwa` (Service Worker `autoUpdate`, estrategia `generateSW`, App Shell precacheado).
  * Persistencia offline con **IndexedDB** (`idb` en `sessionDb.ts`).
  * Análisis estático (`eslint`, `typecheck`) automatizado en GitHub Actions (`.github/workflows/ci-code-quality.yml`).

---

## 2. METODOLOGÍA DE TRABAJO Y ROTACIÓN DE EQUIPO (OBLIGATORIO)

El desarrollo del proyecto se divide entre dos desarrolladores. Cada Historia de Usuario (HU) tiene un responsable asignado. **Antes de ejecutar cualquier comando de Git para una nueva HU, el agente DEBE configurar localmente el autor correspondiente** para que los commits queden a su nombre.

### 2.1 Desarrolladores y Credenciales

**Desarrollador 1: José de Jesús López Islas**
* **Asignado a:** Historias impares (`HU-01`, `HU-03`, `HU-05`, `HU-07`, `HU-09`, `HU-11`, `HU-13`, `HU-15`, `HU-17`, `HU-19`, `HU-21`, `HU-23`, `HU-25`).
* **Comando obligatorio antes de iniciar su HU:**
  ```bash
  git config user.name "ChuchoGodDeveloper"
  git config user.email "loij030909hmcpssa0@gmail.com"
  ```

**Desarrollador 2: Delia Leslie Jimenez Neri**
* **Asignada a:** Historias pares (`HU-02`, `HU-04`, `HU-06`, `HU-08`, `HU-10`, `HU-12`, `HU-14`, `HU-16`, `HU-18`, `HU-20`, `HU-22`, `HU-24`).
* **Comando obligatorio antes de iniciar su HU:**
  ```bash
  git config user.name "Leslie-Neri"
  git config user.email "23300765@uttt.edu.mx"
  ```

### 2.2 Flujo de Ramas (GitFlow)
* **Backend (`BackEnd-AutoStock`):** La rama principal de integración actual es `Sprint1` (con `S` mayúscula).
* **Frontend (`Front-end-AutoStock`):** La rama principal de integración actual es `sprint1` (con `s` minúscula).
* **Regla de Desarrollo:** Para cada HU, el agente debe:
  1. Configurar `git config user.name` y `git config user.email` según el responsable de la HU.
  2. Crear una rama `feature/HU-XX-nombre-historia` a partir de la rama principal del sprint (`Sprint1` o `sprint1`).
  3. Desarrollar y verificar calidad/pruebas ahí.
  4. Hacer `git commit` (formato `feat(HU-XX): ...`) y `git push origin feature/HU-XX-nombre-historia`.
  5. Cambiar a la rama principal del sprint (`Sprint1` o `sprint1`), hacer `git merge feature/HU-XX-nombre-historia`, y finalmente hacer `git push` de la rama principal.

### 2.3 Reglas Arquitectónicas Inquebrantables
* **Backend (.NET 10):** Clean Architecture estricta en 5 proyectos (`Domain`, `Application`, `Infrastructure`, `API`, `UnitTests`). Está prohibido usar un proyecto monolítico separado solo por carpetas. Todas las reglas de negocio llevan pruebas unitarias en **xUnit**.
* **Frontend (React 18 + Vite + TypeScript):** Arquitectura basada en PWA con Zustand y Tailwind. Está **ESTRICTAMENTE PROHIBIDO** hardcodear URLs del API; siempre se debe usar el cliente HTTP (`src/services/httpClient.ts`) configurado con variables de entorno (`src/config/env.ts` $\rightarrow$ `VITE_API_URL`). La sesión se maneja en IndexedDB para soporte Offline, y las contraseñas jamás se guardan en el dispositivo.

---

## 3. Lineamientos Técnicos Obligatorios — Proyecto Integrador PWA

*Materia: Aplicaciones Web Progresivas | Ingeniería en Tecnologías de la Información*

El objetivo es desarrollar proyectos alineados con buenas prácticas profesionales de arquitectura, calidad, automatización y mantenimiento de software.

1. **Base de datos:**
   * Utilizar una base de datos relacional (SQL Server en este proyecto).
   * No se permiten bases de datos NoSQL, como MongoDB o Firebase Firestore.
   * Definir relaciones, claves primarias y foráneas de forma adecuada (configuradas mediante Fluent API en `src/AutoStock.Infrastructure/Persistence/Configurations/`).
2. **Arquitectura del backend:**
   * Desarrollado con .NET 10 y ASP.NET Core Web API.
   * Arquitectura en capas mediante proyectos independientes de biblioteca de clases (*Class Library*): `AutoStock.Domain`, `AutoStock.Application`, `AutoStock.Infrastructure`, además de `AutoStock.API` y `AutoStock.UnitTests`.
   * No se acepta un único proyecto con separación solamente por carpetas (Clean Architecture implementada).
   * Acceso a datos mediante Entity Framework Core.
3. **Frontend y configuración de ambientes:**
   * Configurado con archivos de entorno en la raíz de `Front-end-AutoStock`:
     * `.env.development` (desarrollo local: `http://localhost:5000`)
     * `.env.staging` (pruebas/staging: `https://autostock-backend-cyfwg9f4fbcgewfq.centralus-01.azurewebsites.net`)
     * `.env.production` (producción: `https://autostock-backend-cyfwg9f4fbcgewfq.centralus-01.azurewebsites.net`)
   * La URL base del API proviene siempre de `ENV.API_BASE_URL` (`VITE_API_URL`); no existen URLs hardcoded en componentes, servicios ni stores.
   * El cambio de ambiente no exige modificar el código fuente de componentes o servicios.
4. **Calidad de código:**
   * **Backend:** Análisis estático integrado con `Roslynator.Analyzers` en `Directory.Build.props` y reglas en `.editorconfig`, automatizado en GitHub Actions (`.github/workflows/ci-quality-tests.yml`).
   * **Frontend:** Análisis estático con `ESLint` (`npm run lint`) y verificación de tipos con TypeScript (`npm run typecheck`), automatizados en GitHub Actions (`.github/workflows/ci-code-quality.yml`).
5. **Versionamiento de base de datos:**
   * Migraciones de Entity Framework Core versionadas en GitHub dentro de `src/AutoStock.Infrastructure/Persistence/Migrations/`.
   * Prohibido realizar cambios estructurales únicamente de forma manual en el administrador de base de datos.
6. **Pruebas unitarias:**
   * Implementadas en el backend para reglas de negocio y servicios principales usando **xUnit** y **Moq**.
   * Mantenidas en el proyecto independiente `tests/AutoStock.UnitTests/AutoStock.UnitTests.csproj`.
   * Cubren escenarios exitosos, errores y validaciones, y se ejecutan automáticamente en GitHub Actions.
7. **Seguimiento y evaluación:**
   * Mantener los repositorios de GitHub actualizados con código, configuraciones, migraciones y pruebas en cada Sprint.

---

## 4. Detalles Técnicos de Arquitectura y Contratos

### 4.1 Contrato de Errores y Seguridad del Backend (`BackEnd-AutoStock`)
* **Formato estándar de error HTTP:** `ExceptionHandlingMiddleware` intercepta las excepciones de negocio y devuelve siempre `{ "mensaje": "..." }`:
  * `ValidationAppException` $\rightarrow$ `400 Bad Request`
  * `AuthenticationFailedException` $\rightarrow$ `401 Unauthorized`
  * `AccountDisabledException` $\rightarrow$ `403 Forbidden`
  * `NotFoundException` $\rightarrow$ `404 Not Found`
  * `AccountLockedException` $\rightarrow$ `423 Locked`
* **Roles Fijos del Sistema (`DbInitializer.cs`):**
  1. `Id = 1`: `"Administrador"` — Acceso total al sistema y administración de usuarios.
  2. `Id = 2`: `"Gerente de Ventas"` — Gestión y supervisión de ventas.
  3. `Id = 3`: `"Encargado de Lote y Recepción"` — Administración de lotes y recepción de mercancía.
  4. `Id = 4`: `"Asesor de Ventas"` — Atención y asesoría a clientes.
* **Usuarios Semilla Precargados:**
  * Administrador: `EMP-00001` | `admin@autostock.com` | `AdminAutoStock2026!` (`RolId = 1`, `Activo = true`)
  * Asesor de Ventas: `EMP-00421` | `asesor@autostock.com` | `AsesorAutoStock2026!` (`RolId = 4`, `Activo = true`)
  * Usuario Inactivo: `EMP-00999` | `inactivo@autostock.com` | `Inactivo2026!` (`RolId = 4`, `Activo = false`)

### 4.2 Comandos de Verificación Local Antes de Commit
* **En `BackEnd-AutoStock`:**
  ```powershell
  dotnet build AutoStock.sln --configuration Release
  dotnet test AutoStock.sln --configuration Release --no-build
  ```
* **En `Front-end-AutoStock`:**
  ```powershell
  npm run lint
  npm run typecheck
  npm run build
  ```

---

## 5. Configuración de Despliegue Automático (CI/CD en Azure)

* **Enlaces del Proyecto:**
  * **Repositorio Backend:** `https://github.com/ChuchoGodDeveloper/BackEnd-AutoStock`
  * **Repositorio Frontend:** `https://github.com/ChuchoGodDeveloper/Front-end-AutoStock`
  * **URL del Backend Publicado (Azure App Service):** `https://autostock-backend-cyfwg9f4fbcgewfq.centralus-01.azurewebsites.net`
  * **URL del Frontend Publicado (Azure Static Web Apps):** `https://icy-pebble-0a56fdd00.6.azurestaticapps.net`
* **Detalles de Canalización CI/CD:**
  * **Backend (.NET 10):** Publicado en Azure App Service mediante GitHub Actions. Las cadenas de conexión y políticas CORS se administran en la configuración de Azure App Service fuera del código fuente.
  * **Frontend (React + Vite):** Vinculado a Azure Static Web Apps (`.github/workflows/azure-static-web-apps-icy-pebble-0a56fdd00.yml`) con `app_location: "/"` y `output_location: "dist"`. La variable `VITE_API_URL` con protocolo `https://` está configurada en *Environment variables* de Azure Static Web Apps.

---

## 6. Historias de Usuario Completadas (HU-01 a HU-10)

1. **HU-01 (Iniciar sesión — José de Jesús):** JWT de 8h, persistencia en IndexedDB (`autostock-pwa-db`), soporte offline, bloqueo por 5 intentos fallidos durante 15 minutos, mensajes exactos de error (`401`, `403`, `423`).
2. **HU-02 (Consultar catálogo — Delia Leslie):** Infinite scroll paginado, tarjetas con formato MXN, insignias de estado por color, manejo de unidades sin foto, ocultamiento de vendidos por defecto.
3. **HU-03 (Ficha técnica — José de Jesús):** Visor/carrusel de imágenes, panel de especificaciones completo (`VIN`, `NumeroStock`, `Motor`, `Potencia`, `Transmision`, `ColorExterior`, `ColorInterior`, `Equipamiento`, `NotasInspeccion`), botones condicionados por el rol del usuario autenticado.
4. **HU-04 (Buscar unidades — Delia Leslie):** Búsqueda por VIN, placa, marca o modelo con *debounce* de 300ms, ignorando mayúsculas, guiones y espacios, combinada con paginación.
5. **HU-05 (Filtrar inventario — José de Jesús):** Píldoras de filtro rápido con conteos (`GET /api/vehiculos/conteos-rapidos`), Panel Drawer lateral con checkboxes de estados (incluyendo `Vendido`), radios de tipo (`Nuevo` / `Seminuevo`) y validación de rango de precios.
6. **HU-06 (Instalar app PWA — Delia Leslie):** Funcionalidad Frontend exclusiva. Manifest standalone, íconos y colores corporativos, y hook `usePWAInstall` que respeta el rechazo del banner por 7 días.
7. **HU-07 (Crear usuarios — José de Jesús):**
   * **Backend:** Migración `RequiereCambioPassword`, `UsuariosController` protegido para rol `"Administrador"`, generación de contraseña temporal alfanumérica de 12 caracteres devuelta una sola vez, validación `400` para duplicados (`"Ya existe un usuario con ese ID de empleado o correo"`), y endpoint `POST /api/auth/cambiar-password`.
   * **Frontend:** Redirección forzada a `/cambiar-password` en primer acceso (`requiereCambioPassword: true`), `CambiarPasswordPage.tsx` (validación alfanumérica $\ge 8$ caracteres y confirmación), `AdminRoute.tsx`, `UsuariosPage.tsx` y `NuevoUsuarioPage.tsx` con **Modal bloqueante** que muestra la contraseña temporal devuelta por el API.
8. **HU-08 (Registrar un vehículo [alta] — Delia Leslie):**
   * **Backend:** Migración `UpdateVehiculos_AddVersionYRegistradoPor_HU08` (`Version`, `RegistradoPor`), endpoint `POST /api/vehiculos` protegido para `"Encargado de Lote y Recepción"` y `"Administrador"`, validación de VIN (17 caracteres alfanuméricos sin `I`, `O`, `Q`), detección de VIN duplicado devolviendo `"Ya existe una unidad con ese VIN"` y el `vehiculoId` existente, reglas por tipo (`Nuevo` fija `Kilometraje = 0` y `Placa = null`; `Seminuevo` exige `Placa` única y `Kilometraje >= 0`), asignación automática de `NumeroStock` consecutivo (`STK-0026`, etc.) y pruebas unitarias en xUnit.
   * **Frontend:** Restricción del botón **Registrar Vehículo** en `DashboardPage.tsx` y de la ruta `/registrar-vehiculo` para `Encargado de Lote y Recepción` y `Administrador`, formulario completo en `RegistroVehiculoPage.tsx` con selector de tipo (`Seminuevo` / `Nuevo de planta`), alerta de VIN duplicado con acceso directo a la ficha técnica existente, actualización inmediata de `catalogoStore.ts` sin recargar la aplicación y apertura automática de la ficha técnica al guardar.
9. **HU-09 (Capturar evidencia fotográfica — José de Jesús):**
   * **Backend:** Migración `UpdateImagenesVehiculo_AddEvidenciaFotografica_HU09` (`TipoToma`, `FechaCaptura`, `CapturadaPor`, columnas de imagen sin límite fijo para Data URLs), endpoints `POST /api/vehiculos/{id}/fotografias` y `DELETE /api/vehiculos/{id}/fotografias/{imagenId}` protegidos para `"Encargado de Lote y Recepción"` y `"Administrador"`, cálculo automático de `TomasObligatoriasCompletadas` (`0/4` a `4/4`), `PorcentajeEvidencia` (`0%` a `100%`) e `InspeccionCompleta`, uso de la toma `Frontal` como `FotoPrincipalUrl` para el catálogo, límite de `"Máximo 6 fotografías por unidad"` y pruebas unitarias en xUnit.
   * **Frontend:** Pantalla `/vehiculo/:id/evidencia` (`EvidenciaVehiculoPage.tsx`) con las 4 tomas obligatorias (`Frontal`, `Lateral derecha`, `Trasera`, `Tablero / odómetro`) + hasta 2 fotos adicionales, cámara en vivo WebRTC (`getUserMedia`) con respaldo de captura/archivo y guía de permisos de cámara, compresión en Canvas a máximo `1600 px` (JPEG), confirmación antes de eliminar una foto, aviso `Inspección incompleta` cuando faltan tomas obligatorias, y botón **Agregar fotos** en `VehiculoDetallePage.tsx` visible solo para `Encargado de Lote y Recepción` y `Administrador`.
10. **HU-10 (Cambiar estado operativo de una unidad — Delia Leslie):**
    * **Backend:** Entidad inmutable `HistorialEstadoVehiculo` y migración `UpdateVehiculos_AddHistorialYCambioEstado_HU10` (`FechaCambioEstado`, `EstadoActualizadoPor`, `EstadoActualizadoPorUsuarioId`, `ResponsableTestDrive`, `ReservadoPorUsuarioId`, `ReservadoPorNombre`), endpoints `PATCH /api/vehiculos/{id}/estado` y `GET /api/metricas/resumen`, validación que impide asignar `Vendido` desde este flujo, asignación automática del responsable de `TestDrive` y dueño de `Reservado`, restricción para que unidades reservadas por otro usuario solo puedan ser liberadas por quien la reservó, el `Gerente de Ventas` o el `Administrador`, y pruebas unitarias en xUnit.
    * **Frontend:** Modal de cambio de estado operativo en `VehiculoDetallePage.tsx` con las 5 opciones (`Disponible para venta`, `Asignado a prueba de manejo (Test Drive)`, `En taller / mantenimiento`, `En zona de lavado / preparación`, `Reservado / apartado`), botón **Confirmar cambio** deshabilitado si se elige el estado actual, enlace a reubicación de cajón/zona (HU-13), visualización en ficha de quién actualizó el estado y cuándo, responsable de `Test Drive` y quién reservó la unidad, ocultamiento del botón en unidades `Vendido` o reservadas por otro usuario (para Asesor/Encargado), y actualización en tiempo real de ficha, catálogo y contadores sin recargar la app.

---

## 7. Seguimiento Completo del Backlog de Historias de Usuario (HU-01 a HU-25)

| ID | Título o nombre de la HU | Responsable | Prioridad | Sprint | Estado Actual | Comentarios y Reglas Clave |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-01** | Iniciar sesión (3 pts) | José de Jesús López Islas | Alta | Sprint 1 | **Completada** | Usuario Administrador precargado en Seeder. |
| **HU-02** | Consultar catálogo de stock (5 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 1 | **Completada** | 25 unidades de prueba precargadas; alta real llega en HU-08. |
| **HU-03** | Ver ficha técnica de una unidad (5 pts) | José de Jesús López Islas | Alta | Sprint 1 | **Completada** | Incluye placa, equipamiento, notas y ubicación en lote. |
| **HU-04** | Buscar unidades por VIN, placa, marca o modelo (3 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 1 | **Completada** | Separada de filtros; debounce 300ms sin guiones/espacios. |
| **HU-05** | Filtrar inventario por estado, tipo y precio (3 pts) | José de Jesús López Islas | Alta | Sprint 1 | **Completada** | Incluye filtro Vendidos y conteos rápidos. |
| **HU-06** | Instalar la app en la pantalla de inicio (2 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 1 | **Completada** | PWA standalone con recordatorio a los 7 días tras rechazo. |
| **HU-07** | Crear usuarios (5 pts) | José de Jesús López Islas | Alta | Sprint 2 | **Completada** | Rol Administrador; password temporal y cambio en 1er acceso. |
| **HU-08** | Registrar un vehículo (alta) (5 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 2 | **Completada** | Las fotografías se completan después con HU-09. |
| **HU-09** | Capturar evidencia fotográfica (5 pts) | José de Jesús López Islas | Alta | Sprint 2 | **Completada** | 4 tomas obligatorias + 2 adicionales; máx. 6 fotos (1600px). |
| **HU-10** | Cambiar estado operativo (5 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 2 | **Completada** | 5 estados operativos, bitácora inmutable, Test Drive y Reservas. |
| **HU-11** | Configurar permisos por rol (5 pts) | José de Jesús López Islas | Alta | Sprint 3 | Pendiente | Da origen a la matriz de permisos que aplica HU-12. |
| **HU-12** | Restringir funciones según mi rol (5 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 3 | Pendiente | Depende de HU-11. Debe verificarse en cada historia nueva. |
| **HU-13** | Asignar o reubicar cajón en el lote (3 pts) | José de Jesús López Islas | Alta | Sprint 3 | Pendiente | Lista de zonas y cajones del lote. |
| **HU-14** | Editar kilometraje y notas de inspección (3 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 3 | Pendiente | Edición de kilometraje y notas sobre unidades existentes. |
| **HU-15** | Recuperar mi contraseña (3 pts) | José de Jesús López Islas | Media | Sprint 3 | Pendiente | Requiere servicio de correo electrónico funcionando. |
| **HU-16** | Editar y desactivar usuarios (3 pts) | Delia Leslie Jimenez Neri | Media | Sprint 3 | Pendiente | Los usuarios se desactivan, nunca se eliminan, para conservar historiales. |
| **HU-17** | Consultar inventario y fichas sin conexión (8 pts) | José de Jesús López Islas | Alta | Sprint 4 | Pendiente | Historia de mayor riesgo técnico; caché local en IndexedDB. |
| **HU-18** | Registrar cambios sin conexión y sincronizarlos (8 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 4 | Pendiente | Depende de HU-17. Coordinar desarrollo con HU-20 (cola de pendientes). |
| **HU-19** | Marcar unidad como vendida (3 pts) | José de Jesús López Islas | Alta | Sprint 4 | Pendiente | Transición exclusiva al estado Vendido. |
| **HU-20** | Ver y administrar la cola de pendientes (3 pts) | Delia Leslie Jimenez Neri | Media | Sprint 4 | Pendiente | Administrar operaciones pendientes de sincronización offline (HU-18). |
| **HU-21** | Ver dashboard de métricas del lote (5 pts) | José de Jesús López Islas | Media | Sprint 5 | Pendiente | Incluye resumen del Menú Principal (todos los roles) y métricas del Gerente. |
| **HU-22** | Consultar e imprimir reporte de ventas (5 pts) | Delia Leslie Jimenez Neri | Media | Sprint 5 | Pendiente | Depende de HU-19. Usa la función de impresión del navegador. |
| **HU-23** | Crear orden de servicio de taller (5 pts) | José de Jesús López Islas | Baja | Sprint 5 | Pendiente | Prioridad Baja: recortable si el tiempo se ajusta, sin afectar el MVP. |
| **HU-24** | Dar seguimiento y cerrar orden de servicio (5 pts) | Delia Leslie Jimenez Neri | Baja | Sprint 5 | Pendiente | Depende de HU-23. Prioridad Baja, recortable si el tiempo se ajusta. |
| **HU-25** | Consultar historial de mantenimiento (3 pts) | José de Jesús López Islas | Baja | Sprint 5 | Pendiente | Depende de HU-23 y HU-24. No se puede probar de forma aislada. |
