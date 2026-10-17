from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank.")
        return value

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank.")
        return value

class User(UserBase):
    id: str
    created_at: datetime
    agent_paused: bool = False
    notification_email: bool = True
    notification_push: bool = True
    notification_sms: bool = False

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    agent_paused: bool
    role: Literal["customer", "merchant"] = "customer"
    merchant_id: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    role: Literal["customer", "merchant"] = "customer"
    merchant_id: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None
