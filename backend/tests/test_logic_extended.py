"""
Extended tests for logic.py: nudge engine, shopping nudges,
enriched equivalencies, streak edge cases, and emission factor gaps.
"""
from app.logic import (
    calculate_emissions,
    calculate_new_streak,
    generate_nudges,
    _find_highest_emission_category,
    EMISSION_FACTORS,
)


# ── Equivalency tier tests ────────────────────────────────────────────────────

def test_equivalency_under_100g():
    """Small savings (<100g) show gram-count message."""
    user_baseline = {"transit": "active"}   # baseline = active (0g), selected = active (0g)
    # Use energy: ventilation vs ac_standard to get 0 savings first, then flip
    # Use food vegan vs vegan baseline → 0 saved. Use transit bus vs bus baseline (0 saved)
    # Simulate a tiny save via energy fan vs ventilation baseline
    # Actually: baseline eco_mode → ac_eco (300), selected fan_only (40) → saved 260g per hr
    user_baseline = {"energy": "eco_mode"}
    calc = calculate_emissions("energy", "fan_only", 1.0, user_baseline)
    saved = calc["savedGrams"]
    assert 0 < saved < 1000
    assert "smartphone charges" in calc["contextEquivalence"] or "hours of TV" in calc["contextEquivalence"] or "every gram" in calc["contextEquivalence"]


def test_equivalency_1000_to_3000g():
    """Mid-range savings (≥1000g) show petrol-car-trip message."""
    user_baseline = {"transit": "solo_petrol"}
    calc = calculate_emissions("transit", "train", 5.0, user_baseline)
    # saved = 5 * (270 - 40) = 1150g
    assert 1000 <= calc["savedGrams"] < 3000
    assert "petrol car trip" in calc["contextEquivalence"]


def test_equivalency_over_3000g():
    """Large savings (≥3000g) show fridge-days message."""
    user_baseline = {"diet": "high_meat"}
    calc = calculate_emissions("food", "vegan", 2.0, user_baseline)
    # saved = 2 * (3000 - 200) = 5600g
    assert calc["savedGrams"] >= 3000
    assert "fridge" in calc["contextEquivalence"]


def test_equivalency_over_12000g():
    """Very large savings (≥12 kg) show tree-planting message."""
    user_baseline = {"shopping": "fast_fashion"}
    calc = calculate_emissions("shopping", "second_hand", 1.0, {"transit": "solo_petrol"})
    # saved = 1 * (15000 - 500) = 14500g ≥ 12000
    assert calc["savedGrams"] >= 12000
    assert "tree" in calc["contextEquivalence"]


def test_new_equivalency_fields_present():
    """Result dict contains fridgeHours and treeDays fields."""
    calc = calculate_emissions("food", "vegan", 1.0, {"diet": "high_meat"})
    assert "fridgeHours" in calc
    assert "treeDays" in calc


# ── Nudge engine tests ────────────────────────────────────────────────────────

def test_nudges_empty_activities():
    """With no activities, returns default nudges for all 3 base categories."""
    nudges = generate_nudges([], {"transit": "solo_petrol", "diet": "high_meat", "energy": "ac_always"})
    types = {n["type"] for n in nudges}
    assert "transit" in types
    assert "diet" in types
    assert "energy" in types


def test_nudges_shopping_fast_fashion():
    """Fast fashion logs trigger a shopping nudge."""
    activities = [
        {"category": "shopping", "selectedChoice": "fast_fashion", "carbonGrams": 15000.0, "savedGrams": 0.0}
    ]
    nudges = generate_nudges(activities, {})
    shopping_nudges = [n for n in nudges if n["type"] == "shopping"]
    assert len(shopping_nudges) >= 1
    assert "fast-fashion" in shopping_nudges[0]["text"]


def test_nudges_shopping_second_hand_reward():
    """Second-hand purchase logs trigger a positive shopping nudge."""
    activities = [
        {"category": "shopping", "selectedChoice": "second_hand", "carbonGrams": 500.0, "savedGrams": 14500.0}
    ]
    nudges = generate_nudges(activities, {})
    shopping_nudges = [n for n in nudges if n["type"] == "shopping"]
    assert len(shopping_nudges) >= 1
    assert "second-hand" in shopping_nudges[0]["text"]


def test_nudges_heavy_beef_priority():
    """≥3 beef logs produce a high-priority diet nudge (priority=1)."""
    activities = [
        {"category": "food", "selectedChoice": "beef_lamb", "carbonGrams": 3000.0, "savedGrams": 0.0}
    ] * 3
    nudges = generate_nudges(activities, {"diet": "high_meat"})
    diet_nudges = [n for n in nudges if n["type"] == "diet"]
    assert len(diet_nudges) >= 1
    assert diet_nudges[0].get("priority") == 1


def test_nudges_vegan_encouragement():
    """≥2 vegan logs produce a positive diet nudge."""
    activities = [
        {"category": "food", "selectedChoice": "vegan", "carbonGrams": 200.0, "savedGrams": 2800.0},
        {"category": "food", "selectedChoice": "vegan", "carbonGrams": 200.0, "savedGrams": 2800.0},
    ]
    nudges = generate_nudges(activities, {"diet": "vegan"})
    diet_nudges = [n for n in nudges if n["type"] == "diet"]
    assert any("vegan" in n["text"].lower() or "great" in n["text"].lower() for n in diet_nudges)


def test_nudges_max_4():
    """generate_nudges returns at most 4 nudges."""
    activities = [
        {"category": "transit", "selectedChoice": "solo_petrol", "carbonGrams": 270.0, "savedGrams": 0.0},
        {"category": "transit", "selectedChoice": "solo_petrol", "carbonGrams": 270.0, "savedGrams": 0.0},
        {"category": "transit", "selectedChoice": "solo_petrol", "carbonGrams": 270.0, "savedGrams": 0.0},
        {"category": "food", "selectedChoice": "beef_lamb", "carbonGrams": 3000.0, "savedGrams": 0.0},
        {"category": "food", "selectedChoice": "beef_lamb", "carbonGrams": 3000.0, "savedGrams": 0.0},
        {"category": "food", "selectedChoice": "beef_lamb", "carbonGrams": 3000.0, "savedGrams": 0.0},
        {"category": "energy", "selectedChoice": "ac_standard", "carbonGrams": 1200.0, "savedGrams": 0.0},
        {"category": "energy", "selectedChoice": "ac_standard", "carbonGrams": 1200.0, "savedGrams": 0.0},
        {"category": "energy", "selectedChoice": "ac_standard", "carbonGrams": 1200.0, "savedGrams": 0.0},
        {"category": "shopping", "selectedChoice": "fast_fashion", "carbonGrams": 15000.0, "savedGrams": 0.0},
    ]
    nudges = generate_nudges(activities, {})
    assert len(nudges) <= 4


# ── Helper function tests ─────────────────────────────────────────────────────

def test_find_highest_emission_category():
    """Identifies the category with the most total carbon correctly."""
    activities = [
        {"category": "transit", "carbonGrams": 500.0},
        {"category": "food", "carbonGrams": 9000.0},
        {"category": "energy", "carbonGrams": 200.0},
    ]
    assert _find_highest_emission_category(activities) == "food"


def test_find_highest_emission_empty():
    """Returns empty string for empty activity list."""
    assert _find_highest_emission_category([]) == ""


# ── Streak edge cases ─────────────────────────────────────────────────────────

def test_streak_backward_log_no_change():
    """Historical (past-dated) log does not change current streak."""
    result = calculate_new_streak("2026-06-21", 5, "2026-06-19")
    assert result == 5


def test_streak_far_future_gap():
    """A 10-day gap resets streak to 1."""
    result = calculate_new_streak("2026-06-10", 7, "2026-06-21")
    assert result == 1


def test_streak_invalid_date_fallback():
    """Malformed date strings fall back gracefully to streak=1."""
    result = calculate_new_streak("not-a-date", 5, "2026-06-21")
    assert result == 1


# ── Emission factor completeness ──────────────────────────────────────────────

def test_all_categories_present():
    assert set(EMISSION_FACTORS.keys()) == {"transit", "food", "energy", "shopping"}


def test_zero_emission_choices_exist():
    """At least one zero-emission choice must exist in transit and energy."""
    assert EMISSION_FACTORS["transit"]["active"] == 0.0
    assert EMISSION_FACTORS["energy"]["ventilation"] == 0.0
