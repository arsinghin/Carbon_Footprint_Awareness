import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_unauthorized_endpoints():
    # Calling endpoints without auth header should fail with 401
    assert client.post("/api/v1/user/onboarding", json={}).status_code == 401
    assert client.get("/api/v1/user/insights").status_code == 401
    assert client.post("/api/v1/activities", json={}).status_code == 401
    assert client.get("/api/v1/activities").status_code == 401

def test_onboarding_success_and_validation():
    headers = {"Authorization": "Bearer mock-user-test1"}
    
    # Valid payload
    payload = {
        "transit": "solo_petrol",
        "diet": "high_meat",
        "energy": "ac_always"
    }
    response = client.post("/api/v1/user/onboarding", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Invalid choice in payload
    invalid_payload = {
        "transit": "rocket_ship",
        "diet": "high_meat",
        "energy": "ac_always"
    }
    response = client.post("/api/v1/user/onboarding", json=invalid_payload, headers=headers)
    assert response.status_code == 422

def test_activity_logging_validation():
    headers = {"Authorization": "Bearer mock-user-test2"}

    # Preseed onboarding to establish base
    client.post("/api/v1/user/onboarding", json={
        "transit": "solo_petrol",
        "diet": "high_meat",
        "energy": "ac_always"
    }, headers=headers)

    # Valid transit log
    response = client.post("/api/v1/activities", json={
        "category": "transit",
        "selectedChoice": "train",
        "amount": 15.0
    }, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert "activityId" in data
    assert data["carbonGrams"] == 600.0  # 15 miles * 40g/mile
    assert data["savedGrams"] == 3450.0   # (15 * 270) - 600

    # Invalid range: transit distance too large
    response = client.post("/api/v1/activities", json={
        "category": "transit",
        "selectedChoice": "train",
        "amount": 5000.0
    }, headers=headers)
    assert response.status_code == 422

    # Invalid range: food servings not integer
    response = client.post("/api/v1/activities", json={
        "category": "food",
        "selectedChoice": "vegan",
        "amount": 1.5
    }, headers=headers)
    assert response.status_code == 422
