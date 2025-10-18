from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # make a shallow copy of initial state and restore after each test
    original = {k: {**v, 'participants': list(v['participants'])} for k,v in activities.items()}
    yield
    activities.clear()
    activities.update(original)

def test_get_activities():
    res = client.get('/activities')
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert 'Chess Club' in data

def test_signup_and_unregister_flow():
    activity = 'Chess Club'
    email = 'pytest.user@mergington.edu'

    # ensure not present
    assert email not in activities[activity]['participants']

    # sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert 'Signed up' in res.json().get('message', '')
    assert email in activities[activity]['participants']

    # can't sign up twice
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 400

    # unregister
    res = client.post(f"/activities/{activity}/unregister?email={email}")
    assert res.status_code == 200
    assert email not in activities[activity]['participants']

# unregistering again fails
res = client.post(f"/activities/{activity}/unregister?email={email}")
assert res.status_code == 400