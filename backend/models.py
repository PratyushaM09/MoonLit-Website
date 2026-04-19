from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {"example": {
            "id": "507f1f77bcf86cd799439011",
            "username": "john_doe",
            "email": "john@example.com",
            "full_name": "John Doe",
            "is_active": True
        }}

class SubSection(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    description: str
    files: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Group(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    description: str
    owner_id: PyObjectId
    members: List[PyObjectId] = []
    sections: Dict[str, List[SubSection]] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {"example": {
            "id": "507f1f77bcf86cd799439011",
            "name": "Study Group",
            "description": "A group for studying together",
            "owner_id": "507f1f77bcf86cd799439011",
            "members": ["507f1f77bcf86cd799439011"],
            "sections": {}
        }}

class Task(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    title: str
    description: str
    due_date: Optional[datetime]
    completed: bool = False
    user_id: PyObjectId
    group_id: Optional[PyObjectId]
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {"example": {
            "id": "507f1f77bcf86cd799439011",
            "title": "Complete Assignment",
            "description": "Finish math homework",
            "due_date": "2025-09-01T00:00:00Z",
            "completed": False,
            "user_id": "507f1f77bcf86cd799439011"
        }}

class Goal(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    title: str
    description: str
    target_date: datetime
    progress: float = 0.0
    user_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {"example": {
            "id": "507f1f77bcf86cd799439011",
            "title": "Master Python",
            "description": "Learn Python programming",
            "target_date": "2025-12-31T00:00:00Z",
            "progress": 0.0,
            "user_id": "507f1f77bcf86cd799439011"
        }}

class ChatMessage(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    group_id: PyObjectId
    user_id: PyObjectId
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {"example": {
            "id": "507f1f77bcf86cd799439011",
            "group_id": "507f1f77bcf86cd799439011",
            "user_id": "507f1f77bcf86cd799439011",
            "message": "Hello everyone!",
            "created_at": "2025-08-27T10:00:00Z"
        }}
