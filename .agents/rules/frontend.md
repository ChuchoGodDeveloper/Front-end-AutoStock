---
trigger: glob
globs: "*.tsx, *.ts, *.css, *.html"
description: "Reglas de UI, React y TypeScript"
---

# Reglas de Frontend, PWA, Componentes y Sistema de Diseño UI/UX (AutoStock)

## 1. Arquitectura y Reglas Inquebrantables de Frontend y PWA
* **Stack:** React 18, TypeScript, Vite, Tailwind CSS y React Router DOM v6.
* **Estado Global:** Zustand (`src/stores/authStore.ts`, `src/stores/catalogoStore.ts`, `src/stores/themeStore.ts`).
* **PWA Nativa:** `vite-plugin-pwa` (Service Worker `autoUpdate`, estrategia `generateSW`, App Shell precacheado, manifest standalone y hook `usePWAInstall` que respeta el rechazo del banner por 7 días).
* **Persistencia Offline y Seguridad:** La sesión se maneja en **IndexedDB** (`idb` en `src/services/sessionDb.ts`, base `autostock-pwa-db`). Las contraseñas jamás se guardan en el dispositivo.
* **Prohibición de URLs Hardcoded:** Está **ESTRICTAMENTE PROHIBIDO** hardcodear URLs del API en componentes, servicios o stores. Siempre se debe usar el cliente HTTP (`src/services/httpClient.ts`) configurado con variables de entorno (`src/config/env.ts` -> `ENV.API_BASE_URL` / `VITE_API_URL`):
  * `.env.development`: `http://localhost:5000`
  * `.env.staging`: `https://autostock-backend-cyfwg9f4fbcgewfq.centralus-01.azurewebsites.net`
  * `.env.production`: `https://autostock-backend-cyfwg9f4fbcgewfq.centralus-01.azurewebsites.net`
* **Calidad de Código:** Análisis estático obligatorio con ESLint (`npm run lint`) y verificación de tipos con TypeScript (`npm run typecheck`) sin errores ni advertencias antes de cualquier commit.

---

## 2. Sistema de Diseño "Showroom Liquid Glass" (Dark UI, Glassmorphism y Efectos Visuales)

### 2.1 Materialidad Liquid Glass (3 espesores ópticos en `src/index.css`)
* **`.v-glass`:** `backdrop-filter: blur(40px) saturate(185%)`, doble bisel especular `inset 0 1.5px 0 var(--rim-hi)` y sombra multicapa `--depth`.
* **`.v-glass--chrome`:** `backdrop-filter: blur(50px) saturate(200%)` para la barra superior flotante en 3 islas y el Dock adaptativo (`AppShell.tsx`).
* **`.v-glass--thick`:** `backdrop-filter: blur(60px) saturate(210%)` para modales (`LiquidModal`), paneles laterales de filtros (`FilterPanel.tsx`) y tarjetas de autenticación.

### 2.2 Doble Ambiente Automotriz (`src/stores/themeStore.ts`)
* **Showroom Nocturno (`data-theme="dark"`):** Piso de obsidiana (`#06070B`), titanio líquido, oro champán (`#D4AF37`), azul telemetría (`#4DA6FF`) y verde encendido (`#2EE59D`).
* **Agencia de Día (`data-theme="light"`):** Cristal polarizado perlado (`#EDF1F7`) con alto contraste WCAG 2.1 AA para lectura en lote exterior bajo luz solar.
* **Escenario Automotriz de Fondo (`src/components/ShowroomWall.tsx`):** Silueta escultural SVG de un Gran Turismo Coupé a escala completa con iluminación ambiental reactiva al tema.

### 2.3 Primitivas Interactivas y Catálogo de Animaciones (60 FPS)
* **A1 — Píldora Líquida con Inversión Dual (`LiquidSegmented` / `FiltrosRapidos.tsx`):** Navegación y filtros rápidos con máscara `clip-path: inset(...)` (`--seg-left`, `--seg-right`) y física de resorte `cubic-bezier(0.22, 1, 0.36, 1)`.
* **A2 — Compresión Elástica (*Squish*) + Onda Hueca (`.ripple` en `useShowroomEffects.ts`):** Respuesta física al presionar botones y tarjetas (`scale(0.95)`) con anillo especular expansivo en las coordenadas del clic.
* **A3 — Foco Radial Magnético (`SpotlightCard` con `--gx`, `--gy`):** Iluminación especular que sigue el cursor sobre tarjetas `.v-glass`.
* **A4 — Tipografía Cinética (`SplitTitle`):** Entrada escalonada letra por letra con giro 3D (`translateY(115%) rotateX(-75deg) -> 0`).
* **A5 — Contadores Interpolados (`AnimatedCounter`):** Interpolación numérica con curva `cubic-out` para KPIs, odómetros y precios.
* **A6 — Tacómetro / Anillo SVG Dinámico:** Medidor circular con `stroke-dashoffset` animado para el porcentaje de disponibilidad de flota.
* **A7 — Barras de Distribución por Estado:** Crecimiento progresivo con brillo especular para los 5 estados operativos.
* **A8 — Entrada Abanicada de Tarjetas (`VehiculoCard.tsx`):** Cascada con rotación inicial (`±2.2deg -> 0`) y levitación en hover (`translateY(-5px) scale(1.01)`).
* **A9 — Siluetas Automotrices Vectoriales (`VehicleSilhouette`):** Renderizado automático de carrocerías (`SUV`, `Sedán`, `Pickup`, `Coupé`) cuando una unidad no tiene fotografía o mientras carga.
* **A10 — Mapeo de Tonos Metálicos a `ESTILOS_ESTADO` (`src/config/estadosOperativos.ts`):**
  * `Disponible` -> `.tone--green` (Verde Esmeralda Racing)
  * `En Prueba de Manejo` -> `.tone--blue` (Azul Cobalto Telemetría)
  * `En Taller` -> `.tone--orange` (Ámbar Champán Servicio)
  * `Apartado` -> `.tone--teal` (Turquesa Titanio)
  * `Vendido` -> `.tone--coral` / `.tone--ink` (Grafito / Coral Ejecutivo)
* **A11 — Interruptor de Faros (Toggle de Tema):** Conmutación suave de variables CSS y encendido/apagado de haces de luz del vehículo de fondo.
* **A12 — Switches Elásticos (`LiquidSwitch`):** Pulgar que se estira horizontalmente al presionar (`width: 25px`) para la matriz de permisos por rol (`PermisosPage.tsx`).
* **A13 — Modales con Portal (`LiquidModal` en `LiquidUI.tsx`):** Renderizado en `document.body` mediante `createPortal` con contenedor interno `max-h-[85vh] overflow-y-auto` y revelado `.v-glass--thick`.
* **A14 — Transición Fluida entre Vistas (`.showroom-page`):** Espaciado superior limpio bajo el Navbar flotante (`padding-top: 112px` en desktop y `104px` en móvil) y estado final de animación con `transform: none`.

---

## 3. Reglas de Componentes, Formularios y Adaptabilidad (Responsive UI)
* **Contenedores Fluidos:** Uso de contenedores adaptativos (`max-w-5xl` / `max-w-6xl`) y grillas responsivas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` en `CatalogoPage.tsx`, layout de 2 columnas en `DashboardPage.tsx`, grilla 2x2 en `EvidenciaVehiculoPage.tsx` y galería `h-72 sm:h-80 md:h-96` en `VehiculoDetallePage.tsx`).
* **Alta de Vehículos (`RegistroVehiculoPage.tsx`):** En móvil usa diseño *stepper* de 3 etapas (Datos Principales, Tren Motriz, Ubicación y Precio); en desktop usa layout multicolumna, compartiendo lógica con `useRegistroVehiculoForm.ts` y `useMediaQuery.ts`.
* **Selects Dependientes en Cascada (`Marca -> Modelo`):** Catálogo tipado de 17 marcas en `src/config/marcasModelos.ts`. Al cambiar la Marca se reinicia el Modelo a `""`.
* **Límites de Caracteres y Validaciones:**
  * `VIN`: 17 caracteres alfanuméricos estrictos (sin `I`, `O`, `Q`).
  * `Marca`, `Modelo`, `Transmision`, `Potencia`, `ColorExterior`, `ColorInterior`: máx. 50 caracteres.
  * `Version`, `Motor`, `Correo`: máx. 100 caracteres.
  * `Placa`, `ZonaLote`, `EmpleadoId`: máx. 20 caracteres; `CajonLote`: máx. 6 caracteres en mayúsculas.
  * `Equipamiento` y `NotasInspeccion` (edición en modal): máx. 500 caracteres con contador en tiempo real (`X/500`).
  * `Precio`: `> 0` y máx. `$99,999,999.99`. `Kilometraje`: entero de `0` a `999,999` km (`inputMode="numeric"`).
  * `Usuario`: `NombreCompleto` de 3 a 150 caracteres, mayoría de edad (`>= 18` años) y previsualización reactiva de `EmpleadoId` (`[INICIALES]-[AAMMDD]-[01]`) en `NuevoUsuarioPage.tsx`.
* **Protección de Rutas y Permisos (`PermisoRoute.tsx` y `AdminRoute.tsx`):** Ocultamiento dinámico de botones según permisos activos del rol (`cambiar_estado`, `capturar_fotografias`, `editar_kilometraje_notas`, `asignar_cajon`) y redirección a `/dashboard` con banner de advertencia ante accesos no autorizados por URL.
