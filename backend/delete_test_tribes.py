import asyncio
import os
import sys

# Add the current directory to sys.path so we can import from db and config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import db

async def delete_test_tribes():
    print("Searching for tribes with name 'Test Tribe'...")
    # Find tribes with exact name "Test Tribe"
    tribes = await db.tribes.find({"name": "Test Tribe"}).to_list(None)
    
    if not tribes:
        print("No tribes found with name 'Test Tribe'.")
        return

    print(f"Found {len(tribes)} tribes. Deleting...")
    
    tribe_ids = [t["_id"] for t in tribes]
    
    # Delete tribes
    result_tribes = await db.tribes.delete_many({"_id": {"$in": tribe_ids}})
    print(f"Deleted {result_tribes.deleted_count} tribes.")
    
    # Delete memberships associated with these tribes
    # In backend/routers/tribes.py, tribe_id is stored as a string in memberships
    tribe_ids_str = [str(tid) for tid in tribe_ids]
    
    result_memberships = await db.tribe_memberships.delete_many({"tribe_id": {"$in": tribe_ids_str}})
    print(f"Deleted {result_memberships.deleted_count} memberships associated with these tribes.")

if __name__ == "__main__":
    # Fix for Windows asyncio loop policy
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(delete_test_tribes())