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
  * Pruebas unitarias con **xUnit** y **Moq** (76/76 pruebas en verde hasta HU-13).
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
  5. Cambiar a la rama principal del sprint (`Sprint1` o `sprint1`), hacer `git merge feature/HU-XX-nombre-historia`, y hacer `git push` de la rama del sprint.
  6. **Arquitectura de Promoción de Ramas hasta Producción (`main`):** Todo cambio integrado en la rama del sprint debe promoverse secuencialmente por la jerarquía de ramas del repositorio (`Sprint1`/`sprint1` $\rightarrow$ `develop` $\rightarrow$ `release` $\rightarrow$ `main`), haciendo `merge` y `push` en cada etapa hasta llegar a `main` para disparar el despliegue continuo en Azure.

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

* **Enlaces y Recursos del Proyecto en Azure:**
  * **Repositorio Backend:** `https://github.com/ChuchoGodDeveloper/BackEnd-AutoStock`
  * **Repositorio Frontend:** `https://github.com/ChuchoGodDeveloper/Front-end-AutoStock`
  * **URL del Backend Publicado (Azure App Service):** `https://autostock-backend-cyfwg9f4fbcgewfq.centralus-01.azurewebsites.net`
  * **URL del Frontend Publicado (Azure Static Web Apps):** `https://icy-pebble-0a56fdd00.6.azurestaticapps.net`
  * **Servidor Azure SQL:** `autostock-sql-srv-2026.database.windows.net` (Grupo: `rg-autostock`, Región: `centralus`)
  * **Base de Datos Azure SQL:** `AutoStockDb` (General Purpose Serverless Gen5 1 vCore, 32 GB, Plan Gratuito con AutoPause sin cargos)
  * **Cadena de Conexión en App Service:** Inyectada en Connection Strings del App Service como `DefaultConnection` (tipo `SQLAzure`)
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
| **HU-11** | Configurar permisos por rol (5 pts) | José de Jesús López Islas | Alta | Sprint 3 | **Completada** | Matriz de permisos, protección inmutable Admin y obligatorio catálogo. |
| **HU-12** | Restringir funciones según mi rol (5 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 3 | **Completada** | Restricción dinámica de funciones por rol en frontend y backend (HTTP 403 Forbidden), Route Guard y sincronización con HU-11. |
| **HU-13** | Asignar o reubicar cajón en el lote (3 pts) | José de Jesús López Islas | Alta | Sprint 3 | **Completada** | Reubicación con modal interactivo, validación de colisión de cajones, trazabilidad inmutable y actualización en tiempo real. |
| **HU-14** | Editar kilometraje y notas de inspección (3 pts) | Delia Leslie Jimenez Neri | Alta | Sprint 3 | **Completada** | Edición de kilometraje y notas sobre unidades existentes. |
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

---

## 8. Paquete de Mejoras Integrales de Formularios y UI (Fase 1 Sprint 2)

Durante esta fase de optimización y robustecimiento, se implementaron mejoras de accesibilidad, validaciones en cascada y adaptabilidad móvil/desktop bajo **MODO CERO DESTRUCCIÓN** (sin afectar esquemas existentes, claves primarias, contratos ni datos en Azure SQL):

1. **Adaptabilidad de Formularios (Responsive & Adaptive UI):**
   * **Alta de Vehículos (RegistroVehiculoPage.tsx):**
     * En móvil: diseño por pasos (*stepper*) de 3 etapas (Datos Principales, Tren Motriz, Ubicación y Precio) con botones Anterior/Siguiente y barra de progreso animada para evitar scroll vertical excesivo.
     * En desktop: layout multicolumna estructurado en tarjetas claras.
     * Compartición del 100% de la lógica y validaciones mediante el custom hook useRegistroVehiculoForm.ts y detección reactiva de pantalla en useMediaQuery.ts.
     * Configuración de atributos de accesibilidad móvil nativa (inputMode, utoComplete, utoCapitalize).

2. **Selects Dependientes en Cascada (Marca -> Modelo):**
   * Catálogo tipado oficial de 17 marcas y sus modelos correspondientes en Frontend (src/config/marcasModelos.ts) y Backend (AutoStock.Domain/Constants/CatalogoMarcasModelos.cs).
   * Cascada reactiva en formulario: al seleccionar una Marca, el selector de Modelo filtra las opciones válidas. Si la Marca cambia, el campo Modelo se reinicia automáticamente a vacío ("") para impedir combinaciones inconsistentes.
   * Selector de Modelo deshabilitado con placeholder dinámico mientras no exista una Marca elegida.
   * Validación en Backend (VehiculosService.cs): rechaza combinaciones inconsistentes devolviendo HTTP 400 con mensaje { "mensaje": "El modelo no corresponde a la marca seleccionada" }.

3. **Sincronización de Límites de Caracteres y Sanitización:**
   * Sincronización exacta de longitudes entre configuraciones de EF Core (HasMaxLength), validaciones en Application (VehiculosService.cs, UsuariosService.cs) y atributos Frontend (maxLength, contadores en tiempo real):
     * VIN: 17 caracteres alfanuméricos estrictos (sin I, O, Q).
     * Marca: máx. 50.
     * Modelo: máx. 50.
     * Version: máx. 100.
     * Placa: máx. 20 (opcional en nuevos, obligatoria en seminuevos).
     * ZonaLote: máx. 20.
     * CajonLote: máx. 20.
     * Transmision: máx. 50.
     * Motor: máx. 100.
     * Potencia: máx. 50.
     * ColorExterior: máx. 50.
     * ColorInterior: máx. 50.
     * Equipamiento: máx. 500.
     * NotasInspeccion: máx. 1000.
     * Precio: mayor a cero y máx. $99,999,999.99.
     * Kilometraje: mayor o igual a cero y máx. 1,000,000 km.
     * NombreCompleto (Usuario): 3 a 150 caracteres.
     * Correo (Usuario): máx. 100 caracteres con validación de formato.
     * EmpleadoId (Usuario): máx. 20 caracteres.
   * Pruebas unitarias añadidas en VehiculosServiceTests.cs (escenarios de campos desbordados y combinaciones marca-modelo inválidas).

4. **Registro de Usuarios — Fecha de Nacimiento y Generación Automática de ID:**
   * **Cero Ruptura de Base de Datos:** Se preservó intacta la clave primaria numérica Id (Identity) en SQL Server sin tocar ninguna de las relaciones foráneas (Sesiones, Vehiculos, HistorialEstadosVehiculo).
   * **Entidad Usuario:** Se incorporó FechaNacimiento (DateOnly) con valor por defecto seguro 2000-01-01 en UsuarioConfiguration.cs para mantener la compatibilidad absoluta con datos preexistentes en Azure SQL.
   * **Migración Aditiva EF Core:** 20261029000320_UpdateUsuarios_AddFechaNacimiento (Up agrega columna date no nula con valor por defecto).
   * **Algoritmo Determinista de Identificador (GeneradorIdentificadorUsuario.cs / generadorIdentificador.ts):**
     * Normalización de nombres (remueve acentos, diacríticos y palabras conectoras como DE, DEL, LOS, Y).
     * Formato: [INICIALES]-[AAMMDD]-[01] (ej. ML-950420-01), con longitud de 12 a 14 caracteres (dentro del límite de 20 de EmpleadoId).
     * Resolución de colisiones incremental automática (-01, -02, etc.) verificando en base de datos.
   * **Previsualización Reactiva en Frontend:** NuevoUsuarioPage.tsx muestra un badge en tiempo real con el código calculado conforme el usuario teclea su nombre y selecciona su fecha de nacimiento, con opción de ingreso manual si se requiere.
   * **Validación de Mayoría de Edad:** Tanto en Frontend como en Backend se valida estrictamente que el usuario tenga al menos 18 años cumplidos al momento del registro.
   * **Compatibilidad de Sesión Offline:** Campo opcional echaNacimiento?: string en UsuarioSesion (sessionDb.ts / sesion.ts) para no invalidar sesiones almacenadas en IndexedDB.
   * **Pruebas Unitarias:** 5 nuevas pruebas unitarias en UsuariosServiceTests.cs cubriendo generación automática, resolución de colisiones, cálculo de edad y rechazo de menores de edad (60/60 pruebas pasando exitosamente).

5. **Auditoría y Optimización UI/UX en Todas las Pantallas:**
   * Sustitución de contenedores forzados a ancho móvil (max-w-md) por contenedores adaptativos fluidos (max-w-5xl / max-w-6xl):
     * CatalogoPage.tsx: Grilla responsiva de tarjetas de vehículos (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3).
     * DashboardPage.tsx: Vista de dos columnas en desktop (módulos y accesos a la izquierda, métricas y estado a la derecha).
     * UsuariosPage.tsx: Catálogo de tarjetas de personal con badge de ID, rol, estado y buscador dinámico.
     * VehiculoDetallePage.tsx: Ficha técnica extendida para desktop y móvil sin cortes de texto.
     * EvidenciaVehiculoPage.tsx: Grilla 2x2 para las 4 tomas fotográficas obligatorias en pantallas medianas y grandes.


## 9. Historia de Usuario HU-12: Restringir funciones según mi rol (Sprint 3)
* **Responsable:** Delia Leslie Jimenez Neri (`Leslie-Neri` / `23300765@uttt.edu.mx`).
* **Puntos de Historia:** 5 SP.
* **Estado:** **Completada**.
* **Criterios de Aceptación Cumplidos:**
  1. **Menú Principal / Dashboard adaptativo:** Solo se muestran las opciones permitidas según el rol y permisos activos del usuario. Por ejemplo, un Asesor de Ventas no visualiza "Registrar Unidad" ni los módulos de administración de usuarios/permisos. El Administrador conserva acceso irrestricto a todas las funciones.
  2. **Ficha Técnica protegida:** Los botones de acciones no autorizadas (`cambiar_estado`, `capturar_fotografias`, `editar_kilometraje_notas`) se ocultan automáticamente si el usuario no cuenta con la facultad correspondiente.
  3. **Protección contra acceso directo por URL (`PermisoRoute` & `AdminRoute`):** Si un usuario intenta acceder por URL directa a una sección no autorizada (ej. `/registrar-vehiculo`, `/vehiculo/:id/evidencia`, `/usuarios`, `/permisos`), el sistema lo redirige de inmediato a `/dashboard` y muestra un banner de advertencia claro: *"No tienes permiso para acceder a esta sección"*.
  4. **Blindaje en Servidor (Backend HTTP 403 Forbidden):** Excepción de aplicación `ForbiddenAppException` capturada por `ExceptionHandlingMiddleware` devolviendo código HTTP 403 y payload estándar `{ "mensaje": "No tienes permiso para realizar esta acción" }`. Validación dinámica en servicios (`IPermisosService.ValidarPermisoAsync`) al registrar vehículos, capturar fotos o cambiar estados.
  5. **Sincronización Dinámica de Permisos:** La sesión de usuario incluye su lista de permisos activos calculados al iniciar sesión o refrescar perfil (`/auth/perfil`), permitiendo que cualquier cambio realizado desde la matriz de permisos (HU-11) surta efecto inmediato en el navegador sin requerir migraciones destructivas ni invalidar la persistencia offline en IndexedDB.
  6. **Identidad Visible en Encabezado:** Encabezado con avatar, nombre completo del usuario autenticado y badge con su rol asignado.
  7. **Calidad y Cobertura:** 68/68 pruebas unitarias en verde en Backend (`xUnit` + `Moq`), 0 errores y 0 advertencias con Roslynator en modo Release. En Frontend: 100% libre de errores en `eslint`, `typecheck` y compilación de producción Vite PWA exitosa.


## 10. Historia de Usuario HU-13: Asignar o reubicar cajón en el lote (Sprint 3)
* **Responsable:** José de Jesús López Islas (`ChuchoGodDeveloper` / `loij030909hmcpssa0@gmail.com`).
* **Puntos de Historia:** 3 SP.
* **Estado:** **Completada**.
* **Criterios de Aceptación Cumplidos:**
  1. **Selector de Reubicación (CA 1):** En la tarjeta de ubicación de la ficha técnica (`VehiculoDetallePage.tsx`), el botón "Reubicar" abre `ModalReubicacion.tsx` mostrando la ubicación actual, selector de zona (`Zona A`, `Zona B`, `Zona C`, `Taller`, `Lavado`) y campo de cajón (clave corta de hasta 6 caracteres en mayúsculas).
  2. **Actualización Inmediata (CA 2):** Al confirmar una zona y cajón libre, la ubicación se actualiza al instante en la ficha técnica y en el catálogo en Zustand (`catalogoStore.ts`) sin recargar la página.
  3. **Trazabilidad Inmutable (CA 3):** Cada movimiento registra la ubicación anterior, la nueva, el colaborador que reubicó, fecha y hora en la entidad `HistorialUbicacionVehiculo` y se muestra en la ficha: *"Reubicado por {nombre} el {fecha}"*.
  4. **Blindaje de Cajón Ocupado (CA 4):** Si el cajón elegido ya está ocupado por otra unidad activa (no vendida), el servidor responde HTTP 400 y el modal despliega una alerta con la marca, modelo y placa del vehículo ocupante (`El cajón ya está ocupado por {Marca} {Modelo} (Placa: {Placa})`), impidiendo la reubicación.
  5. **Prevención de Misma Ubicación (CA 5):** Si el usuario selecciona la misma zona y cajón que la unidad ya tiene asignada, el botón "Confirmar" permanece deshabilitado.
  6. **Validación de Campos Vacíos (CA 6):** Validación en Frontend y Backend que impide guardar campos vacíos o cadenas de cajón mayores a 6 caracteres.
  7. **Integración con Alta y Cambio de Estado (CA 7):** En el modal de cambio de estado (HU-10) y en el formulario de alta (HU-08), se estandariza el catálogo de zonas y la longitud máxima de 6 caracteres para cajón, validando disponibilidad.
  8. **Control de Acceso por Permiso (CA 8):** El botón "Reubicar" solo se muestra a usuarios que cuenten con el permiso `asignar_cajon` (Encargado de Lote y Administrador por defecto).
  9. **Calidad y Cobertura:** 76/76 pruebas unitarias en verde en Backend (`xUnit` + `Moq`), 0 errores y 0 advertencias con Roslynator en modo Release. En Frontend: 100% libre de errores en `eslint`, `typecheck` y compilación de producción Vite PWA exitosa.

## 11. Historia de Usuario HU-14: Editar kilometraje y notas de inspección (Sprint 3)
* **Responsable:** Delia Leslie Jimenez Neri (`Leslie-Neri` / `23300765@uttt.edu.mx`).
* **Puntos de Historia:** 3 SP.
* **Estado:** **Completada**.
* **Criterios de Aceptación Cumplidos:**
  1. **Resumen y campos actuales (CA 1):** En la ficha técnica (`VehiculoDetallePage.tsx`), el botón "Editar Kilometraje / Datos" abre el modal `ModalEdicionKilometraje.tsx` desplegando la miniatura del vehículo, marca, modelo, versión, VIN, número de stock y el kilometraje registrado actualmente como referencia.
  2. **Guardado normal y trazabilidad (CA 2):** Al ingresar un kilometraje mayor o igual al actual, los cambios se persisten inmediatamente en base de datos (`HistorialKilometrajeVehiculo`), actualizando el detalle y el catálogo en Zustand (`catalogoStore.ts`) sin recarga de página, exhibiendo la insignia de verificación: *"Verificado por {nombre} el {fecha}"*.
  3. **Bloqueo de reducción para Encargado (CA 3):** Si un Encargado de Inventario u otro rol no administrativo intenta ingresar un kilometraje menor al registrado, el sistema bloquea la acción con el mensaje exacto: *"El kilometraje no puede ser menor al registrado ({actual} km)"*.
  4. **Corrección a la baja autorizada con motivo (CA 4):** Si un Gerente de Ventas o Administrador registra un kilometraje menor al actual, el modal solicita obligatoriamente el motivo de la corrección (`motivoCorreccion` con al menos 5 caracteres). Al guardar, se almacena en el historial de auditoría inmutable.
  5. **Validación de formato de KM (CA 5):** El campo de odómetro restringe la entrada a dígitos enteros en el rango de 0 a 999,999 km, rechazando números negativos, caracteres alfabéticos o decimales (`inputMode="numeric"`).
  6. **Límite y contador de notas (CA 6):** El campo de notas de inspección tiene un tope estricto de 500 caracteres, con contador interactivo en tiempo real (`X/500`) y alerta visual al aproximarse al límite.
  7. **Confirmación de descarte de cambios (CA 7):** Si el formulario ha sido modificado y el usuario hace clic en "Cancelar" o el botón de cierre, se despliega un diálogo de confirmación: *"¿Descartar cambios? Tienes modificaciones sin guardar..."*, evitando pérdidas accidentales.
  8. **Control de acceso por permisos y regla de negocio (CA 8):** El botón "Editar Kilometraje / Datos" solo se muestra si el usuario tiene el permiso activo `editar_kilometraje_notas`. Además, las unidades en estado `Vendido` no permiten edición (botón deshabilitado con tooltip explicativo y validación HTTP 400 en Backend).
  9. **Calidad y Cobertura:** 84/84 pruebas unitarias en verde en Backend (`xUnit` + `Moq`), 0 errores y 0 advertencias con Roslynator en modo Release. En Frontend: 100% libre de errores en `eslint`, `typecheck` y compilación de producción Vite PWA exitosa.
