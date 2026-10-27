"""Read-only Garmin exercise catalog contract tests; no network calls."""
import json

import pytest
import requests

from garmin_mcp import exercise_catalog as catalog


@pytest.fixture(autouse=True)
def clear_catalog_cache(monkeypatch):
    monkeypatch.setattr(catalog, "_cache_records", None)
    monkeypatch.setattr(catalog, "_cache_until", 0.0)


@pytest.fixture
def fake_garmin_assets(monkeypatch):
    data = {"categories": {
        "BANDED_EXERCISES": {"exercises": {
            "SQUAT": {"primaryMuscles": ["QUADS"], "secondaryMuscles": ["GLUTES"]},
            "LATERAL_BAND_WALKS": {
                "primaryMuscles": ["ABDUCTORS"], "secondaryMuscles": ["GLUTES"]
            },
        }},
        "SQUAT": {"exercises": {
            "GOBLET_SQUAT": {"primaryMuscles": ["QUADS"], "secondaryMuscles": []}
        }},
    }}
    equipment = [
        {"exerciseCategoryKey": "BANDED_EXERCISES", "exercisesInCategory": [
            {"exerciseKey": "SQUAT", "equipmentKeys": ["BAND"]},
            {"exerciseKey": "LATERAL_BAND_WALKS", "equipmentKeys": ["BAND"]},
        ]},
        {"exerciseCategoryKey": "SQUAT", "exercisesInCategory": [
            {"exerciseKey": "GOBLET_SQUAT", "equipmentKeys": ["DUMBBELL"]}
        ]},
    ]
    translations = "BANDED_EXERCISES_SQUAT=Banded Squat\nSQUAT_GOBLET_SQUAT=Goblet Squat\n"

    def get_data(url, *, json_data):
        if url == catalog.GARMIN_EXERCISES_URL:
            return data
        if url == catalog.GARMIN_EQUIPMENT_URL:
            return equipment
        if url == catalog.GARMIN_NAMES_URL:
            return translations
        raise AssertionError("Unexpected endpoint")
    monkeypatch.setattr(catalog, "_fetch", get_data)
    return data


def test_uses_official_category_and_exercise_keys(fake_garmin_assets):
    result = catalog.search_catalog(query="sentadilla", equipment="BAND")
    assert result["total_matches"] == 1
    assert result["exercises"][0]["category"] == "BANDED_EXERCISES"
    assert result["exercises"][0]["exercise_name"] == "SQUAT"
    assert result["exercises"][0]["name_es"] == "sentadilla con banda"


def test_spanish_and_english_queries_equivalent(fake_garmin_assets):
    es = catalog.search_catalog(query="sentadilla")
    en = catalog.search_catalog(query="squat")
    assert es["total_matches"] == en["total_matches"] == 2
    assert catalog.search_catalog(query="sentadilla", equipment="DUMBBELL")[
        "exercises"
    ][0]["exercise_name"] == "GOBLET_SQUAT"


def test_exact_lookup_and_missing_suggestions(fake_garmin_assets):
    ok = catalog.lookup_exercise("squat", "goblet_squat")
    assert ok["found"]
    assert ok["exercise"]["name_en"] == "Goblet Squat"
    missing = catalog.lookup_exercise("BENCH_PRESS", "WRONG")
    assert not missing["found"]


def test_validation_rejects_unnamed_and_fabricated_exercises(fake_garmin_assets):
    exercises = [
        {"category": "BANDED_EXERCISES", "name": "SQUAT", "sets": 3,
         "reps": 10, "rest_seconds": 60},
        {"category": "NOT_A_CATEGORY", "name": "SQUAT", "sets": 0, "reps": -2},
    ]
    result = catalog.validate_exercises(exercises)
    assert not result["valid"]
    assert result["exercises"][0]["valid"]
    assert not result["exercises"][1]["valid"]
    assert len(result["errors"][0]["errors"]) == 3


def test_validation_requires_category_and_name(fake_garmin_assets):
    result = catalog.validate_exercises([{"name": "SQUAT"}])
    assert not result["valid"]
    assert not catalog.validate_exercises([])["valid"]


def test_source_data_schema_error_is_actionable(monkeypatch):
    monkeypatch.setattr(
        catalog, "_fetch", lambda url, *, json_data: {"wrong": []}
    )
    with pytest.raises(RuntimeError, match="No se pudo consultar"):
        catalog.get_catalog()


def test_stale_cache_survives_network_failure(fake_garmin_assets, monkeypatch):
    records = catalog.get_catalog()
    monkeypatch.setattr(catalog, "_cache_until", 0.0)

    def unavailable(url, *, json_data):
        raise requests.ConnectionError("Garmin unavailable")
    monkeypatch.setattr(catalog, "_fetch", unavailable)
    assert catalog.get_catalog() is records


def test_search_rejects_unbounded_limit(fake_garmin_assets):
    with pytest.raises(ValueError, match="limit"):
        catalog.search_catalog(limit=1000)


def test_optional_equipment_and_translation_fail_safely(fake_garmin_assets, monkeypatch):
    original = catalog._fetch

    def missing_optional(url, *, json_data):
        if url != catalog.GARMIN_EXERCISES_URL:
            raise requests.ConnectionError("missing")
        return original(url, json_data=json_data)
    monkeypatch.setattr(catalog, "_fetch", missing_optional)
    result = catalog.search_catalog(query="squat")
    assert result["total_matches"] == 2
    assert all(record["equipment"] == [] for record in result["exercises"])
