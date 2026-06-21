"""Tests for database repository layer — deep merge correctness and thread safety."""
from app.database import MockMemoryRepository


def test_deep_merge_preserves_nested_keys():
    """Updating 'streak.current' should not delete 'streak.lastLoggedDate'."""
    repo = MockMemoryRepository()
    repo.create_or_update_user_profile("user-dm-1", {})
    
    # Set a full streak object
    repo.create_or_update_user_profile("user-dm-1", {
        "streak": {"current": 5, "lastLoggedDate": "2026-06-20"}
    })
    
    # Update only the current streak field
    repo.create_or_update_user_profile("user-dm-1", {
        "streak": {"current": 6}
    })
    
    profile = repo.get_user_profile("user-dm-1")
    assert profile["streak"]["current"] == 6
    # lastLoggedDate must still be present — shallow update would have deleted it
    assert profile["streak"]["lastLoggedDate"] == "2026-06-20"


def test_deep_merge_preserves_baseline_on_cumulative_update():
    """Updating cumulativeSavedKg must not wipe out baseline dict."""
    repo = MockMemoryRepository()
    repo.create_or_update_user_profile("user-dm-2", {
        "baseline": {"transit": "active", "diet": "vegan", "energy": "ventilation"}
    })
    
    repo.create_or_update_user_profile("user-dm-2", {"cumulativeSavedKg": 15.0})
    
    profile = repo.get_user_profile("user-dm-2")
    assert profile["cumulativeSavedKg"] == 15.0
    assert profile["baseline"]["transit"] == "active"
    assert profile["baseline"]["diet"] == "vegan"


def test_activity_ordering():
    """Activities should be returned newest-first."""
    repo = MockMemoryRepository()
    repo.log_activity({"userId": "u1", "activityId": "a1", "timestamp": "2026-06-19T10:00:00"})
    repo.log_activity({"userId": "u1", "activityId": "a2", "timestamp": "2026-06-21T10:00:00"})
    repo.log_activity({"userId": "u1", "activityId": "a3", "timestamp": "2026-06-20T10:00:00"})
    
    logs = repo.get_user_activities("u1", limit=10)
    assert logs[0]["activityId"] == "a2"  # newest
    assert logs[2]["activityId"] == "a1"  # oldest


def test_activity_pagination():
    """Offset and limit correctly page through results."""
    repo = MockMemoryRepository()
    for i in range(5):
        repo.log_activity({"userId": "u2", "activityId": f"a{i}", "timestamp": f"2026-06-{20+i}T10:00:00"})
    
    page1 = repo.get_user_activities("u2", limit=2, offset=0)
    page2 = repo.get_user_activities("u2", limit=2, offset=2)
    
    assert len(page1) == 2
    assert len(page2) == 2
    assert page1[0]["activityId"] != page2[0]["activityId"]


def test_user_isolation():
    """Activities of different users should not leak across queries."""
    repo = MockMemoryRepository()
    repo.log_activity({"userId": "alice", "activityId": "a1", "timestamp": "2026-06-21T10:00:00"})
    repo.log_activity({"userId": "bob", "activityId": "b1", "timestamp": "2026-06-21T10:00:00"})
    
    alice_logs = repo.get_user_activities("alice")
    bob_logs = repo.get_user_activities("bob")
    
    assert len(alice_logs) == 1
    assert alice_logs[0]["activityId"] == "a1"
    assert len(bob_logs) == 1
    assert bob_logs[0]["activityId"] == "b1"
