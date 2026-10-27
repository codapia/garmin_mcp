# Garmin MCP en Codapia — despliegue seguro (VPS 1 + Coolify + Cloudflare + ChatGPT)

Este runbook implementa un **origen MCP con Bearer** y un **MCP Portal de Cloudflare con Managed OAuth**, replicando el patrón usado con Coolify Cloud. No requiere cambiar el código Python ni implementar un validador JWT en Garmin. Creación y programación de entrenamientos disponibles desde el primer inicio; eliminación deshabilitada.

## Arquitectura y límites de confianza

```text
ChatGPT / conector MCP personalizado
    -> https://mcp-garmin.codapia.cl/mcp  [Cloudflare MCP Portal, Managed OAuth]
    -> Cloudflare (credencial Bearer almacenada para upstream)
    -> https://garmin-origin.codapia.cl/mcp  [Cloudflare Tunnel; origen solo con Bearer]
    -> cloudflared EN EL HOST VPS 1 -> http://127.0.0.1:18080
    -> contenedor garmin-mcp:8000 -> Garmin Connect
```

`garmin-origin.codapia.cl` y `mcp-garmin.codapia.cl` son **nombres propuestos**, no DNS creados. **El origen se publica a través de Tunnel pero exige Bearer**; no es un MCP anónimo. La URL de origen no debe publicarse en el conector ChatGPT. Para una ruta de origen estrictamente privada, usar la variante con Gateway descrita al final.

Requisitos: acceso SSH administrativo al VPS 1, Coolify con despliegue por Docker Compose, dominio administrado por Cloudflare, Tunnel con `cloudflared` corriendo en el **host** o un acceso equivalente al puerto local, Cloudflare Zero Trust MCP Portals. No utilizar el VPS 2 reservado a runners CI.

## 1. Preparar almacenamiento en VPS 1

Ejecutar por SSH en VPS 1:

```sh
sudo install -d -m 0700 -o 10001 -g 10001 /srv/garmin-mcp/data
sudo stat -c '%u:%g %a %n' /srv/garmin-mcp/data
```

Esperado: `10001:10001 700 /srv/garmin-mcp/data`. No guardar archivos OAuth ni contraseñas en GitHub, Craft, capturas ni carpetas compartidas. No montar volúmenes de otras aplicaciones.

## 2. Crear la aplicación en Coolify

**Compatibilidad con Coolify v4.4.7:** la carga del Compose rechaza orígenes de volúmenes con interpolación `${GARMIN_DATA_DIR:?…}` como `Invalid Docker volume definition: Invalid volume source: contains forbidden character`. Por eso `/srv/garmin-mcp/data:/data:rw` es una ruta absoluta literal y ya se creó con propietario `10001:10001`, permisos `0700`. No añadir `GARMIN_DATA_DIR` ni `GARMIN_LOCAL_PORT` como variables: no se usan.

1. En VPS 1, crear un recurso nuevo **Docker Compose** desde `https://github.com/codapia/garmin_mcp`.
2. Seleccionar rama `main` y especificar **`/docker-compose.codapia.yml`** como Compose file (o su ruta equivalente en la versión de Coolify).
3. En **Environment Variables** introducir **solo** `GARMIN_MCP_HTTP_TOKEN`, con 32 bytes aleatorios, por ejemplo el resultado de `openssl rand -hex 32`. **No copiar el valor a documentación ni al repositorio**. La ruta `/srv/garmin-mcp/data` y el puerto local `18080` están definidos literalmente en el archivo Compose, para evitar el error de validación de Coolify con variables `${...}` en los orígenes de volúmenes. Si el puerto está ocupado, modificarlo en GitHub y volver a cargar el Compose.
4. Configurar la aplicación sin dominio público asignado en Coolify, sin publicación directa de puertos externos y **sin** variables `GARMIN_EMAIL` ni `GARMIN_PASSWORD` persistentes.
5. Ejecutar **Deploy**. El Compose monta `/data`, ejecuta UID `10001`, elimina capacidades y deja el filesystem base de solo lectura. El host solo escucha `127.0.0.1:18080`.

El contenedor puede quedar activo con `/healthz` correcto pero `/readyz` devolver **503** hasta autenticar Garmin; esto es normal al inicio. El healthcheck de Docker es de *liveness*, no de sesión Garmin.

El Dockerfile original instala dependencias sin fijar toda la resolución a `uv.lock` y copia uv desde una etiqueta mutable. Antes de un entorno de mayor exposición, revisar y fijar versiones y escanear la imagen. Esta configuración no pretende sustituir una auditoría de dependencias.

## 3. Autenticar Garmin Connect una única vez

Con el contenedor ya desplegado, desde una sesión SSH interactiva del VPS 1:

```sh
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep garmin
docker exec -it <NOMBRE_CONTENEDOR> garmin-mcp-auth
docker exec -it <NOMBRE_CONTENEDOR> garmin-mcp-auth --verify
```

`garmin-mcp-auth` solicitará correo, contraseña y MFA si Garmin lo requiere. Se guardan los tokens en el volumen `/data/.garminconnect`, accesible solo al UID del proceso; además el programa exporta un archivo Base64 de compatibilidad, que **no está cifrado** y también queda dentro del volumen privado.

Después de autenticar, **Restart** en Coolify para forzar que el MCP cargue los tokens recién creados. Comprobar en VPS 1:

```sh
curl -i http://127.0.0.1:18080/healthz
curl -i http://127.0.0.1:18080/readyz
curl -i http://127.0.0.1:18080/mcp
ss -ltn | grep 18080
```

Resultado esperado: `healthz=200`, `readyz=200 {"status":"ready"}`, MCP **401 sin Bearer** y escucha **solo 127.0.0.1**. El `GET /mcp` sin token se usa para comprobar rechazo, no como prueba MCP completa.

Si `docker exec -it` no permite entrada interactiva a través de la UI de Coolify, utilizar SSH/Termius por WARP. No poner contraseñas Garmin en comandos de terminal ni en Compose.

## 4. Conectar el origen a Cloudflare Tunnel

En Cloudflare Zero Trust, localizar el túnel que tiene el conector `cloudflared` **corriendo en el VPS 1, en el host**. Agregar una ruta de hostname público:

- Hostname: `garmin-origin.codapia.cl` (sugerido).
- Tipo: HTTP; servicio de destino: `http://127.0.0.1:18080`.
- DNS administrado por Cloudflare; HTTPS para clientes.
- No eliminar ni cambiar las rutas actuales de SSH/Coolify/n8n.

Este camino funciona **solo si** `cloudflared` está en el host: dentro de otro contenedor, `127.0.0.1` apunta a ese contenedor, no al host. Si el túnel actual está dockerizado, crear una red Docker restringida y compartirla con `cloudflared`, en vez de publicar `18080` en `0.0.0.0`. No abrir reglas entrantes nuevas en Contabo/UFW.

Verificar desde otra red que `https://garmin-origin.codapia.cl/mcp` responde **401 sin el Bearer**. Un 502 indicaría problema de ruta del túnel, no de OAuth.

**Protección:** el endpoint de origen tiene una URL resoluble públicamente, pero solo acepta la credencial Bearer. No confundir esto con origen completamente privado. Eliminar otras rutas directas al puerto Docker. Mantener secreto aleatorio y rotarlo si se filtra.

## 5. Crear MCP Server y Portal en Cloudflare

Cloudflare Zero Trust -> **Access controls -> MCP Portals** (algunas interfaces lo muestran dentro de **AI controls**):

1. **MCP servers -> Add MCP server** con URL completa `https://garmin-origin.codapia.cl/mcp`.
2. Tipo de autenticación **Bearer** (token estático); guardar en Cloudflare el mismo valor que `GARMIN_MCP_HTTP_TOKEN` de Coolify. Según la UI/API, puede aparecer en **Authentication**. No seleccionar OAuth de upstream: Garmin MCP no implementa ese flujo.
3. Validar conexión y listado de herramientas del servidor. Si existe configuración de herramientas en el portal, conservar únicamente las operaciones permitidas desde Docker.
4. Crear **portal independiente** con URL sugerida `https://mcp-garmin.codapia.cl/mcp`, no modificar el portal existente `mcp.codapia.cl` de Coolify.
5. Habilitar **Managed OAuth** en el portal (en portales nuevos puede venir habilitado por defecto). Establecer política **Allow** exclusivamente para tu identidad y negar el resto.
6. Para upstream Bearer, configurar **Require user auth = Off** si está disponible: el portal utiliza la credencial estática guardada, mientras el usuario sigue iniciando sesión con Cloudflare OAuth para entrar al portal.

Un portal con OAuth **no** implica que Garmin reciba JWT de Access. El portal autentica al usuario y habla con Garmin mediante la credencial Bearer. Esta separación está soportada por Cloudflare y evita cambiar `http_auth.py`.

Referencias:
- https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/

## 6. Vincular a ChatGPT

En ChatGPT -> **Settings -> Plugins / Apps and connectors** (el nombre depende de la versión y del plan), elegir **añadir conexión MCP personalizada** y pegar **solo**:

```text
https://mcp-garmin.codapia.cl/mcp
```

Autenticar mediante Cloudflare Access/OAuth. No introducir credenciales de Garmin en ChatGPT. Si el cliente pide una URL de autorización manual, revisar la configuración de Managed OAuth/DCR del portal antes de copiar URLs aleatorias.

Comprobar herramientas con una consulta de lectura y después crear un entrenamiento sencillo sin borrados. El repo permite `create_strength_workout`, `create_run_workout`, `create_run_interval_workout`, `upload_workout`, `schedule_workout`, etc. **No existe un tool `reschedule_workout` en esta versión**: para mover fechas se necesita una secuencia de desprogramar + programar, que permanece deshabilitada hasta que decidas permitirla.

El perfil `minimal` aporta métricas de salud y actividades; `GARMIN_ENABLED_TOOLS` **agrega** las operaciones de rutinas. La lista de borrados permanece excluida mediante `GARMIN_DISABLED_TOOLS`.

## 7. Variante opcional de origen totalmente privado

Desde septiembre de 2026, Cloudflare MCP Portals soporta **Private MCP servers**: conectar una ruta privada de Tunnel (private hostname o CIDR) a Gateway y habilitar **Route traffic through Cloudflare Gateway** en el registro del MCP server. Con ello **no se necesita `garmin-origin.codapia.cl` como hostname público**. Para esta variante el servidor HTTP debe poder alcanzarse desde la ruta privada efectiva del túnel: `127.0.0.1` no es accesible por una ruta IP privada remota, por lo que habría que conectar el túnel a la red Docker, a un proxy local privado o a una IP privada controlada. Conservar Bearer igualmente.

Referencia: https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/#connect-a-private-mcp-server

## Validaciones y rollback

- Probar HTTP sin Bearer -> 401; con la credencial -> sesión MCP válida (inicialización y `tools/list`), primero local y luego por Cloudflare.
- Revisar herramientas anunciadas: permitir lectura + creación/programación; no anunciar borrado.
- Verificar un entrenamiento creado en Garmin Connect, comprobando datos y fecha **antes** de programarlo.
- Registrar fallos de Docker/Coolify; añadir alertas para reinicios, ausencia de salud y expiración de credenciales sin enviar métricas de salud a logs.
- Copiar de forma cifrada el volumen `/srv/garmin-mcp/data`; no incluirlo en repositorios ni en respaldos sin cifrar.
- Si falla, quitar el servidor del MCP Portal o revocar su Bearer y detener el recurso de Coolify. Esto no modifica ni elimina los datos de Garmin Connect.

**Estado:** este repositorio aporta configuración y guía. No aprovisiona recursos en Coolify/Cloudflare/ChatGPT, no guarda tokens reales y requiere validación de despliegue y autenticación antes de uso real.
