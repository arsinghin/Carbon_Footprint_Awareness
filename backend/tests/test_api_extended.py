import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

HEADERS = {"Authorization": "Bearer mock-user-insights-test"}

def test_security_headers_present():
    """All required security headers are present on every response."""
    response = client.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_insights_returns_weekly_challenge():
    """GET /api/v1/user/insights must include weeklyChallenge object."""
    response = client.get("/api/v1/user/insights", headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "weeklyChallenge" in data
    assert "challengeId" in data["weeklyChallenge"]
    assert "targetSwaps" in data["weeklyChallenge"]
    assert "completedSwaps" in data["weeklyChallenge"]


def test_insights_includes_nudges():
    """GET /api/v1/user/insights must include a non-empty nudges list."""
    response = client.get("/api/v1/user/insights", headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "nudges" in data
    assert isinstance(data["nudges"], list)
    assert len(data["nudges"]) >= 1


def test_insights_nudges_have_required_fields():
    """Each nudge must contain 'type' and 'text'."""
    response = client.get("/api/v1/user/insights", headers=HEADERS)
    nudges = response.json().get("nudges", [])
    for nudge in nudges:
        assert "type" in nudge
        assert "text" in nudge
        assert isinstance(nudge["text"], str)
        assert len(nudge["text"]) > 0


def test_challenge_updated_after_low_carbon_transit():
    """Logging a low-carbon transit choice increments challenge completedSwaps."""
    headers = {"Authorization": "Bearer mock-user-challenge-update"}
    # Onboard first
    client.post("/api/v1/user/onboarding", json={
        "transit": "solo_petrol", "diet": "high_meat", "energy": "ac_always"
    }, headers=headers)

    before = client.get("/api/v1/user/insights", headers=headers).json()
    before_swaps = before["weeklyChallenge"].get("completedSwaps", 0)

    # Log a low-carbon transit trip
    client.post("/api/v1/activities", json={
        "category": "transit", "selectedChoice": "train", "amount": 10.0
    }, headers=headers)

    after = client.get("/api/v1/user/insights", headers=headers).json()
    after_swaps = after["weeklyChallenge"].get("completedSwaps", 0)

    assert after_swaps == before_swaps + 1


def test_challenge_not_updated_for_solo_drive():
    """Logging a solo petrol drive does NOT increment challenge completedSwaps."""
    headers = {"Authorization": "Bearer mock-user-no-challenge"}
    client.post("/api/v1/user/onboarding", json={
        "transit": "solo_petrol", "diet": "high_meat", "energy": "ac_always"
    }, headers=headers)

    before = client.get("/api/v1/user/insights", headers=headers).json()
    before_swaps = before["weeklyChallenge"].get("completedSwaps", 0)

    client.post("/api/v1/activities", json={
        "category": "transit", "selectedChoice": "solo_petrol", "amount": 10.0
    }, headers=headers)

    after = client.get("/api/v1/user/insights", headers=headers).json()
    after_swaps = after["weeklyChallenge"].get("completedSwaps", 0)

    assert after_swaps == before_swaps


def test_activity_log_returns_enriched_fields():
    """POST /api/v1/activities response includes forestProgress and streakUpdated."""
    headers = {"Authorization": "Bearer mock-user-enriched"}
    client.post("/api/v1/user/onboarding", json={
        "transit": "solo_petrol", "diet": "high_meat", "energy": "ac_always"
    }, headers=headers)
    response = client.post("/api/v1/activities", json={
        "category": "transit", "selectedChoice": "bus", "amount": 5.0
    }, headers=headers)
    data = response.json()
    assert "forestProgress" in data
    assert "streakUpdated" in data
    assert isinstance(data["forestProgress"], float)
    assert isinstance(data["streakUpdated"], bool)


def test_emission_factors_endpoint():
    """GET /api/v1/emission_factors returns a non-empty list with required fields."""
    headers = {"Authorization": "Bearer mock-user-factors"}
    response = client.get("/api/v1/emission_factors", headers=headers)
    assert response.status_code == 200
    factors = response.json()
    assert isinstance(factors, list)
    assert len(factors) > 0
    for f in factors:
        assert "category" in f
        assert "choiceKey" in f
        assert "co2eGramsPerUnit" in f
