from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from config import settings
from db import db
from models import UserCreate, UserResponse, UserInDB, UserLogin, Token, AuthResponse
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