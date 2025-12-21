from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List
from db import db
from bson import ObjectId
from bson.errors import InvalidId
from models import DestinationCreate, DestinationResponse, DestinationInDB, UserInDB, DestinationUpdate
from auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[DestinationResponse])
async def list_destinations(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    List all destinations created by the current user.
    """
    destinations = await db.destinations.find({"created_by": current_user.id}).to_list(1000)
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
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update a destination.
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
        
    # Perform update
    await db.destinations.update_one(
        {"_id": oid},
        {"$set": update_data}
    )
    
    # Fetch updated destination
    updated_destination = await db.destinations.find_one({"_id": oid})
    
    return updated_destination