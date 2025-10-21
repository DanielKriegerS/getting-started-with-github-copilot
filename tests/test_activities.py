from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Should contain at least one activity from the seeded data
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "teststudent@mergington.edu"

    # Ensure email not already present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail
    resp_dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_dup.status_code == 400

    # Unregister
    resp_un = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert resp_un.status_code == 200
    assert email not in activities[activity]["participants"]

    # Unregistering again should give 404
    resp_un2 = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert resp_un2.status_code == 404
