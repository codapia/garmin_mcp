"""Read-only Garmin Connect exercise catalog for strength workout planning.

Catalog records come from Garmin's publicly served web assets. This does not
call authenticated Garmin APIs or transmit the user's account credentials.
The upstream URLs are not a documented stable API, so the last good catalog is
cached for 24 hours and callers receive actionable errors on initial failure.
"""

import json
import re
import threading
import time
import unicodedata
from typing import Any, Dict, List

import requests

GARMIN_EXERCISES_URL = "https://connect.garmin.com/web-data/exercises/Exercises.json"
GARMIN_EQUIPMENT_URL = "https://connect.garmin.com/web-data/exercises/exerciseToEquipments.json"
GARMIN_NAMES_URL = (
    "https://connect.garmin.com/web-translations/"
    "exercise_types/exercise_types.properties"
)
_CACHE_SECONDS = 24 * 60 * 60
_cache_lock = threading.Lock()
_cache_records = None
_cache_until = 0.0

# Curated display/search aliases ONLY. Category/exercise IDs always come from
# Garmin's live catalog; translated labels must never be uploaded as IDs.
SPANISH_ALIASES = {
    ("BANDED_EXERCISES", "SQUAT"): "sentadilla con banda",
    ("BANDED_EXERCISES", "DEADLIFT"): "peso muerto con banda",
    ("BANDED_EXERCISES", "ROW"): "remo con banda",
    ("BANDED_EXERCISES", "LATERAL_BAND_WALKS"): "caminata lateral con banda",
    ("BANDED_EXERCISES", "PUSH_UPS"): "flexiones con banda",
    ("BANDED_EXERCISES", "PLANK"): "plancha con banda",
    ("BANDED_EXERCISES", "GLUTE_BRIDGE"): "puente de gluteos con banda",
    ("BANDED_EXERCISES", "CURL"): "curl de biceps con banda",
    ("BANDED_EXERCISES", "TRICEP_EXTENSION"): "extension de triceps con banda",
    ("BANDED_EXERCISES", "LUNGE"): "zancada con banda",
    ("BANDED_EXERCISES", "PULL_APART"): "apertura de banda",
}

# Search equivalences support common Spanish requests even when Garmin supplies
# only English labels. They are suggestions, never exercise identifiers.
QUERY_ALIASES = {
    "sentadilla": "squat",
    "sentadillas": "squat",
    "peso muerto": "deadlift",
    "flexiones": "push up",
    "flexion": "push up",
    "remo": "row",
    "plancha": "plank",
    "zancada": "lunge",
    "estocada": "lunge",
    "mancuerna": "dumbbell",
    "mancuernas": "dumbbell",
    "banda": "band",
    "bandas": "band",
    "gluteos": "glute",
    "biceps": "bicep",
    "triceps": "tricep",
    "hombros": "shoulder",
    "pecho": "chest",
    "abdominales": "ab",
}


def _normalize(text: Any) -> str:
    value = unicodedata.normalize("NFKD", str(text))
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.lower())).strip()


def _fetch(url: str, *, json_data: bool) -> Any:
    response = requests.get(url, timeout=(5, 15), allow_redirects=False)
    response.raise_for_status()
    if json_data:
        return response.json()
    return response.text


def _load_catalog() -> List[Dict[str, Any]]:
    data = _fetch(GARMIN_EXERCISES_URL, json_data=True)
    if not isinstance(data, dict) or not isinstance(data.get("categories"), dict):
        raise ValueError("Garmin Exercises.json does not contain a categories map")

    records = {}
    for category, info in data["categories"].items():
        if not isinstance(info, dict) or not isinstance(info.get("exercises"), dict):
            continue
        for exercise, muscles in info["exercises"].items():
            if not isinstance(muscles, dict):
                continue
            key = (str(category).upper(), str(exercise).upper())
            records[key] = {
                "category": key[0],
                "exercise_name": key[1],
                "name_en": key[1].replace("_", " ").title(),
                "name_es": SPANISH_ALIASES.get(key),
                "primary_muscles": muscles.get("primaryMuscles", []),
                "secondary_muscles": muscles.get("secondaryMuscles", []),
                "equipment": [],
            }
    if not records:
        raise ValueError("Garmin exercise catalog contains no exercises")

    # Metadata endpoints are optional: failure must not make the verified IDs
    # unusable. They have no user/account credentials.
    try:
        equipment = _fetch(GARMIN_EQUIPMENT_URL, json_data=True)
        for group in equipment if isinstance(equipment, list) else []:
            category = str(group.get("exerciseCategoryKey", "")).upper()
            for ex in group.get("exercisesInCategory", []):
                key = (category, str(ex.get("exerciseKey", "")).upper())
                if key in records:
                    records[key]["equipment"] = ex.get("equipmentKeys", [])
    except (requests.RequestException, ValueError, TypeError, KeyError):
        pass

    try:
        names = _fetch(GARMIN_NAMES_URL, json_data=False)
        for line in names.splitlines():
            line = line.strip()
            if not line or line.startswith(("#", "!")) or "=" not in line:
                continue
            key, label = line.split("=", 1)
            for identity, record in records.items():
                if key == "_".join(identity):
                    record["name_en"] = label.strip()
                    break
    except (requests.RequestException, ValueError, TypeError):
        pass
    return sorted(records.values(), key=lambda e: (e["category"], e["exercise_name"]))


def get_catalog() -> List[Dict[str, Any]]:
    """Return cached data; serve a stale good catalog if refreshing fails."""
    global _cache_records, _cache_until
    with _cache_lock:
        if _cache_records is not None and time.monotonic() < _cache_until:
            return _cache_records
        try:
            fresh = _load_catalog()
        except (requests.RequestException, ValueError, TypeError) as exc:
            if _cache_records is not None:
                _cache_until = time.monotonic() + 10 * 60
                return _cache_records
            raise RuntimeError(
                "No se pudo consultar el catalogo publico de ejercicios de Garmin. "
                "Verifica acceso HTTPS desde el VPS e intentalo mas tarde: "
                + str(exc)
            ) from exc
        _cache_records = fresh
        _cache_until = time.monotonic() + _CACHE_SECONDS
        return _cache_records


def _match(record: Dict[str, Any], query: str) -> bool:
    if not query:
        return True
    query_normal = _normalize(query)
    candidates = [query_normal]
    for es, en in QUERY_ALIASES.items():
        if es in query_normal:
            candidates.append(query_normal.replace(es, en))
    haystack = _normalize(" ".join([
        record["exercise_name"], record["category"], record["name_en"],
        record["name_es"] or "",
    ]))
    return any(all(word in haystack for word in candidate.split()) for candidate in candidates)


def search_catalog(
    query: str = "",
    equipment: str = "",
    muscle: str = "",
    category: str = "",
    limit: int = 20,
) -> Dict[str, Any]:
    """Search official IDs with optional category/muscle/equipment filters."""
    if not 1 <= limit <= 100:
        raise ValueError("limit must be between 1 and 100")
    selected = []
    for record in get_catalog():
        if category and _normalize(record["category"]) != _normalize(category):
            continue
        if equipment and _normalize(equipment) not in {
            _normalize(e) for e in record["equipment"]
        }:
            continue
        if muscle and _normalize(muscle) not in {
            _normalize(m) for m in record["primary_muscles"] + record["secondary_muscles"]
        }:
            continue
        if _match(record, query):
            selected.append(record)
    return {
        "total_matches": len(selected),
        "shown": min(len(selected), limit),
        "source": GARMIN_EXERCISES_URL,
        "exercises": selected[:limit],
    }


def lookup_exercise(category: str, exercise_name: str) -> Dict[str, Any]:
    """Look up an exact category+exercise pair, with deterministic suggestions."""
    key = (_normalize(category), _normalize(exercise_name))
    for record in get_catalog():
        if (_normalize(record["category"]), _normalize(record["exercise_name"])) == key:
            return {"found": True, "exercise": record}
    suggestions = search_catalog(query=exercise_name, limit=5)["exercises"]
    return {"found": False, "suggestions": suggestions}


def validate_exercises(exercises: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate identifiers and counts before sending data to Garmin Connect."""
    if not exercises:
        return {"valid": False, "errors": [{"index": 0, "error": "Missing exercises"}]}
    available = {
        (record["category"], record["exercise_name"]): record
        for record in get_catalog()
    }
    result = []
    errors = []
    for i, ex in enumerate(exercises):
        category = str(ex.get("category") or "").strip().upper()
        name = str(ex.get("name") or "").strip().upper()
        found = available.get((category, name))
        item_errors = []
        if not found:
            item_errors.append("Use a valid Garmin category/name pair from search_exercises")
        for field, minimum in (("sets", 1), ("reps", 1), ("rest_seconds", 0)):
            if field not in ex:
                continue
            try:
                value = int(ex[field])
                if str(value) != str(ex[field]).strip() or value < minimum:
                    raise ValueError()
            except (ValueError, TypeError):
                item_errors.append(f"{field} must be an integer >= {minimum}")
        result.append({"index": i, "valid": not item_errors, "matched": found,
                       "errors": item_errors})
        if item_errors:
            errors.append({"index": i, "errors": item_errors})
    return {"valid": not errors, "checked": len(exercises),
            "errors": errors, "exercises": result}


def configure(client):
    """No Garmin credentials are required for the public catalog."""
    return None


def register_tools(app):
    @app.tool()
    async def search_exercises(
        query: str = "", equipment: str = "", muscle: str = "",
        category: str = "", limit: int = 20
    ) -> str:
        """Buscar ejercicios oficiales Garmin en español o inglés, con filtros.

        Returns the exact category + exercise_name identifiers required to
        create a recognized Garmin strength workout. Only curated Spanish names
        are available; otherwise name_es is null and name_en is authoritative.
        Equipment: BAND, DUMBBELL, BARBELL, etc. No user data is modified.
        """
        try:
            return json.dumps(search_catalog(query, equipment, muscle, category, limit),
                              ensure_ascii=False)
        except (RuntimeError, ValueError) as exc:
            return json.dumps({"error": str(exc)}, ensure_ascii=False)

    @app.tool()
    async def get_exercise_details(category: str, exercise_name: str) -> str:
        """Obtener identificador, músculos y equipamiento de un ejercicio Garmin.

        Use exact category and exercise_name returned by search_exercises.
        This is read-only and does not modify Garmin Connect workouts.
        """
        try:
            return json.dumps(lookup_exercise(category, exercise_name),
                              ensure_ascii=False)
        except (RuntimeError, ValueError) as exc:
            return json.dumps({"error": str(exc)}, ensure_ascii=False)

    @app.tool()
    async def validate_strength_exercises(exercises: List[Dict[str, Any]]) -> str:
        """Validar códigos Garmin y series/repeticiones antes de crear una rutina.

        Requires each exercise to specify category and name as official Garmin
        identifiers. Optional sets/reps/rest_seconds must be positive counts.
        Does not create or modify any workouts.
        """
        try:
            return json.dumps(validate_exercises(exercises), ensure_ascii=False)
        except (RuntimeError, ValueError) as exc:
            return json.dumps({"error": str(exc)}, ensure_ascii=False)

    return app
