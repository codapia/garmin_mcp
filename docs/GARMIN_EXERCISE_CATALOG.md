# Catálogo de ejercicios de Garmin Connect (Codapia)

Este módulo añade tres herramientas MCP de **solo lectura** para construir
entrenamientos de fuerza usando **categorías e identificadores válidos**.
No crea ni programa entrenamientos por sí solo.

## Fuentes originales

El módulo descarga en el primer uso los siguientes recursos públicos de Garmin:

1. [Exercises.json](https://connect.garmin.com/web-data/exercises/Exercises.json): categorías, códigos y músculos.
2. [exerciseToEquipments.json](https://connect.garmin.com/web-data/exercises/exerciseToEquipments.json): claves de equipamiento.
3. [exercise_types.properties](https://connect.garmin.com/web-translations/exercise_types/exercise_types.properties): nombres en inglés.

Estos recursos web no constituyen una API pública contractual: Garmin puede
cambiar los formatos, bloquear peticiones o modificarlos sin aviso. Se usan
solo URLs HTTPS fijas, sin autenticación Garmin ni envío de credenciales.
La caché reside en memoria 24 horas; se reutiliza la última copia válida
si falla una actualización. **No se copia el catálogo completo a GitHub.**

Los nombres en español se incluyen solo cuando existe una traducción curada
en `SPANISH_ALIASES`; para el resto el nombre inglés se muestra como
`name_en` y `name_es` es null. Se admiten equivalencias simples al buscar en
español. **Los códigos oficiales nunca se traducen.**

## Herramientas añadidas

- `search_exercises(query, equipment, muscle, category, limit)`: catálogo
  filtrable; devuelve `category`, `exercise_name`, `name_en`, `name_es`,
  `primary_muscles`, `secondary_muscles`, `equipment`.
- `get_exercise_details(category, exercise_name)`: verificación exacta y
  sugerencias para códigos no encontrados.
- `validate_strength_exercises(exercises)`: validación local de los códigos,
  series, repeticiones y descansos antes de subir una rutina.

El perfil `GARMIN_TOOL_PROFILE=workouts` también publica estas tres herramientas.
En el perfil `all` se publican de forma predeterminada.

## Flujo correcto desde ChatGPT

1. Buscar «sentadilla con banda» mediante `search_exercises(query="sentadilla", equipment="BAND")`.
2. Seleccionar el par exacto de claves devuelto, por ejemplo:
   `{"category": "BANDED_EXERCISES", "name": "SQUAT", "sets": 3, "reps": 10, "rest_seconds": 60}`.
3. Validar la lista mediante `validate_strength_exercises`.
4. **Solo con autorización del usuario**, crear la rutina real con
   `create_strength_workout` usando las claves confirmadas.
5. Revisar el entrenamiento creado y, tras autorización adicional si
   corresponde, programarlo mediante `schedule_workout`.

El constructor `create_strength_workout` sigue aceptando nombres libres por
compatibilidad con rutinas antiguas; **no aplica una validación obligatoria**
en el servidor. Por ello el paso 3 se debe realizar explícitamente.

## Operación y despliegue

No requiere nuevas claves, puertos, bases de datos ni volúmenes de Coolify.
El contenedor deberá tener salida HTTPS hacia `connect.garmin.com`; si está
bloqueada, las herramientas devuelven un error explicativo.

Después de fusionar el PR y desplegar Coolify:

1. Verificar CI y estado `healthy` de `garmin_mcp`.
2. Abrir Cloudflare Zero Trust → Servidores MCP → Garmin Connect → **Sincronizar**.
3. Confirmar las tres herramientas nuevas en el portal `mcp-garmin.codapia.cl`.
4. Actualizar/reconectar el complemento Garmin en ChatGPT si usa un catálogo
   antiguo y probar solamente la búsqueda y la validación sin escrituras.

Si falla la integración, hacer rollback en Coolify al commit anterior,
sin modificar tokens ni el portal Cloudflare.
