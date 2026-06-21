from datetime import datetime, timezone
from typing import Dict, Any, List

# Seed Coefficients Matrix
EMISSION_FACTORS = {
    "transit": {
        "solo_petrol": 270.0,
        "solo_diesel": 290.0,
        "ev_rideshare": 100.0,
        "bus": 60.0,
        "train": 40.0,
        "active": 0.0
    },
    "food": {
        "beef_lamb": 3000.0,
        "pork_poultry": 600.0,
        "vegetarian_fish": 400.0,
        "vegan": 200.0
    },
    "energy": {
        "ac_standard": 1200.0,
        "ac_eco": 300.0,
        "fan_only": 40.0,
        "ventilation": 0.0
    },
    "shopping": {
        "fast_fashion": 15000.0,
        "electronics_small": 30000.0,
        "second_hand": 500.0,
        "groceries_typical": 1500.0
    }
}

BASELINE_MAPPING = {
    "transit": {
        "solo_petrol": "solo_petrol",
        "carpool": "ev_rideshare",
        "transit": "bus",
        "active": "active"
    },
    "diet": {
        "high_meat": "beef_lamb",
        "low_meat": "pork_poultry",
        "vegetarian": "vegetarian_fish",
        "vegan": "vegan"
    },
    "energy": {
        "ac_always": "ac_standard",
        "eco_mode": "ac_eco",
        "ventilation": "ventilation"
    }
}

def get_baseline_choice(category: str, selected_choice: str, user_baseline: Dict[str, str]) -> str:
    """
    Determines the baseline equivalent choice key based on user baseline preferences or defaults.
    """
    if category == "transit":
        pref = user_baseline.get("transit", "solo_petrol")
        return BASELINE_MAPPING["transit"].get(pref, "solo_petrol")
    elif category == "food":
        pref = user_baseline.get("diet", "high_meat")
        return BASELINE_MAPPING["diet"].get(pref, "beef_lamb")
    elif category == "energy":
        pref = user_baseline.get("energy", "ac_always")
        return BASELINE_MAPPING["energy"].get(pref, "ac_standard")
    elif category == "shopping":
        # Dynamic baseline for shopping: second_hand avoids new fast_fashion
        if selected_choice == "second_hand":
            return "fast_fashion"
        return selected_choice
    return selected_choice

def calculate_emissions(category: str, selected_choice: str, amount: float, user_baseline: Dict[str, str]) -> Dict[str, Any]:
    """
    Computes emissions, baseline equivalent emissions, savings, and equivalencies.
    All calculations are returned normalized to single decimal floats.
    """
    baseline_choice = get_baseline_choice(category, selected_choice, user_baseline)
    
    # Get coefficients
    ef_selected = EMISSION_FACTORS.get(category, {}).get(selected_choice, 0.0)
    ef_baseline = EMISSION_FACTORS.get(category, {}).get(baseline_choice, 0.0)
    
    actual_emissions = amount * ef_selected
    baseline_emissions = amount * ef_baseline
    saved_emissions = baseline_emissions - actual_emissions
    
    # Calculate utility equivalencies (based on saved grams)
    phone_charges = round(max(0.0, saved_emissions / 8.33), 1)
    tv_hours = round(max(0.0, saved_emissions / 50.0), 1)
    forest_progress = round(max(0.0, saved_emissions / 12000.0), 4)  # High-precision forest tree increment
    fridge_hours = round(max(0.0, saved_emissions / 100.0), 1)  # Avg fridge ~100g CO2e/hr
    tree_days = round(max(0.0, saved_emissions / 33.0), 1)      # 1 tree absorbs ~12kg/year ≈ 33g/day

    # Build a rich, human-readable equivalence string
    context_desc = "No carbon saved vs. your baseline"
    if saved_emissions > 0:
        if saved_emissions >= 12000:
            trees = round(saved_emissions / 12000.0, 1)
            context_desc = f"Like planting {trees} tree{'s' if trees != 1.0 else ''} — impressive!"
        elif saved_emissions >= 3000:
            context_desc = f"Like running your fridge for {round(fridge_hours / 24, 1)} days"
        elif saved_emissions >= 1000:
            context_desc = f"Equivalent to avoiding a {round(saved_emissions / 270.0, 1)}-mile petrol car trip"
        elif saved_emissions >= 100:
            context_desc = f"Equivalent to {int(phone_charges)} smartphone charges or {int(tv_hours)} hours of TV"
        else:
            context_desc = f"Saved {int(saved_emissions)}g CO2e — every gram counts!"

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
        "contextEquivalence": context_desc
    }

def calculate_new_streak(last_logged_str: str, current_streak: int, new_log_date_str: str) -> int:
    """
    Calculates the new streak based on the last logged date and the current date (YYYY-MM-DD format).
    - Consecutive day logs: increments streak by 1.
    - Same day logs: maintains current streak.
    - Day skipped (>= 2 days gap): resets streak to 1.
    """
    if not last_logged_str:
        return 1
        
    try:
        last_date = datetime.strptime(last_logged_str, "%Y-%m-%d").date()
        new_date = datetime.strptime(new_log_date_str, "%Y-%m-%d").date()
    except ValueError:
        return 1
        
    delta = (new_date - last_date).days
    
    if delta == 1:
        return current_streak + 1
    elif delta == 0:
        return current_streak
    elif delta < 0:
        # Log is historically placed; do not change current streak
        return current_streak
    else:
        # Skip day
        return 1

def _find_highest_emission_category(activities: List[Dict[str, Any]]) -> str:
    """Returns the category name responsible for the most total carbon grams logged."""
    totals: Dict[str, float] = {}
    for act in activities:
        cat = act.get("category", "")
        grams = act.get("carbonGrams", 0.0)
        totals[cat] = totals.get(cat, 0.0) + grams
    return max(totals, key=lambda k: totals[k]) if totals else ""


def generate_nudges(activities: List[Dict[str, Any]], baseline: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    Generates up to 4 personalised, context-aware nudges based on the user's logged
    activity history and declared lifestyle baseline.

    Rules evaluated:
    1. Transit: penalise repeated solo drives; celebrate low-carbon streaks.
    2. Diet: penalise repeated beef/lamb; reward vegan/vegetarian patterns.
    3. Energy: penalise repeated standard AC; celebrate ventilation use.
    4. Shopping: penalise fast fashion; reward second-hand purchases.
    5. Highest-emission spotlight: call out the single category costing the most carbon.
    """
    nudges: List[Dict[str, Any]] = []

    transit_logs = [a for a in activities if a.get("category") == "transit"]
    beef_logs = [a for a in activities if a.get("category") == "food" and a.get("selectedChoice") == "beef_lamb"]
    vegan_logs = [a for a in activities if a.get("category") == "food" and a.get("selectedChoice") == "vegan"]
    ac_logs = [a for a in activities if a.get("category") == "energy" and a.get("selectedChoice") == "ac_standard"]
    fashion_logs = [a for a in activities if a.get("category") == "shopping" and a.get("selectedChoice") == "fast_fashion"]
    second_hand_logs = [a for a in activities if a.get("category") == "shopping" and a.get("selectedChoice") == "second_hand"]

    # --- Rule 1: Transit ---
    solo_trips = sum(1 for a in transit_logs if a.get("selectedChoice") in ["solo_petrol", "solo_diesel"])
    low_carbon_trips = sum(1 for a in transit_logs if a.get("selectedChoice") in ["bus", "train", "active", "ev_rideshare"])
    if solo_trips >= 3:
        nudges.append({
            "type": "transit",
            "priority": 1,
            "text": f"You logged {solo_trips} solo petrol/diesel drives recently — your biggest carbon source. "
                    f"Swapping just 2 of them for a train saves enough carbon to grow a tree seedling for 6 months."
        })
    elif solo_trips >= 1:
        nudges.append({
            "type": "transit",
            "priority": 2,
            "text": f"You took {solo_trips} solo drive(s) this week. Even one switch to public transit "
                    f"saves {solo_trips * 210}g CO2e — roughly {solo_trips * 25} smartphone charges."
        })
    elif low_carbon_trips >= 2:
        nudges.append({
            "type": "transit",
            "priority": 3,
            "text": f"Excellent! You chose low-carbon travel {low_carbon_trips} times. "
                    f"Keep it up — every low-carbon commute grows your Digital Forest faster."
        })
    else:
        nudges.append({
            "type": "transit",
            "priority": 4,
            "text": "Try logging a walk, cycle, or bus trip today. Active commuting saves "
                    "270g CO2e per mile and has zero fuel cost."
        })

    # --- Rule 2: Diet ---
    if len(beef_logs) >= 3:
        nudges.append({
            "type": "diet",
            "priority": 1,
            "text": f"Beef and lamb appeared {len(beef_logs)} times in your log — the highest-impact food choice. "
                    f"Replacing just one serving with a vegan meal saves 2.8 kg CO2e, equal to running "
                    f"your fridge for nearly 2 weeks."
        })
    elif len(beef_logs) >= 1:
        nudges.append({
            "type": "diet",
            "priority": 2,
            "text": f"You logged beef/lamb {len(beef_logs)} time(s). Try swapping one to poultry or fish — "
                    f"that alone saves up to 2.4 kg CO2e per serving."
        })
    elif len(vegan_logs) >= 2:
        nudges.append({
            "type": "diet",
            "priority": 3,
            "text": f"Great food choices! You logged {len(vegan_logs)} vegan meals. "
                    f"That's approximately {len(vegan_logs) * 2.8:.1f} kg CO2e saved vs. beef-based meals."
        })
    else:
        nudges.append({
            "type": "diet",
            "priority": 4,
            "text": "A single vegan lunch saves 2.8 kg CO2e — more than a 10-mile petrol drive. "
                    "Try a plant-based option this week."
        })

    # --- Rule 3: Energy ---
    if len(ac_logs) >= 3:
        nudges.append({
            "type": "energy",
            "priority": 1,
            "text": f"You used standard AC {len(ac_logs)} times. Switching to eco-mode saves "
                    f"900g CO2e per hour — over {len(ac_logs) * 900 // 1000} kg saved per session."
        })
    elif len(ac_logs) >= 1:
        nudges.append({
            "type": "energy",
            "priority": 2,
            "text": "Standard AC is energy-intensive. Tonight, try eco-mode or a fan — "
                    "you'd save 800–900g CO2e per hour."
        })
    else:
        nudges.append({
            "type": "energy",
            "priority": 4,
            "text": "Natural ventilation produces zero carbon. Keep windows open this evening "
                    "and let your Digital Forest grow faster."
        })

    # --- Rule 4: Shopping (only added if relevant data exists) ---
    if len(fashion_logs) >= 1:
        nudges.append({
            "type": "shopping",
            "priority": 1,
            "text": f"You logged {len(fashion_logs)} fast-fashion purchase(s) — one of the most "
                    f"carbon-intensive categories at 15 kg CO2e per item. Second-hand alternatives "
                    f"produce 97% less carbon."
        })
    elif len(second_hand_logs) >= 1:
        nudges.append({
            "type": "shopping",
            "priority": 3,
            "text": f"Nice work choosing second-hand {len(second_hand_logs)} time(s)! "
                    f"Each second-hand item avoids ~14.5 kg CO2e vs. fast fashion."
        })

    # Sort by priority (lower = more urgent) and return top 4
    nudges.sort(key=lambda n: n.get("priority", 9))
    return nudges[:4]
