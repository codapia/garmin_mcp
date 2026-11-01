"""Fitness Codapia bridge to the private Fitness API. No Garmin data is modified."""
import asyncio
import datetime as dt
import json
import os
from typing import Any, Optional
import requests

def _check_date(value: str) -> str:
    if dt.date.fromisoformat(value).isoformat() != value:
        raise ValueError("Fecha YYYY-MM-DD requerida")
    return value

def fitness_request(payload: dict[str, Any]) -> dict[str, Any]:
    """Call the authenticated API. Never log the request headers or secrets."""
    url = os.getenv("FITNESS_API_URL", "")
    secret = os.getenv("FITNESS_INTERNAL_TOKEN", "")
    client_id = os.getenv("FITNESS_CF_SERVICE_CLIENT_ID", "")
    client_secret = os.getenv("FITNESS_CF_SERVICE_CLIENT_SECRET", "")
    if not all([url, secret, client_id, client_secret]):
        raise RuntimeError("Fitness API no configurada: configure URL, token interno y Cloudflare Access service token")
    if not url.startswith("https://"):
        raise RuntimeError("FITNESS_API_URL debe usar HTTPS")
    response = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {secret}",
            "CF-Access-Client-Id": client_id,
            "CF-Access-Client-Secret": client_secret,
            "Accept": "application/json",
        },
        timeout=25,
        allow_redirects=False,
    )
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict) or data.get("ok") is not True:
        raise RuntimeError(str(data.get("error", "Respuesta Fitness inválida")))
    return data

def configure(client):
    """The Fitness bridge does not depend on the Garmin client."""
    return None

def register_tools(app):
    @app.tool()
    async def fitness_registrar_comida(
        date: str,
        meal_type: str,
        description: str,
        calories: Optional[float] = None,
        protein_g: Optional[float] = None,
        portions: Optional[list[dict[str, Any]]] = None,
        calories_estimated: bool = True,
        protein_estimated: bool = True,
        notes: Optional[str] = None,
        external_id: Optional[str] = None,
    ) -> str:
        """Guardar en Fitness Codapia una comida informada por el usuario.

        Usa fecha local YYYY-MM-DD, meal_type desayuno/almuerzo/cena/colacion/otro
        y descripción real. Si calorías/proteínas son aproximadas, deja estimated=True.
        No escribir en Garmin Connect. external_id opcional evita duplicados al reintentar.
        """
        _check_date(date)
        if meal_type not in {"desayuno", "almuerzo", "cena", "colacion", "otro"}:
            raise ValueError("meal_type inválido")
        payload = {"date": date, "meal_type": meal_type, "description": description,
                   "calories": calories, "protein_g": protein_g,
                   "portions": portions or [], "calories_estimated": calories_estimated,
                   "protein_estimated": protein_estimated, "notes": notes,
                   "external_id": external_id}
        result = await asyncio.to_thread(fitness_request, {"action": "save_meal", "payload": payload})
        return json.dumps(result, ensure_ascii=False)

    @app.tool()
    async def fitness_consultar_comidas(start_date: str, end_date: str) -> str:
        """Consultar historial persistido de comidas de Fitness Codapia."""
        result = await asyncio.to_thread(fitness_request,
            {"action":"list_meals", "start":_check_date(start_date),"end":_check_date(end_date)})
        return json.dumps(result, ensure_ascii=False)

    @app.tool()
    async def fitness_consultar_historial(start_date: str, end_date: str) -> str:
        """Consultar juntos los días Garmin sincronizados, rutinas web y alimentación."""
        result = await asyncio.to_thread(fitness_request,
            {"action":"timeline", "start":_check_date(start_date),"end":_check_date(end_date)})
        return json.dumps(result, ensure_ascii=False)

    @app.tool()
    async def fitness_consultar_rutinas(start_date: str, end_date: str) -> str:
        """Consultar planes web creados, sin alterar sus equivalentes en Garmin."""
        result = await asyncio.to_thread(fitness_request,
            {"action":"list_plans", "start":_check_date(start_date),"end":_check_date(end_date)})
        return json.dumps(result, ensure_ascii=False)

    @app.tool()
    async def fitness_guardar_rutina(
        date: str,
        title: str,
        steps: list[dict[str, Any]],
        plan_id: Optional[str] = None,
        expected_version: Optional[int] = None,
    ) -> str:
        """Crear o actualizar un plan de entrenamiento SOLO EN FITNESS CODAPIA.

        Al editar requiere plan_id y expected_version para prevenir sobreescrituras.
        NO cambia ni elimina entrenamientos Garmin. Confirma cambios en Garmin aparte.
        """
        payload:dict[str,Any]={"date":_check_date(date),"title":title,"steps":steps}
        if plan_id:
            if expected_version is None:
                raise ValueError("Se necesita expected_version para editar rutina")
            payload.update({"id":plan_id, "expected_version":expected_version})
        result = await asyncio.to_thread(fitness_request,{"action":"save_plan","payload":payload})
        return json.dumps(result,ensure_ascii=False)

    @app.tool()
    async def fitness_enviar_rutina_garmin(plan_id: str, expected_version: int) -> str:
        """Programar una rutina ya guardada en Fitness, en Garmin Connect.

        Usa el ID y la versión de fitness_consultar_rutinas; conserva la referencia
        Garmin y es seguro reintentar la programación sin duplicar el workout.
        No elimina ni reemplaza rutinas Garmin preexistentes.
        """
        result = await asyncio.to_thread(
            fitness_request,
            {"action": "send_plan",
             "payload": {"plan_id": plan_id, "expected_version": expected_version}},
        )
        return json.dumps(result, ensure_ascii=False)

    @app.tool()
    async def fitness_sincronizar_garmin(date: str) -> str:
        """Refrescar la caché de Fitness Codapia con datos reales de Garmin de una fecha.

        Solo lee Garmin y actualiza su espejo local; no cambia sesiones ni datos Garmin.
        """
        result = await asyncio.to_thread(fitness_request,{"action":"sync_garmin","date":_check_date(date)})
        return json.dumps(result,ensure_ascii=False)

    return app
