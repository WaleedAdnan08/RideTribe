import asyncio
import os
import sys

# Add the current directory to sys.path so we can import from db and config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db import db

async def reset_db():
    collections = [
        "users", 
        "tribes", 
        "tribe_memberships", 
        "schedules", 
        "destinations", 
        "matches", 
        "notifications", 
        "pending_invites"
    ]
    
    print("Starting database reset...")
    
    for collection_name in collections:
        try:
            collection = getattr(db, collection_name)
            result = await collection.delete_many({})
            print(f"Deleted {result.deleted_count} documents from '{collection_name}' collection.")
        except Exception as e:
            print(f"Error deleting from '{collection_name}': {e}")
            
    print("Database reset complete.")

if __name__ == "__main__":
    # Fix for Windows asyncio loop policy
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(reset_db())