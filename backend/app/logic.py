from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from app.services.emissions import (
    EMISSION_FACTORS,
    LOW_CARBON_TRANSIT_CHOICES,
    SOLO_TRANSPORT_CHOICES,
    build_context_description,
    calculate_emissions,
    get_baseline_choice,
)

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


def _filter_activity_logs(
    activities: List[Dict[str, Any]],
    category: str,
    selected_choices: Optional[Set[str]] = None,
) -> List[Dict[str, Any]]:
    """Filters activities by category and an optional set of selected choices."""
    return [
        activity
        for activity in activities
        if activity.get("category") == category
        and (selected_choices is None or activity.get("selectedChoice") in selected_choices)
    ]


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

    transit_logs = _filter_activity_logs(activities, "transit")
    beef_logs = _filter_activity_logs(activities, "food", {"beef_lamb"})
    vegan_logs = _filter_activity_logs(activities, "food", {"vegan"})
    ac_logs = _filter_activity_logs(activities, "energy", {"ac_standard"})
    fashion_logs = _filter_activity_logs(activities, "shopping", {"fast_fashion"})
    second_hand_logs = _filter_activity_logs(activities, "shopping", {"second_hand"})

    # --- Rule 1: Transit ---
    solo_trips = sum(1 for a in transit_logs if a.get("selectedChoice") in SOLO_TRANSPORT_CHOICES)
    low_carbon_trips = sum(1 for a in transit_logs if a.get("selectedChoice") in LOW_CARBON_TRANSIT_CHOICES)
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
