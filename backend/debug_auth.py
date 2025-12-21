import asyncio
from db import db
from auth import get_password_hash
from models import UserInDB, UserCreate

async def test_auth_logic():
    print("Testing password hashing...")
    try:
        pwd = "password123"
        hashed = get_password_hash(pwd)
        print(f"Hashing successful: {hashed[:10]}...")
    except Exception as e:
        print(f"Hashing failed: {e}")
        import traceback
        traceback.print_exc()
        return

    print("Testing DB insertion...")
    try:
        # Check connection
        await db.list_collection_names()
        print("DB connection successful")
        
        user_in_db = UserInDB(
            name="Debug User",
            phone="0000000000",
            hashed_password=hashed
        )
        print("Model created:", user_in_db)
        
        # Cleanup
        await db.users.delete_one({"phone": "0000000000"})
        
        # Insert
        result = await db.users.insert_one(user_in_db.model_dump(by_alias=True, exclude={"id"}))
        print(f"User inserted with ID: {result.inserted_id}")
        
        # Cleanup
        await db.users.delete_one({"_id": result.inserted_id})
        print("Cleanup successful")
        
    except Exception as e:
        print(f"DB Operation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_auth_logic())