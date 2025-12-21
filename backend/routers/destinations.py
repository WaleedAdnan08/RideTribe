from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List
from db import db
from models import DestinationCreate, DestinationResponse, DestinationInDB, UserInDB
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