from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List
from bson import ObjectId
from db import db
from models import (
    UserInDB, TribeCreate, TribeResponse, TribeInDB,
    TribeInvite, TribeMembershipInDB, TribeMemberResponse, UserResponse
)
from auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TribeResponse])
async def list_tribes(current_user: UserInDB = Depends(get_current_user)):
    # Find all memberships for the user
    memberships = await db.tribe_memberships.find({"user_id": str(current_user.id)}).to_list(100)
    tribe_ids = [ObjectId(m["tribe_id"]) for m in memberships]
    
    # Find all tribes matching these IDs
    if not tribe_ids:
        return []
        
    tribes = await db.tribes.find({"_id": {"$in": tribe_ids}}).to_list(100)
    return tribes

@router.post("/", response_model=TribeResponse)
async def create_tribe(tribe: TribeCreate, current_user: UserInDB = Depends(get_current_user)):
    # Create tribe document
    tribe_in_db = TribeInDB(
        name=tribe.name,
        owner_id=str(current_user.id),
        member_count=1
    )
    
    new_tribe = await db.tribes.insert_one(tribe_in_db.model_dump(by_alias=True, exclude={"id"}))
    created_tribe = await db.tribes.find_one({"_id": new_tribe.inserted_id})
    
    # Add creator as a member (admin/owner)
    membership = TribeMembershipInDB(
        tribe_id=str(new_tribe.inserted_id),
        user_id=str(current_user.id),
        trust_level="direct",
        status="accepted"
    )
    await db.tribe_memberships.insert_one(membership.model_dump(by_alias=True, exclude={"id"}))
    
    return created_tribe

@router.get("/{tribe_id}/members", response_model=List[TribeMemberResponse])
async def list_tribe_members(tribe_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Verify user is a member of this tribe
    membership = await db.tribe_memberships.find_one({
        "tribe_id": tribe_id,
        "user_id": str(current_user.id)
    })
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this tribe"
        )
    
    # Get all memberships for this tribe
    tribe_memberships = await db.tribe_memberships.find({"tribe_id": tribe_id}).to_list(100)
    
    # Get user details for each member
    members = []
    for m in tribe_memberships:
        user = await db.users.find_one({"_id": ObjectId(m["user_id"])})
        if user:
            members.append(TribeMemberResponse(
                user=UserResponse(**user),
                trust_level=m["trust_level"],
                status=m["status"],
                joined_at=m["created_at"]
            ))
            
    return members

@router.post("/{tribe_id}/invite", response_model=TribeMemberResponse)
async def invite_member(
    tribe_id: str,
    invite: TribeInvite,
    current_user: UserInDB = Depends(get_current_user)
):
    print(f"DEBUG: invite_member called for tribe_id={tribe_id}, invite={invite}")
    # Check if tribe exists
    tribe = await db.tribes.find_one({"_id": ObjectId(tribe_id)})
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
        
    # Check if current user is owner
    if tribe["owner_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the tribe owner can invite new members"
        )
        
    # Find user by phone
    print(f"DEBUG: searching for user with phone: {invite.phone_number}")
    user_to_invite = await db.users.find_one({"phone": invite.phone_number})
    if not user_to_invite:
        print(f"DEBUG: User not found for phone: {invite.phone_number}")
        raise HTTPException(
            status_code=404,
            detail="User with this phone number not found. They must be registered first."
        )
        
    # Check if already a member
    existing_membership = await db.tribe_memberships.find_one({
        "tribe_id": tribe_id,
        "user_id": str(user_to_invite["_id"])
    })
    
    if existing_membership:
        raise HTTPException(
            status_code=400,
            detail="User is already a member or has a pending invite"
        )
        
    # Create membership (auto-accept for MVP simplicity)
    new_membership = TribeMembershipInDB(
        tribe_id=tribe_id,
        user_id=str(user_to_invite["_id"]),
        trust_level=invite.trust_level,
        status="accepted" 
    )
    
    await db.tribe_memberships.insert_one(new_membership.model_dump(by_alias=True, exclude={"id"}))
    
    # Update member count
    await db.tribes.update_one(
        {"_id": ObjectId(tribe_id)},
        {"$inc": {"member_count": 1}}
    )
    
    return TribeMemberResponse(
        user=UserResponse(**user_to_invite),
        trust_level=new_membership.trust_level,
        status=new_membership.status,
        joined_at=new_membership.created_at
    )