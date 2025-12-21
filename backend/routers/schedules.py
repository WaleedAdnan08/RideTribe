from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from bson import ObjectId
from db import db
from models import (
    UserInDB,
    ScheduleEntryCreate,
    ScheduleEntryResponse,
    ScheduleEntryInDB,
    DestinationResponse
)
from auth import get_current_user

from matching import find_and_create_matches

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
    result = await db.schedules.delete_one({
        "_id": ObjectId(schedule_id),
        "user_id": str(current_user.id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    return None