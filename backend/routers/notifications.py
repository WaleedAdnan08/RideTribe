from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from db import db
from models import UserInDB, NotificationResponse
from auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(current_user: UserInDB = Depends(get_current_user)):
    """
    List all notifications for the current user.
    """
    notifications = await db.notifications.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    return notifications

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(notification_id: str, current_user: UserInDB = Depends(get_current_user)):
    """
    Mark a notification as read.
    """
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id), "user_id": current_user.id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"is_read": True}}
    )
    
    updated_notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    return updated_notification