from pydantic import BaseModel, Field, model_validator, field_validator
from typing import Optional, Dict
from datetime import datetime, timezone

class OnboardingRequest(BaseModel):
    transit: str
    diet: str
    energy: str

    @field_validator("transit")
    @classmethod
    def validate_transit(cls, v: str) -> str:
        allowed = ["solo_petrol", "carpool", "transit", "active"]
        if v not in allowed:
            raise ValueError(f"transit must be one of {allowed}")
        return v

    @field_validator("diet")
    @classmethod
    def validate_diet(cls, v: str) -> str:
        allowed = ["high_meat", "low_meat", "vegetarian", "vegan"]
        if v not in allowed:
            raise ValueError(f"diet must be one of {allowed}")
        return v

    @field_validator("energy")
    @classmethod
    def validate_energy(cls, v: str) -> str:
        allowed = ["ac_always", "eco_mode", "ventilation"]
        if v not in allowed:
            raise ValueError(f"energy must be one of {allowed}")
        return v

class ActivityLogRequest(BaseModel):
    category: str
    selectedChoice: str
    amount: float
    timestamp: Optional[datetime] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        allowed = ["transit", "food", "energy", "shopping"]
        if v not in allowed:
            raise ValueError(f"category must be one of {allowed}")
        return v

    @model_validator(mode="after")
    def validate_amount_and_choices(self) -> "ActivityLogRequest":
        category = self.category
        choice = self.selectedChoice
        amount = self.amount
        ts = self.timestamp

        # Check timestamp
        if ts is not None:
            now = datetime.now(timezone.utc)
            if (ts - now).total_seconds() > 60:
                raise ValueError("Timestamp cannot be in the future")

        # Validate choices and limits
        if category == "transit":
            allowed = ["solo_petrol", "solo_diesel", "ev_rideshare", "bus", "train", "active"]
            if choice not in allowed:
                raise ValueError(f"Choice '{choice}' is invalid for transit")
            if not (0.1 <= amount <= 1000.0):
                raise ValueError("distanceMiles (amount) must be between 0.1 and 1000.0")

        elif category == "food":
            allowed = ["beef_lamb", "pork_poultry", "vegetarian_fish", "vegan"]
            if choice not in allowed:
                raise ValueError(f"Choice '{choice}' is invalid for food")
            if not (1 <= amount <= 10):
                raise ValueError("servings (amount) must be an integer between 1 and 10")
            if amount != int(amount):
                raise ValueError("servings must be a whole number")

        elif category == "energy":
            allowed = ["ac_standard", "ac_eco", "fan_only", "ventilation"]
            if choice not in allowed:
                raise ValueError(f"Choice '{choice}' is invalid for energy")
            if not (0.1 <= amount <= 24.0):
                raise ValueError("hours (amount) must be between 0.1 and 24.0")

        elif category == "shopping":
            allowed = ["fast_fashion", "electronics_small", "second_hand", "groceries_typical"]
            if choice not in allowed:
                raise ValueError(f"Choice '{choice}' is invalid for shopping")
            if not (1 <= amount <= 50):
                raise ValueError("items (amount) must be an integer between 1 and 50")
            if amount != int(amount):
                raise ValueError("items must be a whole number")

        return self
