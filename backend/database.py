from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from models import User, Group, Task, Goal, ChatMessage, SubSection

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect_db(cls, mongodb_url: str):
        cls.client = AsyncIOMotorClient(mongodb_url)
        cls.db = cls.client.studyportal
        await cls.create_indexes()

    @classmethod
    async def create_indexes(cls):
        # Create indexes for better query performance
        await cls.db.users.create_index("email", unique=True)
        await cls.db.users.create_index("username", unique=True)
        await cls.db.groups.create_index([("name", 1), ("owner_id", 1)], unique=True)
        await cls.db.tasks.create_index([("user_id", 1), ("due_date", 1)])
        await cls.db.goals.create_index([("user_id", 1), ("target_date", 1)])
        await cls.db.chat_messages.create_index([("group_id", 1), ("created_at", -1)])

    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()

    # User operations
    @classmethod
    async def get_user_by_email(cls, email: str) -> Optional[dict]:
        return await cls.db.users.find_one({"email": email})

    @classmethod
    async def get_user_by_username(cls, username: str) -> Optional[dict]:
        return await cls.db.users.find_one({"username": username})

    @classmethod
    async def create_user(cls, user_data: dict) -> dict:
        user = await cls.db.users.insert_one(user_data)
        return await cls.db.users.find_one({"_id": user.inserted_id})

    @classmethod
    async def update_user(cls, user_id: ObjectId, update_data: dict) -> Optional[dict]:
        await cls.db.users.update_one({"_id": user_id}, {"$set": update_data})
        return await cls.db.users.find_one({"_id": user_id})

    # Group operations
    @classmethod
    async def create_group(cls, group_data: dict) -> dict:
        group = await cls.db.groups.insert_one(group_data)
        return await cls.db.groups.find_one({"_id": group.inserted_id})

    @classmethod
    async def get_user_groups(cls, user_id: ObjectId) -> List[dict]:
        return await cls.db.groups.find(
            {"$or": [{"owner_id": user_id}, {"members": user_id}]}
        ).to_list(None)

    @classmethod
    async def get_group(cls, group_id: ObjectId) -> Optional[dict]:
        return await cls.db.groups.find_one({"_id": group_id})

    @classmethod
    async def add_section_to_group(cls, group_id: ObjectId, section_name: str, subsection: SubSection) -> Optional[dict]:
        result = await cls.db.groups.update_one(
            {"_id": group_id},
            {"$push": {f"sections.{section_name}": subsection.dict(by_alias=True)}}
        )
        if result.modified_count:
            return await cls.get_group(group_id)
        return None

    # Task operations
    @classmethod
    async def create_task(cls, task_data: dict) -> dict:
        task = await cls.db.tasks.insert_one(task_data)
        return await cls.db.tasks.find_one({"_id": task.inserted_id})

    @classmethod
    async def get_user_tasks(cls, user_id: ObjectId) -> List[dict]:
        return await cls.db.tasks.find({"user_id": user_id}).to_list(None)

    @classmethod
    async def update_task(cls, task_id: ObjectId, update_data: dict) -> Optional[dict]:
        await cls.db.tasks.update_one({"_id": task_id}, {"$set": update_data})
        return await cls.db.tasks.find_one({"_id": task_id})

    # Goal operations
    @classmethod
    async def create_goal(cls, goal_data: dict) -> dict:
        goal = await cls.db.goals.insert_one(goal_data)
        return await cls.db.goals.find_one({"_id": goal.inserted_id})

    @classmethod
    async def get_user_goals(cls, user_id: ObjectId) -> List[dict]:
        return await cls.db.goals.find({"user_id": user_id}).to_list(None)

    @classmethod
    async def update_goal(cls, goal_id: ObjectId, update_data: dict) -> Optional[dict]:
        await cls.db.goals.update_one({"_id": goal_id}, {"$set": update_data})
        return await cls.db.goals.find_one({"_id": goal_id})

    # Chat operations
    @classmethod
    async def create_chat_message(cls, message_data: dict) -> dict:
        message = await cls.db.chat_messages.insert_one(message_data)
        return await cls.db.chat_messages.find_one({"_id": message.inserted_id})

    @classmethod
    async def get_group_messages(cls, group_id: ObjectId, limit: int = 50) -> List[dict]:
        return await cls.db.chat_messages.find(
            {"group_id": group_id}
        ).sort("created_at", -1).limit(limit).to_list(None)
