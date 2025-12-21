from datetime import datetime, timedelta
from bson import ObjectId
from db import db
from models import RideMatchInDB

async def find_and_create_matches(schedule_id: str):
    """
    Background task to find matching schedules for a new schedule entry.
    """
    # 1. Get the new schedule
    new_schedule = await db.schedules.find_one({"_id": ObjectId(schedule_id)})
    if not new_schedule:
        return

    user_id = new_schedule["user_id"]
    destination_id = new_schedule["destination_id"]
    pickup_time = new_schedule.get("pickup_time")
    
    if not pickup_time:
        # If no specific time (e.g. only date or loose recurrence), matching might be harder.
        # For MVP, let's assume specific pickup_time is key for matching.
        return

    # 2. Find tribes the user belongs to
    user_memberships = await db.tribe_memberships.find({"user_id": user_id}).to_list(100)
    tribe_ids = [m["tribe_id"] for m in user_memberships]
    
    if not tribe_ids:
        return

    # 3. Find other members in these tribes (potential providers/peers)
    # We want unique user IDs that are NOT the current user
    tribe_memberships = await db.tribe_memberships.find({
        "tribe_id": {"$in": tribe_ids},
        "user_id": {"$ne": user_id}
    }).to_list(1000)
    
    potential_partner_ids = list(set([m["user_id"] for m in tribe_memberships]))
    
    if not potential_partner_ids:
        return

    # 4. Find matching schedules from these partners
    # Criteria:
    # - Same destination
    # - Pickup time within +/- 15 minutes
    # - Status active
    
    time_window = timedelta(minutes=15)
    min_time = pickup_time - time_window
    max_time = pickup_time + time_window
    
    matching_schedules = await db.schedules.find({
        "user_id": {"$in": potential_partner_ids},
        "destination_id": destination_id,
        "pickup_time": {"$gte": min_time, "$lte": max_time},
        "status": "active"
    }).to_list(100)
    
    # 5. Create Match records
    for match_schedule in matching_schedules:
        # Check if match already exists to avoid duplicates
        # We check both directions to ensure we don't create duplicate pairings for the same event
        existing_match = await db.matches.find_one({
            "$or": [
                {
<<<<<<< HEAD
                    "requester_id": user_id,
                    "provider_id": match_schedule["user_id"],
                    "schedule_entry_id": schedule_id,
                    "provider_schedule_id": str(match_schedule["_id"])
                },
                {
                    "requester_id": match_schedule["user_id"],
                    "provider_id": user_id,
                    "schedule_entry_id": str(match_schedule["_id"]),
=======
                    "requester_id": user_id, 
                    "provider_id": match_schedule["user_id"], 
                    "schedule_entry_id": ObjectId(schedule_id),
                    "provider_schedule_id": str(match_schedule["_id"])
                },
                {
                    "requester_id": match_schedule["user_id"], 
                    "provider_id": user_id, 
                    "schedule_entry_id": match_schedule["_id"],
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9
                    "provider_schedule_id": str(schedule_id)
                }
            ]
        })
        
        if existing_match:
            continue
            
        # Create match suggestion
        match_in_db = RideMatchInDB(
            requester_id=user_id,
            provider_id=match_schedule["user_id"],
<<<<<<< HEAD
            schedule_entry_id=schedule_id,
=======
            schedule_entry_id=ObjectId(schedule_id),
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9
            provider_schedule_id=str(match_schedule["_id"]),
            match_score=95, # Mock score for MVP
            status="suggested"
        )
        
        await db.matches.insert_one(match_in_db.model_dump(by_alias=True, exclude={"id"}))