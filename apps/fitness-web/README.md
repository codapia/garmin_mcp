# Fitness Codapia — persistencia, Garmin y envío de rutinas

## Arquitectura
- **Repositorio:** `codapia/garmin_mcp`; Garmin MCP original continúa en su propia app Coolify.
- **Servicio separado:** `docker-compose.fitness.yml` levanta Next.js y PostgreSQL 17 en una red Docker privada; puerto Next publicado solo en `127.0.0.1:18081`. PostgreSQL no publica puerto.
- **Seguridad:** Cloudflare Access (obligatorio), validación de JWT firmado en el backend (AUD e issuer), token separado para operaciones internas y Cloudflare Access service token desde el MCP.
- **Garmin:** backend consulta el origen `https://garmin.codapia.cl/mcp` con Bearer mediante Streamable HTTP JSON-RPC. No se envían tokens a la PWA. El MCP es la fuente de actividades y sueño; BD guarda instantáneas fechadas, sin alterar Garmin.
- **Alimentación:** ChatGPT llama herramientas `fitness_registrar_comida`, `fitness_consultar_comidas`, `fitness_consultar_historial` del MCP Garmin ampliado. El puente llama la API interna en Fitness protegida por dos controles. Confirma qué comiste antes de guardar y separa cantidades/estimaciones.
- **Rutinas web:** `fitness_guardar_rutina` crea/edita un plan en BD con control de versión. **No edita ni borra un entrenamiento Garmin.** Cualquier reemplazo Garmin exige confirmación aparte.

## Variables de la app Fitness en Coolify
```env
FITNESS_DB_PASSWORD=<secreto largo; NUEVO, no reutilizar>
FITNESS_CF_ACCESS_TEAM_DOMAIN=<tu-equipo>.cloudflareaccess.com
FITNESS_CF_ACCESS_AUD=<AUD de la app Cloudflare Access fitness.codapia.cl>
FITNESS_INTERNAL_TOKEN=<secreto aleatorio separado, nuevo>
FITNESS_GARMIN_MCP_HTTP_TOKEN=<Bearer protegido del Garmin MCP upstream>
FITNESS_GARMIN_MCP_URL=https://garmin.codapia.cl/mcp
```
Guardar todas en Coolify. El Compose no contiene valores. La configuración requiere reinicio solo de la nueva app Fitness.

## Variables adicionales en Coolify del Garmin MCP existente
```env
FITNESS_API_URL=https://fitness.codapia.cl/api/fitness/internal
FITNESS_INTERNAL_TOKEN=<mismo token interno de Fitness>
FITNESS_CF_SERVICE_CLIENT_ID=<Service token Cloudflare Access autorizado solo a fitness.codapia.cl>
FITNESS_CF_SERVICE_CLIENT_SECRET=<secreto service token Cloudflare>
```
Cambiar estas variables obliga a **redesplegar Garmin MCP**, lo cual se debe coordinar después de validar la PWA; no hacerlo automáticamente durante el PR. El servicio y herramientas Garmin originales permanecen iguales salvo el registro de las seis funciones nuevas.

## Orden de despliegue seguro
1. Validar PR y checks en VPS2; nunca permitir PR de forks en self-hosted.
2. Revisión/merge del PR: **el merge a main puede activar un despliegue de Garmin MCP por webhook**; verificar servicio en Coolify y conexión ChatGPT después.
3. Crear Cloudflare Access Self-hosted para `fitness.codapia.cl` con allowlist del usuario y política Service Auth para un service token dedicado. Capturar Application AUD y team domain. Configurar emisión de JWT para usuario y service token; comprobar origen de las solicitudes.
4. Configurar variables Fitness en Coolify, crear nueva aplicación Garmin/production con el Compose independiente; mantener `garmin_mcp` intacto. Primero probar salud de la nueva app en loopback y acceso denegado sin JWT.
5. Crear el hostname `fitness.codapia.cl` en el Tunnel existente hacia `http://127.0.0.1:18081`; comprobar denegación sin Access, inicio de sesión personal, API y JWT.
6. Crear service token Access y asignar únicamente a Fitness. Probar HTTP autorizado desde el MCP antes de establecer las 4 variables de conexión; desplegar Garmin en una ventana controlada.
7. En la PWA, usar `Actualizar Garmin`. Para histórico de varios días, consultar cada fecha de forma acotada; evitar ráfagas de peticiones y limitación 429. Registrar comidas por ChatGPT y verificar en PWA.
8. Configurar backups cifrados fuera del VPS del volumen `fitness_data`, probar restauración, retención y alertas. El volumen por sí solo NO es un respaldo.

## Sobre las visualizaciones y análisis
La PWA en producción NO muestra cifras ficticias cuando la API está inactiva. Al iniciar, consulta el histórico persistido y deja vacío lo no disponible. La rutina web usa pasos guardados por ChatGPT y exige cargar guías y demostraciones validadas; los antiguos SVG esquemáticos solo están disponibles en modo desarrollo de la maqueta, no deben atribuirse a ejercicios exactos.

Los gráficos y cruces de sueño, VFC, estrés, alimentación, carga y progreso son exploratorios: información faltante, ausencia de pesajes y baja densidad de registros impiden concluir causalidad o cambios de grasa muscular.

## Limitaciones conocidas de esta fase
- El origen Garmin es un servicio HTTP protegido, requiere enlace TLS y token correcto; puede fallar/rate limitar y sus esquemas pueden evolucionar.
- El primer paso de conexión no implica sincronización histórica automática; refrescar día por día y, luego, crear un worker programado.
- La instalación inicial de PostgreSQL ejecuta `001-schema.sql` una sola vez; cambios futuros requieren migraciones versionadas y verificación.
- No hay videos oficiales Garmin: el catálogo devuelve identificadores y equipamiento, no medios técnicos específicos.

## Cloudflare Tunnel: origen del botón Actualizar Garmin

El POST de navegador `POST /api/fitness/sync` compara el encabezado `Origin` contra `https://fitness.codapia.cl` (predeterminado) y no contra `req.nextUrl.origin`: detrás de Cloudflare Tunnel este último puede ser una dirección del contenedor. La comparación es **exacta** y rechaza orígenes ausentes o ajenos. Opcionalmente se puede establecer `FITNESS_PUBLIC_ORIGIN` para entornos de prueba o un cambio explícito del hostname. No hay que modificar esa variable para el despliegue de producción actual.

Prueba: `npm run test:origin` (integrada en el CI). El endpoint sigue requiriendo JWT firmado de Cloudflare Access, y la API máquina-a-máquina utiliza una ruta separada.

## Flujo de entrenamiento desde ChatGPT y desde la página

1. ChatGPT registra un plan en la **BD propia Fitness** mediante `fitness_guardar_rutina`, con fecha, título y pasos. Los pasos de fuerza enviables a Garmin incluyen `name`, `category`, `exercise_name`, `sets`, `reps`, `rest_seconds` y opcionalmente `weight_kg`. Los identificadores deben provenir de `search_exercises` / `validate_strength_exercises`. Ejemplo:

```json
{
  "date": "2026-11-01",
  "title": "Piernas moderadas",
  "steps": [
    {
      "name": "Sentadilla goblet",
      "category": "SQUAT",
      "exercise_name": "GOBLET_SQUAT",
      "sets": 3,
      "reps": 10,
      "rest_seconds": 75,
      "weight_kg": 8,
      "instructions": "Mantén el tronco estable"
    }
  ]
}
```

2. La rutina aparece en **Rutina** y se puede pulsar **Enviar a Garmin**. La app llama a `POST /api/fitness/send` con JWT Cloudflare Access validado y chequeo estricto de Origin para impedir CSRF. Desde ChatGPT, usar `fitness_enviar_rutina_garmin(plan_id,expected_version)` tras consultar la versión en `fitness_consultar_rutinas`; también pasa por la API privada.
3. El backend verifica versión, valida códigos oficiales con Garmin MCP, crea el workout solo si no hay identificador, guarda el ID Garmin en PostgreSQL y luego programa la rutina por fecha. Si falla solo la programación, el reintento reutiliza el mismo workout de Garmin. **La sincronización con el reloj sucede después** mediante Garmin Connect, no inmediatamente al guardar la rutina. Para una rutina ya enlazada, el botón solo verifica/programa nuevamente; no crea duplicados.
4. Fitness **no modifica ni borra rutinas de Garmin** ya existentes. La edición de un plan enlazado se bloquea para evitar que el contenido en Fitness diverja de lo enviado; crear una nueva versión como plan aparte y pedir consentimiento antes de sustituir planes en Garmin.
5. Los entrenamientos *realizados* y su recuperación vienen de las herramientas de lectura Garmin y se almacenan en `fitness_garmin_days` al sincronizar. No confundir «programado» con «realizado».

**Importante:** el ID se persiste en PostgreSQL antes de pedir programación, pero la escritura distribuida a Garmin no es una transacción global: si Garmin crea un workout y la respuesta de red se pierde, se debe inspeccionar Garmin antes de reintentar para evitar duplicados. No incorporar reintentos automáticos ciegos. Las funciones de envío iniciales admiten entrenamientos de fuerza con los códigos oficiales; para otros deportes se debe desarrollar su conversión específica y validarla.

### Activación del puente ChatGPT → Fitness

- En Cloudflare Access, permitir explícitamente **Service Auth** para un service token exclusivo de la aplicación `fitness.codapia.cl`, conservando la política humana existente. Crear y custodiar Client ID y Client Secret del servicio de forma segura; no colocarlos en Git ni Craft.
- Coolify → **Garmin / production / garmin_mcp**: cargar `FITNESS_API_URL=https://fitness.codapia.cl/api/fitness/internal`, `FITNESS_INTERNAL_TOKEN` (el mismo de Fitness), `FITNESS_CF_SERVICE_CLIENT_ID`, `FITNESS_CF_SERVICE_CLIENT_SECRET`. El Compose exporta estas variables opcionales al contenedor y sin valor por defecto secreto.
- Re-desplegar Garmin MCP, comprobar salud, enumerar las **siete** herramientas `fitness_*` en el upstream de Cloudflare MCP; **seleccionar las siete en el portal ChatGPT**, actualizar/sincronizar el conector y probar `fitness_consultar_rutinas` primero. A continuación probar una comida de ensayo **identificada como ensayo**, verificar la fila en PostgreSQL y eliminarla mediante procedimiento administrativo si fue una prueba. No introducir entradas falsas en el historial real.
- El servicio Fitness mantiene `FITNESS_INTERNAL_TOKEN`, `FITNESS_CF_ACCESS_AUD`, `FITNESS_CF_ACCESS_TEAM_DOMAIN`, la contraseña de Postgres y el Bearer Garmin. La autenticación de servicio Cloudflare no sustituye el Bearer interno.
- No asumir que una herramienta está disponible para ChatGPT solo porque exista en la imagen o en el manifiesto DXT; el portal es una lista seleccionada separada.

