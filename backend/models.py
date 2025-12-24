from typing import Optional, Annotated
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, field_validator
from datetime import datetime, timezone
from utils import normalize_phone

# Helper to map ObjectId to string
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserBase(BaseModel):
    name: str
    phone: str

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_phone(v)

class UserCreate(UserBase):
    password: str
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class UserLogin(BaseModel):
    phone: str
    password: str

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_phone(v)

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class UserResponse(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return normalize_phone(v)

class TribeBase(BaseModel):
    name: str

class TribeCreate(TribeBase):
    pass

class TribeInDB(TribeBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    owner_id: PyObjectId
    member_count: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class TribeResponse(TribeBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    owner_id: PyObjectId
    member_count: int
    created_at: datetime
    membership_status: Optional[str] = None # "accepted", "invited", etc.
    invited_by_name: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class TribeInvite(BaseModel):
    phone_number: str
    trust_level: str = "direct"

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_phone(v)

class TribeMembershipBase(BaseModel):
    tribe_id: PyObjectId
    user_id: PyObjectId
    trust_level: str
    status: str
    invited_by_id: Optional[PyObjectId] = None

class TribeMembershipInDB(TribeMembershipBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class TribeMemberResponse(BaseModel):
    user: UserResponse
    trust_level: str
    status: str
    joined_at: datetime
class TribeMemberUpdate(BaseModel):
    trust_level: str

class TribeInviteResponseRequest(BaseModel):
    status: str # "accepted" or "declined"

class PendingInviteInDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    tribe_id: PyObjectId
    phone: str
    trust_level: str
    invited_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class Token(BaseModel):
    access_token: str
    token_type: str

class AuthResponse(Token):
    user: UserResponse

class TokenData(BaseModel):
    phone: Optional[str] = None
class Geo(BaseModel):
    lat: float
    lng: float

class DestinationBase(BaseModel):
    name: str
    address: str
    google_place_id: Optional[str] = None
    geo: Optional[Geo] = None
    category: Optional[str] = None
    verified_date: Optional[datetime] = None
    is_archived: bool = False

class DestinationCreate(DestinationBase):
    pass
class DestinationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    google_place_id: Optional[str] = None
    geo: Optional[Geo] = None
    category: Optional[str] = None

class DestinationInDB(DestinationBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class DestinationResponse(DestinationBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_by: PyObjectId
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
class ScheduleEntryBase(BaseModel):
    child_name: str
    destination_id: PyObjectId
    pickup_time: datetime
    dropoff_time: Optional[datetime] = None
    recurrence: str = "once"
    status: str = "active"

    @field_validator('pickup_time', 'dropoff_time')
    @classmethod
    def ensure_tz(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return None
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class ScheduleEntryUpdate(BaseModel):
    child_name: Optional[str] = None
    destination_id: Optional[PyObjectId] = None
    pickup_time: Optional[datetime] = None
    dropoff_time: Optional[datetime] = None
    recurrence: Optional[str] = None
    status: Optional[str] = None

class ScheduleEntryCreate(ScheduleEntryBase):
    pass

class ScheduleEntryInDB(ScheduleEntryBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class ScheduleEntryResponse(ScheduleEntryBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    created_at: datetime
    destination: Optional[DestinationResponse] = None # For returning populated data

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class RideMatchBase(BaseModel):
    requester_id: PyObjectId
    provider_id: PyObjectId
    schedule_entry_id: PyObjectId # The schedule that triggered the match
    provider_schedule_id: Optional[PyObjectId] = None # The existing schedule found
    match_score: int
    status: str = "suggested" # suggested, accepted, declined

class RideMatchInDB(RideMatchBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class NotificationBase(BaseModel):
    user_id: PyObjectId
    type: str # "match_found", "invite_received", "ride_accepted"
    message: str
    related_id: Optional[str] = None # ID of the related entity (match_id, tribe_id, etc.)
    is_read: bool = False

class NotificationInDB(NotificationBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class NotificationResponse(NotificationBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class RideMatchResponse(RideMatchBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime
    requester: Optional[UserResponse] = None
    provider: Optional[UserResponse] = None
    schedule: Optional[ScheduleEntryResponse] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )