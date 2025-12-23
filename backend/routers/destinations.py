from fastapi import APIRouter, Depends, HTTPException, status, Body, BackgroundTasks
from typing import List
from datetime import datetime, timezone
from db import db
from bson import ObjectId
from bson.errors import InvalidId
from models import DestinationCreate, DestinationResponse, DestinationInDB, UserInDB, DestinationUpdate
from auth import get_current_user
from matching import find_and_create_matches

router = APIRouter()

@router.get("/", response_model=List[DestinationResponse])
async def list_destinations(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    List all destinations created by the current user.
    """
    destinations = await db.destinations.find({
        "created_by": current_user.id,
        "is_archived": {"$ne": True}
    }).to_list(1000)
    return destinations

@router.post("/", response_model=DestinationResponse, status_code=status.HTTP_201_CREATED)
async def create_destination(
    destination: DestinationCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Create a new destination.
    """
    destination_data = destination.model_dump()
    destination_data["created_by"] = current_user.id
    
    # Create DB model
    new_destination = DestinationInDB(**destination_data)
    
    # Insert into DB
    result = await db.destinations.insert_one(new_destination.model_dump(by_alias=True, exclude=["id"]))
    
    # Fetch created destination
    created_destination = await db.destinations.find_one({"_id": result.inserted_id})
    
    return created_destination

@router.delete("/{destination_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_destination(
    destination_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Delete a destination.
    """
    try:
        oid = ObjectId(destination_id)
    except (InvalidId, TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid destination ID format")

    # Check if destination exists and belongs to user
    destination = await db.destinations.find_one({"_id": oid, "created_by": current_user.id})
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found or you don't have permission to delete it")

    # Delete
    await db.destinations.delete_one({"_id": oid})
    
    # Optional: We might want to warn if there are schedules using this destination,
    # but for now we'll allow it (schedules will just show un-enriched data or we handle it on fetch)
    
    return None

@router.put("/{destination_id}", response_model=DestinationResponse)
async def update_destination(
    destination_id: str,
    destination_update: DestinationUpdate,
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update a destination.
    If the destination is used in completed/past schedules, it creates a new destination
    and updates active/future schedules to use the new one, leaving history intact.
    Also invalidates and re-triggers matching for affected active schedules.
    """
    try:
        oid = ObjectId(destination_id)
    except (InvalidId, TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid destination ID format")
    
    # Check if destination exists and belongs to user
    destination = await db.destinations.find_one({"_id": oid, "created_by": current_user.id})
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found or you don't have permission to update it")
    
    # Prepare update data
    update_data = {k: v for k, v in destination_update.model_dump().items() if v is not None}
    
    if not update_data:
        return destination # No changes
        
    # Check if used in any past/completed schedules
    # "Past" means completed status OR pickup_time < now
    now = datetime.now(timezone.utc)
    past_usage = await db.schedules.count_documents({
        "destination_id": str(oid),
        "$or": [
            {"status": "completed"},
            {"pickup_time": {"$lt": now}}
        ]
    })
    
    if past_usage > 0:
        # Fork-on-write strategy
        # 1. Create NEW destination with updated data
        new_dest_data = destination.copy()
        new_dest_data.pop("_id")
        new_dest_data.update(update_data)
        new_dest_data["created_at"] = datetime.now(timezone.utc)
        
        # Insert new destination
        new_dest_in_db = DestinationInDB(**new_dest_data)
        result = await db.destinations.insert_one(new_dest_in_db.model_dump(by_alias=True, exclude=["id"]))
        new_dest_id = result.inserted_id
        
        # 2. Archive the OLD destination (so it doesn't show in list but keeps history valid)
        await db.destinations.update_one(
            {"_id": oid},
            {"$set": {"is_archived": True}}
        )
        
        # 3. Update ACTIVE/FUTURE schedules to point to NEW destination
        active_schedules_cursor = db.schedules.find({
            "destination_id": str(oid),
            "status": {"$ne": "completed"},
            "pickup_time": {"$gte": now}
        })
        
        active_schedules = await active_schedules_cursor.to_list(1000)
        
        for schedule in active_schedules:
            sched_id = schedule["_id"]
            
            # Point to new destination
            await db.schedules.update_one(
                {"_id": sched_id},
                {"$set": {"destination_id": str(new_dest_id)}}
            )
            
            # INVALIDATE existing matches for this schedule since location changed
            # We delete suggested/accepted matches because the location constraint is violated
            # NOTE: For 'accepted' matches, ideally we should notify users, but for now we reset state.
            await db.matches.delete_many({"schedule_entry_id": str(sched_id)})
            await db.matches.delete_many({"provider_schedule_id": str(sched_id)})
            
            # Re-trigger matching
            background_tasks.add_task(find_and_create_matches, str(sched_id))
            
        # Return the NEW destination
        updated_destination = await db.destinations.find_one({"_id": new_dest_id})
        return updated_destination

    else:
        # Not used in history, safe to update in place
        await db.destinations.update_one(
            {"_id": oid},
            {"$set": update_data}
        )
        
        # Invalidate matches for any ACTIVE schedules using this destination
        # (Since we modified the destination in place, existing matches might be invalid)
        active_schedules = await db.schedules.find({
            "destination_id": str(oid),
            "status": "active"
        }).to_list(1000)
        
        for schedule in active_schedules:
            sched_id = schedule["_id"]
             # Delete existing matches as criteria changed
            await db.matches.delete_many({"schedule_entry_id": str(sched_id)})
            await db.matches.delete_many({"provider_schedule_id": str(sched_id)})
            
            # Re-trigger matching
            background_tasks.add_task(find_and_create_matches, str(sched_id))

        updated_destination = await db.destinations.find_one({"_id": oid})
        return updated_destination