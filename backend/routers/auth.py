from datetime import timedelta
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from config import settings
from db import db
from models import (
    UserCreate, UserResponse, UserInDB, UserLogin, Token, AuthResponse,
    TribeMembershipInDB, NotificationInDB, UserUpdate
)
from auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()

@router.post("/signup", response_model=AuthResponse)
async def signup(user: UserCreate):
    # Check if user already exists
    if await db.users.find_one({"phone": user.phone}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(
        name=user.name,
        phone=user.phone,
        hashed_password=hashed_password
    )
    
    new_user = await db.users.insert_one(user_in_db.model_dump(by_alias=True, exclude={"id"}))
    created_user = await db.users.find_one({"_id": new_user.inserted_id})
    
    # Process Pending Invites
    pending_invites = await db.pending_invites.find({"phone": user.phone}).to_list(100)
    
    for invite in pending_invites:
        # Create membership
        membership = TribeMembershipInDB(
            tribe_id=str(invite["tribe_id"]),
            user_id=str(new_user.inserted_id),
            trust_level=invite["trust_level"],
            status="invited"
        )
        await db.tribe_memberships.insert_one(membership.model_dump(by_alias=True, exclude={"id"}))
        
        # Note: Do NOT increment tribe member count here. Wait for acceptance.
        
        # Notify new user
        tribe = await db.tribes.find_one({"_id": invite["tribe_id"]})
        tribe_name = tribe["name"] if tribe else "Unknown Tribe"
        
        # Fetch inviter name
        inviter_name = "someone"
        if "invited_by" in invite:
            inviter = await db.users.find_one({"_id": ObjectId(invite["invited_by"])})
            if inviter:
                inviter_name = inviter["name"]

        notification = NotificationInDB(
            user_id=str(new_user.inserted_id),
            type="invite_received",
            message=f"You have been invited by {inviter_name} to join the tribe '{tribe_name}'!",
            related_id=str(invite["tribe_id"])
        )
        await db.notifications.insert_one(notification.model_dump(by_alias=True, exclude={"id"}))

    # Clean up pending invites
    if pending_invites:
        await db.pending_invites.delete_many({"phone": user.phone})

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.phone}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": created_user
    }

@router.post("/login", response_model=AuthResponse)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"phone": user_credentials.phone})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["phone"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update current user's profile.
    """
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}

    if not update_data:
        return current_user

    if "phone" in update_data and update_data["phone"] != current_user.phone:
        # Check if phone number is already taken by another user
        existing_user = await db.users.find_one({"phone": update_data["phone"]})
        if existing_user and str(existing_user["_id"]) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )

    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )

    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return updated_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(current_user: UserInDB = Depends(get_current_user)):
    """
    Delete the current user's account and all associated data.
    """
    user_id = str(current_user.id)
    
    # 1. Delete associated data first
    
    # Delete destinations created by user
    await db.destinations.delete_many({"created_by": current_user.id})
    
    # Delete schedules created by user
    await db.schedules.delete_many({"user_id": user_id})
    
    # Delete matches where user is requester or provider
    await db.matches.delete_many({
        "$or": [
            {"requester_id": user_id},
            {"provider_id": user_id}
        ]
    })
    
    # Remove from tribes (as member)
    await db.tribe_members.delete_many({"user_id": user_id})
    
    # Delete tribes owned by user (and their memberships)
    # First find tribes owned by user
    owned_tribes = await db.tribes.find({"owner_id": user_id}).to_list(1000)
    owned_tribe_ids = [str(t["_id"]) for t in owned_tribes]
    
    if owned_tribe_ids:
        # Delete memberships for these tribes
        await db.tribe_members.delete_many({"tribe_id": {"$in": owned_tribe_ids}})
        # Delete the tribes themselves
        await db.tribes.delete_many({"owner_id": user_id})

    # 2. Delete the user
    await db.users.delete_one({"_id": ObjectId(user_id)})
    
    return None