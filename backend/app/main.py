import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Query, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.auth import verify_token
from app.database import db_repository
from app.schemas import OnboardingRequest, ActivityLogRequest
from app.logic import (
    calculate_emissions,
    calculate_new_streak,
    generate_nudges,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

# Initialize slowapi rate limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/v1/user/onboarding", status_code=status.HTTP_200_OK)
@limiter.limit("60/minute")
def complete_onboarding(
    request: Request,
    payload: OnboardingRequest,
    user_id: str = Depends(verify_token)
):
    profile_update = {
        "baseline": {
            "transit": payload.transit,
            "diet": payload.diet,
            "energy": payload.energy
        }
    }
    db_repository.create_or_update_user_profile(user_id, profile_update)
    return {"status": "success", "message": "Onboarding completed successfully"}

@app.get("/api/v1/user/insights")
@limiter.limit("60/minute")
def get_insights(request: Request, user_id: str = Depends(verify_token)):
    profile = db_repository.get_user_profile(user_id)
    if not profile:
        # Preseed dynamic new profile
        db_repository.create_or_update_user_profile(user_id, {})
        profile = db_repository.get_user_profile(user_id)
        
    activities = db_repository.get_user_activities(user_id, limit=50)
    nudges = generate_nudges(activities, profile.get("baseline", {}))
    
    # Calculate trees grown based on 12 kg saved CO2e per tree
    cumulative_saved = profile.get("cumulativeSavedKg", 0.0)
    trees_grown = int(cumulative_saved / 12.0)
    
    return {
        "streak": profile.get("streak", {}).get("current", 0),
        "weeklyChallenge": profile.get("weeklyChallenge", {}),
        "savedKg": round(cumulative_saved, 1),
        "treesGrown": trees_grown,
        "nudges": nudges
    }

@app.post("/api/v1/activities", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def log_activity(
    request: Request,
    payload: ActivityLogRequest,
    user_id: str = Depends(verify_token)
):
    profile = db_repository.get_user_profile(user_id)
    if not profile:
        db_repository.create_or_update_user_profile(user_id, {})
        profile = db_repository.get_user_profile(user_id)

    user_baseline = profile.get("baseline", {})
    calc = calculate_emissions(
        category=payload.category,
        selected_choice=payload.selectedChoice,
        amount=payload.amount,
        user_baseline=user_baseline
    )

    # Activity payload schema
    activity_id = str(uuid.uuid4())
    log_time = payload.timestamp or datetime.now(timezone.utc)
    log_date_str = log_time.strftime("%Y-%m-%d")

    activity_doc = {
        "activityId": activity_id,
        "userId": user_id,
        "timestamp": log_time.isoformat(),
        "category": payload.category,
        "selectedChoice": payload.selectedChoice,
        "baselineEquivalentChoice": calc["baselineEquivalentChoice"],
        "carbonGrams": calc["carbonGrams"],
        "baselineCarbonGrams": calc["baselineCarbonGrams"],
        "savedGrams": calc["savedGrams"],
        "contextEquivalence": calc["contextEquivalence"]
    }
    db_repository.log_activity(activity_doc)

    # Calculate and update streaks + cumulative savings
    saved_kg = calc["savedGrams"] / 1000.0
    new_cumulative = profile.get("cumulativeSavedKg", 0.0) + saved_kg
    
    last_logged = profile.get("streak", {}).get("lastLoggedDate", "")
    current_streak = profile.get("streak", {}).get("current", 0)
    new_streak = calculate_new_streak(last_logged, current_streak, log_date_str)

    profile_update = {
        "cumulativeSavedKg": round(new_cumulative, 1),
        "streak": {
            "current": new_streak,
            "lastLoggedDate": log_date_str
        }
    }
    db_repository.create_or_update_user_profile(user_id, profile_update)

    # Check if this qualifies as a challenge update
    challenge = profile.get("weeklyChallenge", {})
    if challenge and challenge.get("challengeId") == "transit_swap" and payload.category == "transit":
        # Any low carbon choice counts as completed swap
        if payload.selectedChoice in ["ev_rideshare", "bus", "train", "active"]:
            completed = challenge.get("completedSwaps", 0) + 1
            db_repository.create_or_update_user_profile(user_id, {
                "weeklyChallenge": {
                    **challenge,
                    "completedSwaps": completed
                }
            })

    # Return required response format
    return {
        "activityId": activity_id,
        "carbonGrams": calc["carbonGrams"],
        "savedGrams": calc["savedGrams"],
        "streakUpdated": new_streak > current_streak,
        "forestProgress": calc["forestProgress"]
    }

@app.get("/api/v1/activities")
@limiter.limit("60/minute")
def get_activities(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user_id: str = Depends(verify_token)
):
    activities = db_repository.get_user_activities(user_id, limit=limit, offset=offset)
    return activities

@app.get("/api/v1/emission_factors")
@limiter.limit("60/minute")
def get_emission_factors(request: Request):
    return db_repository.get_emission_factors()
