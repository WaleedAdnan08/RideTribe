from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from config import settings
from db import db
from models import TokenData, UserInDB

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password, hashed_password):
    # Bcrypt has a 72-byte limit. Truncate to avoid errors for long passwords.
    if isinstance(plain_password, str):
        # Check byte length
        encoded = plain_password.encode('utf-8')
        if len(encoded) > 71:
            # Truncate to 71 bytes to be safe and decode back to string
            # ignoring any partial multibyte characters at the end
            plain_password = encoded[:71].decode('utf-8', errors='ignore')
            
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Bcrypt has a 72-byte limit. Truncate to avoid "password too long" errors.
    if isinstance(password, str):
        # Check byte length
        encoded = password.encode('utf-8')
        if len(encoded) > 71:
            # Truncate to 71 bytes to be safe and decode back to string
            # ignoring any partial multibyte characters at the end
            password = encoded[:71].decode('utf-8', errors='ignore')
            
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
        token_data = TokenData(phone=phone)
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"phone": token_data.phone})
    if user is None:
        raise credentials_exception
        
    return UserInDB(**user)