from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from db import db
from models import (
    UserInDB,
    ScheduleEntryCreate,
    ScheduleEntryResponse,
    ScheduleEntryInDB,
    DestinationResponse,
    ScheduleEntryUpdate
)
from auth import get_current_user

from matching import find_and_create_matches, invalidate_schedule_matches

router = APIRouter()

@router.get("/", response_model=List[ScheduleEntryResponse])
async def list_schedules(current_user: UserInDB = Depends(get_current_user)):
    """
    List all schedules for the current user.
    """
    schedules = await db.schedules.find({"user_id": str(current_user.id)}).to_list(1000)
    
    # Enrich with destination details
    enriched_schedules = []
    for s in schedules:
        dest_id = s.get("destination_id")
        destination = None
        if dest_id:
            dest_data = await db.destinations.find_one({"_id": ObjectId(dest_id)})
            if dest_data:
                destination = DestinationResponse(**dest_data)
        
        enriched_schedules.append(ScheduleEntryResponse(
            **s,
            destination=destination
        ))
        
    return enriched_schedules

@router.post("/", response_model=ScheduleEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule: ScheduleEntryCreate,
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Create a new schedule entry.
    """
    # Verify destination exists
    destination = await db.destinations.find_one({"_id": ObjectId(schedule.destination_id)})
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")

    schedule_data = schedule.model_dump()
    schedule_data["user_id"] = str(current_user.id)
    
    # Create DB model
    new_schedule = ScheduleEntryInDB(**schedule_data)
    
    # Insert into DB
    result = await db.schedules.insert_one(new_schedule.model_dump(by_alias=True, exclude={"id"}))
    
    # Fetch created schedule
    created_schedule_doc = await db.schedules.find_one({"_id": result.inserted_id})
    
    # Enrich with destination for response
    destination_resp = DestinationResponse(**destination)
    
    response = ScheduleEntryResponse(
        **created_schedule_doc,
        destination=destination_resp
    )
    
    # Trigger matching algorithm
    background_tasks.add_task(find_and_create_matches, str(result.inserted_id))
    
    return response

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Delete a schedule entry.
    """
    try:
        oid = ObjectId(schedule_id)
    except (InvalidId, TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid schedule ID format")

    # Check if schedule exists and belongs to user
    existing_schedule = await db.schedules.find_one({"_id": oid, "user_id": str(current_user.id)})
    if not existing_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found or you don't have permission to delete it")

    # INVALIDATE matches before deleting
    # This ensures partners are notified if they had an accepted match
    await invalidate_schedule_matches(schedule_id, reason="schedule deleted")

    result = await db.schedules.delete_one({
        "_id": oid
    })
    
    return None

@router.put("/{schedule_id}", response_model=ScheduleEntryResponse)
async def update_schedule(
    schedule_id: str,
    schedule_update: ScheduleEntryUpdate,
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update a schedule entry.
    """
    try:
        oid = ObjectId(schedule_id)
    except (InvalidId, TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid schedule ID format")
    
    # Check if schedule exists and belongs to user
    existing_schedule = await db.schedules.find_one({"_id": oid, "user_id": str(current_user.id)})
    if not existing_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found or you don't have permission to update it")
        
    update_data = {k: v for k, v in schedule_update.model_dump().items() if v is not None}
    
    if not update_data:
        # Just return existing enriched
        dest_id = existing_schedule.get("destination_id")
        destination = None
        if dest_id:
             dest_data = await db.destinations.find_one({"_id": ObjectId(dest_id)})
             if dest_data:
                 destination = DestinationResponse(**dest_data)
        return ScheduleEntryResponse(**existing_schedule, destination=destination)

    # If destination is changing, verify it exists
    if "destination_id" in update_data:
        destination = await db.destinations.find_one({"_id": ObjectId(update_data["destination_id"])})
        if not destination:
            raise HTTPException(status_code=404, detail="Destination not found")
            
    # Update DB
    await db.schedules.update_one(
        {"_id": oid},
        {"$set": update_data}
    )
    
    # Fetch updated
    updated_schedule_doc = await db.schedules.find_one({"_id": oid})
    
    # Enrich
    dest_id = updated_schedule_doc.get("destination_id")
    destination_resp = None
    if dest_id:
        dest_data = await db.destinations.find_one({"_id": ObjectId(dest_id)})
        if dest_data:
            destination_resp = DestinationResponse(**dest_data)
            
    # Trigger matching if critical fields changed
    if any(k in update_data for k in ["destination_id", "pickup_time", "recurrence"]):
         # INVALIDATE existing matches because core criteria changed
         # This ensures partners are notified if they had an accepted match
         await invalidate_schedule_matches(schedule_id, reason="schedule updated")
         
         # Re-trigger matching
         background_tasks.add_task(find_and_create_matches, str(oid))

    return ScheduleEntryResponse(**updated_schedule_doc, destination=destination_resp)