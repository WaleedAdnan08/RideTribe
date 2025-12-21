from fastapi import APIRouter, Depends, HTTPException, status, Body, BackgroundTasks
from typing import List, Annotated
from bson import ObjectId
from pydantic import BaseModel
from db import db
from models import (
    UserInDB,
    RideMatchResponse,
    UserResponse,
    ScheduleEntryResponse,
    DestinationResponse
)
from auth import get_current_user
from matching import find_and_create_matches

router = APIRouter()

class MatchUpdate(BaseModel):
    status: str

@router.get("/", response_model=List[RideMatchResponse])
async def list_matches(current_user: UserInDB = Depends(get_current_user)):
    """
    List all ride matches for the current user (either as requester or provider).
    """
    # Find matches where user is requester or provider
    matches = await db.matches.find({
        "$or": [
            {"requester_id": str(current_user.id)},
            {"provider_id": str(current_user.id)}
        ]
    }).to_list(1000)

    enriched_matches = []
    for m in matches:
        # Fetch related data manually for MVP (no huge joins)
        requester = await db.users.find_one({"_id": ObjectId(m["requester_id"])})
        provider = await db.users.find_one({"_id": ObjectId(m["provider_id"])})
        schedule = await db.schedules.find_one({"_id": ObjectId(m["schedule_entry_id"])})
        
        # Helper to safely create UserResponse
        req_resp = UserResponse(**requester) if requester else None
        prov_resp = UserResponse(**provider) if provider else None
        
        sched_resp = None
        if schedule:
            # We might need destination inside schedule too
            dest_id = schedule.get("destination_id")
            dest_resp = None
            if dest_id:
                dest = await db.destinations.find_one({"_id": ObjectId(dest_id)})
                if dest:
                    dest_resp = DestinationResponse(**dest)
            
            sched_resp = ScheduleEntryResponse(
                **schedule,
                destination=dest_resp
            )

        enriched_matches.append(RideMatchResponse(
            **m,
            requester=req_resp,
            provider=prov_resp,
            schedule=sched_resp
        ))

    return enriched_matches

@router.post("/generate", response_model=dict)
async def generate_matches(
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Trigger manual matching for all active schedules of the current user.
    Useful for testing.
    """
    # Find all active schedules for this user
    schedules = await db.schedules.find({
        "user_id": str(current_user.id),
        "status": "active"
    }).to_list(100)
    
    count = 0
    for s in schedules:
        background_tasks.add_task(find_and_create_matches, str(s["_id"]))
        count += 1
        
    return {"message": f"Triggered matching for {count} schedules", "count": count}

@router.patch("/{match_id}", response_model=RideMatchResponse)
async def update_match_status(
    match_id: str,
    update: MatchUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    # Verify match exists and user is involved
    match = await db.matches.find_one({"_id": ObjectId(match_id)})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if str(current_user.id) not in [match["requester_id"], match["provider_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this match")

    # Update status
    await db.matches.update_one(
        {"_id": ObjectId(match_id)},
        {"$set": {"status": update.status}}
    )
    
    # Return updated match
    updated_match = await db.matches.find_one({"_id": ObjectId(match_id)})
    
    requester = await db.users.find_one({"_id": ObjectId(updated_match["requester_id"])})
    provider = await db.users.find_one({"_id": ObjectId(updated_match["provider_id"])})
    schedule = await db.schedules.find_one({"_id": ObjectId(updated_match["schedule_entry_id"])})
    
    req_resp = UserResponse(**requester) if requester else None
    prov_resp = UserResponse(**provider) if provider else None
    
    sched_resp = None
    if schedule:
        dest_id = schedule.get("destination_id")
        dest_resp = None
        if dest_id:
            dest = await db.destinations.find_one({"_id": ObjectId(dest_id)})
            if dest:
                dest_resp = DestinationResponse(**dest)
        
        sched_resp = ScheduleEntryResponse(
            **schedule,
            destination=dest_resp
        )
        
    return RideMatchResponse(
        **updated_match,
        requester=req_resp,
        provider=prov_resp,
        schedule=sched_resp
    )