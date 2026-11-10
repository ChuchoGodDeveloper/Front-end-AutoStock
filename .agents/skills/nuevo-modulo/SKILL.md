---
name: nuevo-modulo
description: "Crea un nuevo módulo o vista en React con TypeScript, servicio API y estilos Dark UI, Glassmorphism y Aurora UI."
---

# Instrucciones para el agente al ejecutar /nuevo-modulo
Cuando el usuario invoque esta skill indicando el nombre o función de un nuevo módulo, ejecuta estos pasos en orden sin escanear carpetas innecesarias:

1. **Tipos e Interfaces (`src/types/`):** Crea el archivo de tipos en TypeScript dentro de `src/types/` para las entidades y respuestas del módulo. Prohibido usar `any`.
2. **Servicio API (`src/services/`):** Crea o actualiza el archivo de servicio correspondiente dentro de `src/services/` (consumiendo siempre el cliente centralizado `src/services/httpClient.ts` configurado vía `src/config/env.ts`) con las funciones asíncronas (`async/await`) para consumir los endpoints del backend.
3. **Componente / Vista (`src/pages/` y `src/components/`):** Crea el componente funcional en React dentro de `src/pages/` (para vistas de ruta) o `src/components/` (para componentes/modales reutilizables) aplicando estrictamente nuestra línea visual:
   - Fondos oscuros (`#121212` / `#0f0f0f`).
   - Paneles semitransparentes con efecto cristal (`backdrop-blur` y bordes sutiles).
   - Acentos y botones principales con gradiente de morado a azul (`#a855f7` a `#3b82f6`).
4. **Verificación (`npm run typecheck` y `npm run lint`):** Revisa que los imports y tipos compilen sin errores antes de finalizar.
