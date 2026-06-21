from app.logic import (
    calculate_emissions,
    calculate_new_streak,
    generate_nudges
)

def test_calculate_emissions_transit():
    # Input: transit, train, 10.0, solo_petrol
    user_baseline = {"transit": "solo_petrol"}
    calc = calculate_emissions("transit", "train", 10.0, user_baseline)
    assert calc["carbonGrams"] == 400.0
    assert calc["baselineCarbonGrams"] == 2700.0
    assert calc["savedGrams"] == 2300.0
    assert calc["phoneCharges"] == round(2300.0 / 8.33, 1)
    assert calc["tvHours"] == round(2300.0 / 50.0, 1)
    assert calc["forestProgress"] == round(2300.0 / 12000.0, 4)

def test_calculate_emissions_food():
    # Input: food, vegan, 1, beef_lamb
    user_baseline = {"diet": "high_meat"}
    calc = calculate_emissions("food", "vegan", 1.0, user_baseline)
    assert calc["carbonGrams"] == 200.0
    assert calc["baselineCarbonGrams"] == 3000.0
    assert calc["savedGrams"] == 2800.0

def test_streak_calculation():
    # Scenario 1: First log
    assert calculate_new_streak("", 0, "2026-06-21") == 1

    # Scenario 2: Same-day logging keeps the same streak
    assert calculate_new_streak("2026-06-21", 5, "2026-06-21") == 5

    # Scenario 3: Consecutive day logging increments streak
    assert calculate_new_streak("2026-06-20", 5, "2026-06-21") == 6

    # Scenario 4: Day skipped resets streak to 1
    assert calculate_new_streak("2026-06-18", 5, "2026-06-21") == 1

def test_generate_nudges():
    # Given: no activities and default baseline
    activities = []
    baseline = {"transit": "solo_petrol", "diet": "high_meat", "energy": "ac_always"}
    nudges = generate_nudges(activities, baseline)
    # With no activities, default nudges are generated for transit, diet, energy (3 base categories)
    assert 3 <= len(nudges) <= 4
    types = {n["type"] for n in nudges}
    assert "transit" in types
    assert "diet" in types
    assert "energy" in types
