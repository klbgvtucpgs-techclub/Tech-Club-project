"""
Authentication Router - Login and faculty password generation
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional

from database import supabase
from services.auth_utils import (
    generate_password, 
    hash_password, 
    verify_password, 
    create_access_token,
    decode_access_token
)
from services.email_service import send_password_email

router = APIRouter(prefix="/api", tags=["Authentication"])
security = HTTPBearer()


# Pydantic models
class FacultyCreate(BaseModel):
    name: str
    employee_id: str
    email: EmailStr
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: str
    name: str


class MessageResponse(BaseModel):
    message: str
    success: bool


# Dependency to get current user from token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload


@router.post("/generate-password", response_model=MessageResponse)
async def generate_faculty_password(faculty: FacultyCreate):
    """
    Generate password for a new faculty member and send via email.
    Called by admin to create new faculty accounts.
    """
    try:
        # Check if email already exists in faculty_users
        existing = supabase.table("faculty_users").select("id").eq("email", faculty.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check if employee_id already exists
        existing_emp = supabase.table("faculty_users").select("id").eq("employee_id", faculty.employee_id).execute()
        if existing_emp.data:
            raise HTTPException(status_code=400, detail="Employee ID already registered")
        
        # Generate password
        plain_password = generate_password(12)
        hashed = hash_password(plain_password)
        
        # Insert into faculty_users table
        result = supabase.table("faculty_users").insert({
            "email": faculty.email,
            "password_hash": hashed,
            "name": faculty.name,
            "employee_id": faculty.employee_id,
            "phone": faculty.phone,
            "is_active": True
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create faculty account")
        
        # Send password email
        email_sent = send_password_email(faculty.email, faculty.name, plain_password)
        
        if email_sent:
            return MessageResponse(
                message=f"Faculty account created and password sent to {faculty.email}",
                success=True
            )
        else:
            return MessageResponse(
                message=f"Faculty account created but email failed. Password: {plain_password}",
                success=True
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login endpoint for both admin and faculty.
    Returns JWT token and user type for frontend routing.
    """
    try:
        # First check if admin
        admin_result = supabase.table("admins").select("*").eq("email", request.email).execute()
        
        if admin_result.data:
            admin = admin_result.data[0]
            if not admin.get("is_active", True):
                raise HTTPException(status_code=403, detail="Account is deactivated")
            
            if verify_password(request.password, admin["password_hash"]):
                token = create_access_token({
                    "sub": admin["id"],
                    "email": admin["email"],
                    "user_type": "admin",
                    "name": admin["name"]
                })
                return LoginResponse(
                    access_token=token,
                    token_type="bearer",
                    user_type="admin",
                    user_id=admin["id"],
                    name=admin["name"]
                )
        
        # Check if faculty
        faculty_result = supabase.table("faculty_users").select("*").eq("email", request.email).execute()
        
        if faculty_result.data:
            faculty = faculty_result.data[0]
            if not faculty.get("is_active", True):
                raise HTTPException(status_code=403, detail="Account is deactivated")
            
            if verify_password(request.password, faculty["password_hash"]):
                token = create_access_token({
                    "sub": faculty["id"],
                    "email": faculty["email"],
                    "user_type": "faculty",
                    "name": faculty["name"],
                    "employee_id": faculty["employee_id"]
                })
                return LoginResponse(
                    access_token=token,
                    token_type="bearer",
                    user_type="faculty",
                    user_id=faculty["id"],
                    name=faculty["name"]
                )
        
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current logged in user information"""
    return {
        "user_id": current_user.get("sub"),
        "email": current_user.get("email"),
        "user_type": current_user.get("user_type"),
        "name": current_user.get("name")
    }
