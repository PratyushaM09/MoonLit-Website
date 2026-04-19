from fastapi import FastAPI, HTTPException, Depends, status, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.openapi.utils import get_openapi
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
from typing import List, Optional
import os
from dotenv import load_dotenv

from models import (
    User, UserCreate, Group, Task, Goal, ChatMessage,
    SubSection, PyObjectId
)
from database import Database
from auth import (
    create_access_token, get_current_active_user,
    create_user, authenticate_user, verify_google_token,
    get_google_token, create_or_get_google_user
)

load_dotenv()

app = FastAPI(title="Study Portal API", docs_url=None, redoc_url=None)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8000",
        "https://cdn.jsdelivr.net",
        "https://accounts.google.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await Database.connect_db(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))

@app.on_event("shutdown")
async def shutdown_db_client():
    await Database.close_db()

# Google OAuth endpoints
@app.get("/auth/google/login")
async def google_login():
    google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "response_type": "code",
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI"),
        "scope": "openid email profile",
    }
    
    # Construct the URL with parameters
    authorize_url = f"{google_auth_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=authorize_url)

@app.get("/auth/google/callback")
async def google_callback(code: str):
    try:
        # Exchange authorization code for tokens
        token_data = await get_google_token(code)
        id_token_data = token_data.get("id_token")
        if not id_token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No ID token found in Google response"
            )
        
        # Verify the ID token
        user_info = await verify_google_token(id_token_data)
        
        # Create or get user
        user = await create_or_get_google_user(user_info)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.username}
        )
        
        # Redirect to frontend with token
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(
            url=f"{frontend_url}/auth/callback?token={access_token}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Documentation endpoints
@app.get("/api/docs", include_in_schema=False)
async def custom_swagger_ui_html(request: Request):
    return templates.TemplateResponse(
        "swagger-ui.html",
        {
            "request": request,
            "title": "Study Portal API Documentation",
            "openapi_url": "/api/openapi.json",
        },
    )

@app.get("/api/openapi.json", include_in_schema=False)
async def get_open_api_endpoint():
    return get_openapi(
        title="Study Portal API",
        version="1.0.0",
        description="Study Portal REST API documentation",
        routes=app.routes,
    )

# Auth endpoints
@app.post("/auth/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/signup", response_model=User)
async def signup(user_create: UserCreate):
    return await create_user(user_create)

# User endpoints
@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Group endpoints
@app.post("/groups", response_model=Group)
async def create_group(
    group: Group = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    group_data = group.dict(by_alias=True)
    group_data["owner_id"] = current_user.id
    group_data["members"] = [current_user.id]
    return await Database.create_group(group_data)

@app.get("/groups", response_model=List[Group])
async def get_user_groups(current_user: User = Depends(get_current_active_user)):
    return await Database.get_user_groups(current_user.id)

@app.post("/groups/{group_id}/sections/{section_name}")
async def add_section(
    group_id: str,
    section_name: str,
    subsection: SubSection,
    current_user: User = Depends(get_current_active_user)
):
    group = await Database.get_group(PyObjectId(group_id))
    if not group or str(group["owner_id"]) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Group not found")
    return await Database.add_section_to_group(PyObjectId(group_id), section_name, subsection)

# Task endpoints
@app.post("/tasks", response_model=Task)
async def create_task(
    task: Task = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    task_data = task.dict(by_alias=True)
    task_data["user_id"] = current_user.id
    return await Database.create_task(task_data)

@app.get("/tasks", response_model=List[Task])
async def get_user_tasks(current_user: User = Depends(get_current_active_user)):
    return await Database.get_user_tasks(current_user.id)

@app.put("/tasks/{task_id}")
async def update_task(
    task_id: str,
    task_update: dict = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    task = await Database.update_task(PyObjectId(task_id), task_update)
    if not task or str(task["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# Goal endpoints
@app.post("/goals", response_model=Goal)
async def create_goal(
    goal: Goal = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    goal_data = goal.dict(by_alias=True)
    goal_data["user_id"] = current_user.id
    return await Database.create_goal(goal_data)

@app.get("/goals", response_model=List[Goal])
async def get_user_goals(current_user: User = Depends(get_current_active_user)):
    return await Database.get_user_goals(current_user.id)

@app.put("/goals/{goal_id}")
async def update_goal(
    goal_id: str,
    goal_update: dict = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    goal = await Database.update_goal(PyObjectId(goal_id), goal_update)
    if not goal or str(goal["user_id"]) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

# Chat endpoints
@app.post("/chat/messages", response_model=ChatMessage)
async def create_message(
    message: ChatMessage = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    message_data = message.dict(by_alias=True)
    message_data["user_id"] = current_user.id
    return await Database.create_chat_message(message_data)

@app.get("/chat/{group_id}/messages", response_model=List[ChatMessage])
async def get_group_messages(
    group_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
):
    group = await Database.get_group(PyObjectId(group_id))
    if not group or str(current_user.id) not in [str(id) for id in group["members"]]:
        raise HTTPException(status_code=404, detail="Group not found")
    return await Database.get_group_messages(PyObjectId(group_id), limit)


