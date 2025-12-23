from datetime import datetime, timedelta
from bson import ObjectId
from db import db
from models import RideMatchInDB, NotificationInDB

def calculate_trust_score(trust_level: str) -> int:
    if trust_level == "direct":
        return 100
    elif trust_level == "activity-specific":
        return 80
    elif trust_level == "emergency-only":
        return 60
    return 50

async def find_and_create_matches(schedule_id: str):
    """
    Background task to find matching schedules for a new schedule entry.
    """
    # 1. Get the new schedule
    new_schedule = await db.schedules.find_one({"_id": ObjectId(schedule_id)})
    if not new_schedule:
        return

    user_id = new_schedule["user_id"]
    requester_user = await db.users.find_one({"_id": user_id})
    if not requester_user:
        return
    destination_id = new_schedule["destination_id"]
    pickup_time = new_schedule.get("pickup_time")
    
    if not pickup_time:
        return

    # Fetch destination to check for google_place_id
    destination = await db.destinations.find_one({"_id": ObjectId(destination_id)})
    if not destination:
        print(f"Destination {destination_id} not found")
        return

    # Find all compatible destination IDs (same place)
    target_destination_ids = [destination_id]
    
    if destination.get("google_place_id"):
        # 1. Try matching by Google Place ID
        same_place_dests = await db.destinations.find({
            "google_place_id": destination["google_place_id"]
        }).to_list(100)
        target_destination_ids = [str(d["_id"]) for d in same_place_dests]
    else:
        # 2. Fallback: Match by Name (for manual entries or when Place ID is missing)
        # This allows "School" matches even if created manually by different users
        same_place_dests = await db.destinations.find({
            "name": destination["name"]
        }).to_list(100)
        target_destination_ids = [str(d["_id"]) for d in same_place_dests]

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
        "destination_id": {"$in": target_destination_ids},
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
                    "requester_id": user_id, 
                    "provider_id": match_schedule["user_id"], 
                    "schedule_entry_id": schedule_id,
                    "provider_schedule_id": str(match_schedule["_id"])
                },
                {
                    "requester_id": match_schedule["user_id"], 
                    "provider_id": user_id, 
                    "schedule_entry_id": str(match_schedule["_id"]),
                    "provider_schedule_id": str(schedule_id)
                }
            ]
        })
        
        if existing_match:
            continue
            
        # Calculate Trust Score
        provider_id = match_schedule["user_id"]
        # Find membership for this provider in the tribes we are looking at
        # We want the highest trust level if multiple exist
        trust_score = 50
        for m in tribe_memberships:
            if m["user_id"] == provider_id:
                score = calculate_trust_score(m.get("trust_level", ""))
                if score > trust_score:
                    trust_score = score

        # Create match suggestion
        match_in_db = RideMatchInDB(
            requester_id=user_id,
            provider_id=provider_id,
            schedule_entry_id=schedule_id,
            provider_schedule_id=str(match_schedule["_id"]),
            match_score=trust_score,
            status="suggested"
        )
        
        result = await db.matches.insert_one(match_in_db.model_dump(by_alias=True, exclude={"id"}))
        match_id = str(result.inserted_id)

        # Create Notifications
        
        # 1. Notify Requester (Current User)
        provider_user = await db.users.find_one({"_id": provider_id})
        provider_name = provider_user["name"] if provider_user else "a tribe member"
        
        req_notification = NotificationInDB(
            user_id=user_id,
            type="match_found",
            message=f"Ride match found with {provider_name}!",
            related_id=match_id
        )
        await db.notifications.insert_one(req_notification.model_dump(by_alias=True, exclude={"id"}))

        # 2. Notify Provider (The other parent)
        requester_name = requester_user["name"]
        
        prov_notification = NotificationInDB(
            user_id=provider_id,
            type="match_found",
            message=f"Ride match found with {requester_name}!",
            related_id=match_id
        )
        await db.notifications.insert_one(prov_notification.model_dump(by_alias=True, exclude={"id"}))