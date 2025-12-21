import requests
import json
import random
import string
<<<<<<< HEAD
import time
from datetime import datetime, timedelta
=======
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9

BASE_URL = "http://127.0.0.1:8000/api/v1"

def generate_random_phone():
    return ''.join(random.choices(string.digits, k=10))

def test_health():
    print("Testing Health Check...")
    try:
        response = requests.get(f"http://127.0.0.1:8000/api/v1/healthz")
        if response.status_code == 200:
            print("Health Check Passed:", response.json())
            return True
        else:
            print("Health Check Failed:", response.status_code, response.text)
            return False
    except Exception as e:
        print("Health Check Failed with connection error:", e)
        return False

<<<<<<< HEAD
def test_signup(phone, name="Test User"):
    # print(f"\nTesting Signup for phone {phone}...")
    payload = {
        "name": name,
=======
def test_signup(phone):
    print(f"\nTesting Signup for phone {phone}...")
    payload = {
        "name": "Test User",
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9
        "phone": phone,
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/signup", json=payload)
    if response.status_code == 200:
<<<<<<< HEAD
        # print("Signup Passed:", response.json().get("user"))
=======
        print("Signup Passed:", response.json().get("user"))
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9
        return response.json()
    else:
        print("Signup Failed:", response.status_code, response.text)
        return None

<<<<<<< HEAD
def test_create_tribe(token):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Matching Tribe"
    }
    response = requests.post(f"{BASE_URL}/tribes/", json=payload, headers=headers)
    if response.status_code == 200:
        return response.json().get("_id")
    return None

def test_invite_member(token, tribe_id, phone_to_invite):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "phone_number": phone_to_invite,
        "trust_level": "direct"
    }
    response = requests.post(f"{BASE_URL}/tribes/{tribe_id}/invite", json=payload, headers=headers)
    return response.status_code == 200

def test_create_destination(token, name="Match School"):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": name,
        "address": "123 Match Lane",
=======
def test_login(phone):
    print(f"\nTesting Login for phone {phone}...")
    payload = {
        "phone": phone,
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    if response.status_code == 200:
        print("Login Passed")
        return response.json().get("access_token")
    else:
        print("Login Failed:", response.status_code, response.text)
        return None

def test_create_destination(token):
    print("\nTesting Create Destination...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Test School",
        "address": "123 School Lane",
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9
        "category": "school",
        "geo": {"lat": 40.7128, "lng": -74.0060}
    }
    response = requests.post(f"{BASE_URL}/destinations/", json=payload, headers=headers)
    if response.status_code == 201:
<<<<<<< HEAD
        return response.json().get("_id")
    return None

def test_create_schedule(token, destination_id, pickup_time, child_name="Child"):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "child_name": child_name,
        "destination_id": destination_id,
        "pickup_time": pickup_time,
        "recurrence": "daily",
        "status": "active"
    }
    response = requests.post(f"{BASE_URL}/schedules/", json=payload, headers=headers)
    if response.status_code == 201:
        return response.json().get("_id")
    else:
        print("Create Schedule Failed", response.text)
        return None

def test_list_matches(token):
    print("\nTesting List Matches...")
    headers = {"Authorization": f"Bearer {token}"}
    # Wait a bit for background task
    time.sleep(2) 
    response = requests.get(f"{BASE_URL}/matches/", headers=headers)
    if response.status_code == 200:
        matches = response.json()
        print(f"List Matches Passed. Count: {len(matches)}")
        for m in matches:
            print(f"MATCH FOUND: {m['requester']['name']} <-> {m['provider']['name']} for {m['schedule']['destination']['name']}")
        return matches
    else:
        print("List Matches Failed:", response.status_code, response.text)
        return None

def run_matching_test():
    print("\n=== STARTING MATCHING LOGIC TEST ===")
    if not test_health():
        return

    # 1. Create User A (Owner/Requester)
    phone_a = generate_random_phone()
    print(f"Creating User A: {phone_a}")
    auth_a = test_signup(phone_a, "Alice (Owner)")
    token_a = auth_a['access_token']

    # 2. Create User B (Member/Provider)
    phone_b = generate_random_phone()
    print(f"Creating User B: {phone_b}")
    auth_b = test_signup(phone_b, "Bob (Member)")
    token_b = auth_b['access_token']

    # 3. User A creates Tribe
    print("User A creating Tribe...")
    tribe_id = test_create_tribe(token_a)
    print(f"Tribe Created: {tribe_id}")

    # 4. User A invites User B
    print("User A inviting User B...")
    test_invite_member(token_a, tribe_id, phone_b)
    print("User B invited.")

    # 5. User A creates Destination
    print("User A creating Destination...")
    dest_id = test_create_destination(token_a)
    print(f"Destination Created: {dest_id}")

    # 6. Setup Time
    match_time = (datetime.utcnow() + timedelta(days=2)).replace(hour=8, minute=0, second=0, microsecond=0)
    match_time_iso = match_time.isoformat()

    # 7. User A creates Schedule (Needs ride)
    print("User A creating Schedule...")
    sched_a = test_create_schedule(token_a, dest_id, match_time_iso, "Alice's Kid")
    print(f"Schedule A Created: {sched_a}")

    # 8. User B creates Schedule (Can provide ride - implicitly by having same schedule)
    # Note: User B needs the same destination ID. 
    # In a real app, User B would select the same google place or address. 
    # For this test, we assume they somehow picked the same Destination ID (shared DB) or created a duplicate.
    # The matching logic currently matches by `destination_id`.
    # So User B needs to use `dest_id`. 
    # BUT, destinations are usually private to the creator in this MVP unless shared via Tribe?
    # Let's check `routers/destinations.py`... 
    # It lists `created_by`. 
    # `routers/schedules.py` checks if destination exists.
    # Users can technically use any destination ID if they know it.
    # Ideally, User B should have their own destination object with same geocode/address.
    # BUT `matching.py` matches on `destination_id` equality: ` "destination_id": destination_id`
    # This implies destinations must be SHARED entities or copies with SAME ID.
    # Let's verify `matching.py`:
    # line 55: "destination_id": destination_id
    # Yes, it looks for EXACT match on destination ID.
    # So User B must use the SAME destination object created by User A.
    
    print("User B creating Schedule (Matching)...")
    sched_b = test_create_schedule(token_b, dest_id, match_time_iso, "Bob's Kid")
    print(f"Schedule B Created: {sched_b}")

    # 9. Check for matches
    # Matches should be found for both
    test_list_matches(token_a)
    test_list_matches(token_b)

if __name__ == "__main__":
    run_matching_test()
=======
        print("Create Destination Passed:", response.json().get("_id"))
        return response.json().get("_id")
    else:
        print("Create Destination Failed:", response.status_code, response.text)
        return None

def test_create_tribe(token):
    print("\nTesting Create Tribe...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Test Tribe"
    }
    response = requests.post(f"{BASE_URL}/tribes/", json=payload, headers=headers)
    if response.status_code == 200:
        print("Create Tribe Passed:", response.json().get("_id"))
        return response.json().get("_id")
    else:
        print("Create Tribe Failed:", response.status_code, response.text)
        return None

def test_create_schedule(token, destination_id):
    print("\nTesting Create Schedule...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "child_name": "Junior",
        "destination_id": destination_id,
        "recurrence": "daily",
        "status": "active"
    }
    # Using a future date for pickup_time if needed, but the model says Optional
    # Let's add a time just in case logic depends on it
    from datetime import datetime, timedelta
    tomorrow = datetime.utcnow() + timedelta(days=1)
    payload["pickup_time"] = tomorrow.isoformat()

    response = requests.post(f"{BASE_URL}/schedules/", json=payload, headers=headers)
    if response.status_code == 201:
        print("Create Schedule Passed:", response.json().get("_id"))
        return response.json().get("_id")
    else:
        print("Create Schedule Failed:", response.status_code, response.text)
        return None

def run_tests():
    if not test_health():
        return

    phone = generate_random_phone()
    auth_data = test_signup(phone)
    
    if auth_data:
        token = auth_data.get("access_token")
        
        # Test Login separately (optional since signup returns token, but good to verify)
        login_token = test_login(phone)
        
        if token:
            dest_id = test_create_destination(token)
            tribe_id = test_create_tribe(token)
            
            if dest_id:
                test_create_schedule(token, dest_id)

if __name__ == "__main__":
    run_tests()
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9
