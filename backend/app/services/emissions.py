from typing import Any, Dict, List, Optional, Set

# Seed Coefficients Matrix
EMISSION_FACTORS = {
    "transit": {
        "solo_petrol": 270.0,
        "solo_diesel": 290.0,
        "ev_rideshare": 100.0,
        "bus": 60.0,
        "train": 40.0,
        "active": 0.0,
    },
    "food": {
        "beef_lamb": 3000.0,
        "pork_poultry": 600.0,
        "vegetarian_fish": 400.0,
        "vegan": 200.0,
    },
    "energy": {
        "ac_standard": 1200.0,
        "ac_eco": 300.0,
        "fan_only": 40.0,
        "ventilation": 0.0,
    },
    "shopping": {
        "fast_fashion": 15000.0,
        "electronics_small": 30000.0,
        "second_hand": 500.0,
        "groceries_typical": 1500.0,
    },
}

BASELINE_MAPPING = {
    "transit": {
        "solo_petrol": "solo_petrol",
        "carpool": "ev_rideshare",
        "transit": "bus",
        "active": "active",
    },
    "diet": {
        "high_meat": "beef_lamb",
        "low_meat": "pork_poultry",
        "vegetarian": "vegetarian_fish",
        "vegan": "vegan",
    },
    "energy": {
        "ac_always": "ac_standard",
        "eco_mode": "ac_eco",
        "ventilation": "ventilation",
    },
}

BASELINE_PREFERENCE_KEYS = {
    "transit": ("transit", "solo_petrol"),
    "food": ("diet", "high_meat"),
    "energy": ("energy", "ac_always"),
}

LOW_CARBON_TRANSIT_CHOICES: Set[str] = {"bus", "train", "active", "ev_rideshare"}
SOLO_TRANSPORT_CHOICES: Set[str] = {"solo_petrol", "solo_diesel"}


def get_baseline_choice(category: str, selected_choice: str, user_baseline: Dict[str, str]) -> str:
    """Resolve the baseline-equivalent choice for the selected activity."""
    if category == "shopping":
        return "fast_fashion" if selected_choice == "second_hand" else selected_choice

    if category not in BASELINE_PREFERENCE_KEYS:
        return selected_choice

    pref_key, fallback_choice = BASELINE_PREFERENCE_KEYS[category]
    pref = user_baseline.get(pref_key, fallback_choice)
    baseline_mapping = BASELINE_MAPPING["diet" if category == "food" else category]
    return baseline_mapping.get(pref, fallback_choice)


def build_context_description(saved_emissions: float) -> str:
    """Build a concise, human-friendly explanation for the implied savings."""
    if saved_emissions <= 0:
        return "No carbon saved vs. your baseline"

    if saved_emissions >= 12000:
        trees = round(saved_emissions / 12000.0, 1)
        return f"Like planting {trees} tree{'s' if trees != 1.0 else ''} — impressive!"

    if saved_emissions >= 3000:
        fridge_hours = round(saved_emissions / 100.0, 1)
        return f"Like running your fridge for {round(fridge_hours / 24, 1)} days"

    if saved_emissions >= 1000:
        return f"Equivalent to avoiding a {round(saved_emissions / 270.0, 1)}-mile petrol car trip"

    if saved_emissions >= 100:
        phone_charges = round(saved_emissions / 8.33, 1)
        tv_hours = round(saved_emissions / 50.0, 1)
        return f"Equivalent to {int(phone_charges)} smartphone charges or {int(tv_hours)} hours of TV"

    return f"Saved {int(saved_emissions)}g CO2e — every gram counts!"


def calculate_emissions(category: str, selected_choice: str, amount: float, user_baseline: Dict[str, str]) -> Dict[str, Any]:
    """Compute emissions, baseline-equivalent emissions, savings, and equivalencies."""
    baseline_choice = get_baseline_choice(category, selected_choice, user_baseline)

    ef_selected = EMISSION_FACTORS.get(category, {}).get(selected_choice, 0.0)
    ef_baseline = EMISSION_FACTORS.get(category, {}).get(baseline_choice, 0.0)

    actual_emissions = amount * ef_selected
    baseline_emissions = amount * ef_baseline
    saved_emissions = baseline_emissions - actual_emissions

    phone_charges = round(max(0.0, saved_emissions / 8.33), 1)
    tv_hours = round(max(0.0, saved_emissions / 50.0), 1)
    forest_progress = round(max(0.0, saved_emissions / 12000.0), 4)
    fridge_hours = round(max(0.0, saved_emissions / 100.0), 1)
    tree_days = round(max(0.0, saved_emissions / 33.0), 1)

    return {
        "selectedChoice": selected_choice,
        "baselineEquivalentChoice": baseline_choice,
        "carbonGrams": round(actual_emissions, 1),
        "baselineCarbonGrams": round(baseline_emissions, 1),
        "savedGrams": round(saved_emissions, 1),
        "phoneCharges": phone_charges,
        "tvHours": tv_hours,
        "fridgeHours": fridge_hours,
        "treeDays": tree_days,
        "forestProgress": forest_progress,
        "contextEquivalence": build_context_description(saved_emissions),
    }


def _find_highest_emission_category(activities: List[Dict[str, Any]]) -> str:
    """Return the category with the highest total emissions in the activity list."""
    totals: Dict[str, float] = {}
    for activity in activities:
        category = activity.get("category", "")
        grams = activity.get("carbonGrams", 0.0)
        totals[category] = totals.get(category, 0.0) + grams
    return max(totals, key=lambda key: totals[key]) if totals else ""
