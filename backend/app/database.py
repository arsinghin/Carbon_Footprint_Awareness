import os
import threading
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.config import settings

class BaseRepository:
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError()
    def create_or_update_user_profile(self, user_id: str, data: Dict[str, Any]) -> None:
        raise NotImplementedError()
    def log_activity(self, activity_data: Dict[str, Any]) -> None:
        raise NotImplementedError()
    def get_user_activities(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        raise NotImplementedError()
    def get_emission_factors(self) -> List[Dict[str, Any]]:
        raise NotImplementedError()

class MockMemoryRepository(BaseRepository):
    def __init__(self):
        self._lock = threading.Lock()
        self._users: Dict[str, Dict[str, Any]] = {}
        self._activities: List[Dict[str, Any]] = []
        self._init_mock_data()

    def _init_mock_data(self):
        # Preseed dynamic test profiles if needed
        pass

    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._users.get(user_id)

    def create_or_update_user_profile(self, user_id: str, data: Dict[str, Any]) -> None:
        with self._lock:
            if user_id not in self._users:
                self._users[user_id] = {
                    "userId": user_id,
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "baseline": {
                        "transit": "solo_petrol",
                        "diet": "high_meat",
                        "energy": "ac_always"
                    },
                    "weeklyChallenge": {
                        "challengeId": "transit_swap",
                        "activatedAt": datetime.now(timezone.utc).isoformat(),
                        "targetSwaps": 2,
                        "completedSwaps": 0
                    },
                    "streak": {
                        "current": 0,
                        "lastLoggedDate": ""
                    },
                    "cumulativeSavedKg": 0.0
                }
            self._users[user_id].update(data)

    def log_activity(self, activity_data: Dict[str, Any]) -> None:
        with self._lock:
            self._activities.append(activity_data)

    def get_user_activities(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        with self._lock:
            user_logs = [a for a in self._activities if a.get("userId") == user_id]
            # Sort by timestamp descending
            user_logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return user_logs[offset:offset + limit]

    def get_emission_factors(self) -> List[Dict[str, Any]]:
        from app.logic import EMISSION_FACTORS
        factors = []
        for cat, choices in EMISSION_FACTORS.items():
            for choice, val in choices.items():
                factors.append({
                    "category": cat,
                    "choiceKey": choice,
                    "unit": "miles" if cat == "transit" else "servings" if cat == "food" else "hours" if cat == "energy" else "items",
                    "co2eGramsPerUnit": val,
                    "lastUpdated": datetime.now(timezone.utc).isoformat()
                })
        return factors

class FirestoreRepository(BaseRepository):
    def __init__(self):
        from google.cloud import firestore
        # Initialize Google Cloud Firestore Client
        self.db = firestore.Client(project=settings.FIRESTORE_PROJECT_ID)

    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection("users").document(user_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    def create_or_update_user_profile(self, user_id: str, data: Dict[str, Any]) -> None:
        ref = self.db.collection("users").document(user_id)
        if not ref.get().exists:
            # Seed default values for new document
            initial = {
                "userId": user_id,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "baseline": {
                    "transit": "solo_petrol",
                    "diet": "high_meat",
                    "energy": "ac_always"
                },
                "weeklyChallenge": {
                    "challengeId": "transit_swap",
                    "activatedAt": datetime.now(timezone.utc).isoformat(),
                    "targetSwaps": 2,
                    "completedSwaps": 0
                },
                "streak": {
                    "current": 0,
                    "lastLoggedDate": ""
                },
                "cumulativeSavedKg": 0.0
            }
            ref.set(initial)
        ref.update(data)

    def log_activity(self, activity_data: Dict[str, Any]) -> None:
        # Write to activities collection
        activity_id = activity_data.get("activityId")
        self.db.collection("activities").document(activity_id).set(activity_data)

    def get_user_activities(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        # Query Firestore
        query = (
            self.db.collection("activities")
            .where("userId", "==", user_id)
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .offset(offset)
        )
        return [doc.to_dict() for doc in query.stream()]

    def get_emission_factors(self) -> List[Dict[str, Any]]:
        docs = self.db.collection("emission_factors").stream()
        factors = [doc.to_dict() for doc in docs]
        
        # If firestore DB has not been seeded yet, return logical defaults
        if not factors:
            from app.logic import EMISSION_FACTORS
            for cat, choices in EMISSION_FACTORS.items():
                for choice, val in choices.items():
                    data = {
                        "category": cat,
                        "choiceKey": choice,
                        "unit": "miles" if cat == "transit" else "servings" if cat == "food" else "hours" if cat == "energy" else "items",
                        "co2eGramsPerUnit": val,
                        "lastUpdated": datetime.now(timezone.utc).isoformat()
                    }
                    self.db.collection("emission_factors").document(f"{cat}_{choice}").set(data)
                    factors.append(data)
        return factors

# Global repository instance
if settings.USE_MOCK_FIRESTORE:
    db_repository = MockMemoryRepository()
else:
    db_repository = FirestoreRepository()
