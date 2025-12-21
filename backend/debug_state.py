import asyncio
from db import db
from bson import ObjectId
import json
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

async def dump_state():
    print("=== DEBUG STATE DUMP ===")
    
    # 1. Users
    users = await db.users.find().to_list(100)
    print(f"\n--- USERS ({len(users)}) ---")
    for u in users:
        print(f"ID: {u['_id']}, Name: {u.get('name')}, Phone: {u.get('phone')}")

    # 2. Tribes
    tribes = await db.tribes.find().to_list(100)
    print(f"\n--- TRIBES ({len(tribes)}) ---")
    for t in tribes:
        print(f"ID: {t['_id']}, Name: {t.get('name')}, Owner: {t.get('owner_id')}")

    # 3. Memberships
    memberships = await db.tribe_memberships.find().to_list(100)
    print(f"\n--- MEMBERSHIPS ({len(memberships)}) ---")
    for m in memberships:
        print(f"Tribe: {m['tribe_id']}, User: {m['user_id']}, Status: {m.get('status')}")

    # 4. Destinations
    destinations = await db.destinations.find().to_list(100)
    print(f"\n--- DESTINATIONS ({len(destinations)}) ---")
    for d in destinations:
        print(f"ID: {d['_id']}, Name: {d.get('name')}, PlaceID: {d.get('google_place_id')}, Creator: {d.get('created_by')}")

    # 5. Schedules
    schedules = await db.schedules.find().to_list(100)
    print(f"\n--- SCHEDULES ({len(schedules)}) ---")
    for s in schedules:
        print(f"ID: {s['_id']}, User: {s['user_id']}, Dest: {s['destination_id']}, Time: {s.get('pickup_time')}, Status: {s.get('status')}")

    # 6. Matches
    matches = await db.matches.find().to_list(100)
    print(f"\n--- MATCHES ({len(matches)}) ---")
    for m in matches:
        print(f"ID: {m['_id']}, Req: {m['requester_id']}, Prov: {m['provider_id']}, Score: {m.get('match_score')}, Status: {m.get('status')}")

    print("\n=== END DUMP ===")

if __name__ == "__main__":
    asyncio.run(dump_state())