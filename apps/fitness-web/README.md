# Fitness Codapia — PWA (fase 1)

Interfaz independiente para iPhone y escritorio, dentro del repositorio `codapia/garmin_mcp`.

## Estado
**Solo demostración visual.** Los indicadores, comidas, rutinas e históricos que aparecen son ficticios y están rotulados como DEMO. No hay autenticación implementada dentro de Next.js, base de datos, MCP web ni sincronización Garmin. No se envían datos a Garmin. No incluir datos reales de salud hasta proteger el dominio con Cloudflare Access y validar su JWT en el backend.

## Páginas
Inicio, Rutina (todos los ejercicios juntos, técnica y errores visibles), Alimentación (solo lectura; comidas ingresadas en ChatGPT en una fase posterior), Histórico por día y categoría, Progreso (16 cruces explicativos de 2 a 4 métricas), Catálogo Garmin (muestra identificada por códigos `category/exercise_name` de Garmin).

Los movimientos animados son **esquemas ilustrativos**, no GIF técnicos oficiales. Antes de usar cualquier movimiento como referencia deportiva definitiva, incorporar medios específicos revisados y con licencia de uso.

## Local
Requiere Node 24. En `apps/fitness-web`: `npm install`, `npm run dev`.
Verificación: `npm run typecheck && npm run build`.

## Coolify
Crear una **nueva** aplicación en el proyecto Garmin / production usando `/docker-compose.fitness.yml`. No reutilizar ni reemplazar la aplicación `garmin_mcp` ni modificar `docker-compose.codapia.yml`.
El nuevo servicio se publica exclusivamente en loopback del VPS1: `127.0.0.1:18081:3000`. Añadir el ingress `fitness.codapia.cl` → `http://127.0.0.1:18081` **solo después** de activar Cloudflare Access con política personal. Probar denegación sin sesión.
Conservar independientes las sesiones OAuth de Garmin, tokens y el volumen `/srv/garmin-mcp/data`.

## Próximas fases
1. Añadir API de backend protegida y almacenamiento PostgreSQL con migraciones y backups.
2. Sincronización de solo lectura desde Garmin MCP por enlace privado autenticado; nunca enviar credenciales Garmin al browser ni usar la URL MCP del portal ChatGPT directamente desde el cliente.
3. Ampliar MCP con `consultar_rutina_web`, `actualizar_rutina_web`, `registrar_comida` y `consultar_progreso`, validación y autorización, para que ChatGPT actualice PostgreSQL.
4. Catálogo completo de ejercicios 1.531 mediante MCP y medios específicos validados. No reutilizar un GIF genérico como si describiera variantes distintas.
5. Implementar caché PWA/offline solo cuando se diseñe retención local segura de datos de salud.
6. Agregar bloqueo de modificaciones en Garmin: nunca eliminar o reemplazar rutinas sin confirmación.

### Precaución
La integración visual es un MVP. No despliegues datos de salud reales ni abras públicamente el servicio hasta verificar Auth, backups, rate limits y controles de acceso.
