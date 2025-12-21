import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8000/api/v1"

async def main():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        print("1. Registering Owner...")
        owner_phone = "1111111111"
        owner_pass = "password"
        try:
            resp = await client.post("/auth/signup", json={
                "name": "Owner User",
                "phone": owner_phone,
                "password": owner_pass
            })
            if resp.status_code == 400 and "already registered" in resp.text:
                print("Owner already registered.")
            elif resp.status_code != 200:
                print(f"Failed to register owner: {resp.text}")
                return
        except Exception as e:
            print(f"Connection failed: {e}")
            return

        print("2. Logging in Owner...")
        resp = await client.post("/auth/login", json={
            "phone": owner_phone,
            "password": owner_pass
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")

        print("3. Creating Tribe...")
        resp = await client.post("/tribes/", json={"name": "Test Tribe"}, headers=headers)
        if resp.status_code != 200:
            print(f"Create tribe failed: {resp.text}")
            return
        
        data = resp.json()
        print(f"Create Tribe Response: {data}")
        tribe_id = data.get("id") or data.get("_id")
        print(f"Tribe created: {tribe_id}")

        print("4. Registering Friend (000000)...")
        friend_phone = "000000"
        try:
            resp = await client.post("/auth/signup", json={
                "name": "Friend User",
                "phone": friend_phone,
                "password": "password"
            })
            if resp.status_code == 400:
                print("Friend already registered.")
        except:
            pass

        print("5. Inviting Friend...")
        resp = await client.post(f"/tribes/{tribe_id}/invite", json={
            "phone_number": friend_phone,
            "trust_level": "direct"
        }, headers=headers)
        
        print(f"Invite Status: {resp.status_code}")
        print(f"Invite Response: {resp.text}")

if __name__ == "__main__":
    asyncio.run(main())