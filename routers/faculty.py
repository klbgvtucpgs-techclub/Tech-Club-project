"""
Faculty Router - Faculty profile and data management
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
import uuid

from database import supabase
from services.auth_utils import decode_access_token

router = APIRouter(prefix="/api/faculty", tags=["Faculty"])
security = HTTPBearer()


# Dependency to get current faculty user
async def get_current_faculty(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    if payload.get("user_type") != "faculty":
        raise HTTPException(status_code=403, detail="Faculty access required")
    
    return payload


# Pydantic models
class ProfileUpdate(BaseModel):
    name_prefix: Optional[str] = None
    name: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    faculty_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class PublicationCreate(BaseModel):
    academic_year: str
    authors: Optional[str] = None
    title: Optional[str] = None
    journal_name: Optional[str] = None
    issn_isbn: Optional[str] = None
    url: Optional[str] = None


class AwardCreate(BaseModel):
    academic_year: str
    title: Optional[str] = None
    awarding_agency: Optional[str] = None
    level: Optional[str] = None
    award_date: Optional[str] = None


class ResearchProjectCreate(BaseModel):
    academic_year: str
    title: Optional[str] = None
    agency: Optional[str] = None
    period: Optional[str] = None
    investigator_type: Optional[str] = None
    grant_amount: Optional[float] = None


class PatentCreate(BaseModel):
    academic_year: str
    title: Optional[str] = None
    patent_number: Optional[str] = None


class ConferenceCreate(BaseModel):
    academic_year: str
    paper_title: Optional[str] = None
    issn_isbn: Optional[str] = None
    conference_details: Optional[str] = None
    level: Optional[str] = None


# Profile endpoints
@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_faculty)):
    """Get current faculty member's profile"""
    user_id = current_user.get("sub")
    
    # Get profile
    result = supabase.table("faculty_profiles").select("*").eq("user_id", user_id).execute()
    
    if result.data:
        return {"profile": result.data[0], "exists": True}
    
    # Return user basic info if no profile yet
    return {
        "profile": {
            "name": current_user.get("name"),
            "email": current_user.get("email"),
            "employee_id": current_user.get("employee_id")
        },
        "exists": False
    }


@router.post("/profile")
async def update_profile(profile: ProfileUpdate, current_user: dict = Depends(get_current_faculty)):
    """Create or update faculty profile"""
    user_id = current_user.get("sub")
    
    # Check if profile exists
    existing = supabase.table("faculty_profiles").select("id").eq("user_id", user_id).execute()
    
    profile_data = {k: v for k, v in profile.dict().items() if v is not None}
    profile_data["user_id"] = user_id
    
    if existing.data:
        # Update existing
        result = supabase.table("faculty_profiles").update(profile_data).eq("user_id", user_id).execute()
    else:
        # Create new
        result = supabase.table("faculty_profiles").insert(profile_data).execute()
    
    return {"message": "Profile updated successfully", "profile": result.data[0] if result.data else None}


@router.post("/profile/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_faculty)
):
    """Upload faculty profile photo to Supabase storage"""
    user_id = current_user.get("sub")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{user_id}.{ext}"
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload to Supabase storage
        result = supabase.storage.from_("profile-pictures").upload(
            filename,
            content,
            {"content-type": file.content_type, "upsert": "true"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_("profile-pictures").get_public_url(filename)
        
        # Update profile with photo URL
        supabase.table("faculty_profiles").update({"photo_url": public_url}).eq("user_id", user_id).execute()
        
        return {"message": "Photo uploaded successfully", "photo_url": public_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# Publications endpoints
@router.get("/publications")
async def get_publications(
    academic_year: Optional[str] = None,
    current_user: dict = Depends(get_current_faculty)
):
    """Get faculty publications, optionally filtered by academic year"""
    user_id = current_user.get("sub")
    
    query = supabase.table("publications").select("*").eq("user_id", user_id)
    
    if academic_year:
        query = query.eq("academic_year", academic_year)
    
    result = query.order("created_at", desc=True).execute()
    return {"publications": result.data}


@router.post("/publications")
async def add_publication(pub: PublicationCreate, current_user: dict = Depends(get_current_faculty)):
    """Add a new publication"""
    user_id = current_user.get("sub")
    
    data = pub.dict()
    data["user_id"] = user_id
    
    result = supabase.table("publications").insert(data).execute()
    return {"message": "Publication added", "publication": result.data[0] if result.data else None}


@router.delete("/publications/{pub_id}")
async def delete_publication(pub_id: str, current_user: dict = Depends(get_current_faculty)):
    """Delete a publication"""
    user_id = current_user.get("sub")
    
    result = supabase.table("publications").delete().eq("id", pub_id).eq("user_id", user_id).execute()
    return {"message": "Publication deleted"}


# Awards endpoints
@router.get("/awards")
async def get_awards(academic_year: Optional[str] = None, current_user: dict = Depends(get_current_faculty)):
    user_id = current_user.get("sub")
    query = supabase.table("awards").select("*").eq("user_id", user_id)
    if academic_year:
        query = query.eq("academic_year", academic_year)
    result = query.order("created_at", desc=True).execute()
    return {"awards": result.data}


@router.post("/awards")
async def add_award(award: AwardCreate, current_user: dict = Depends(get_current_faculty)):
    user_id = current_user.get("sub")
    data = award.dict()
    data["user_id"] = user_id
    result = supabase.table("awards").insert(data).execute()
    return {"message": "Award added", "award": result.data[0] if result.data else None}


# Research Projects endpoints
@router.get("/research-projects")
async def get_research_projects(academic_year: Optional[str] = None, current_user: dict = Depends(get_current_faculty)):
    user_id = current_user.get("sub")
    query = supabase.table("research_projects").select("*").eq("user_id", user_id)
    if academic_year:
        query = query.eq("academic_year", academic_year)
    result = query.order("created_at", desc=True).execute()
    return {"research_projects": result.data}


@router.post("/research-projects")
async def add_research_project(project: ResearchProjectCreate, current_user: dict = Depends(get_current_faculty)):
    user_id = current_user.get("sub")
    data = project.dict()
    data["user_id"] = user_id
    result = supabase.table("research_projects").insert(data).execute()
    return {"message": "Research project added", "project": result.data[0] if result.data else None}


# Patents endpoints
@router.get("/patents")
async def get_patents(academic_year: Optional[str] = None, current_user: dict = Depends(get_current_faculty)):
    user_id = current_user.get("sub")
    query = supabase.table("patents").select("*").eq("user_id", user_id)
    if academic_year:
        query = query.eq("academic_year", academic_year)
    result = query.order("created_at", desc=True).execute()
    return {"patents": result.data}


@router.post("/patents")
async def add_patent(patent: PatentCreate, current_user: dict = Depends(get_current_faculty)):
    user_id = current_user.get("sub")
    data = patent.dict()
    data["user_id"] = user_id
    result = supabase.table("patents").insert(data).execute()
    return {"message": "Patent added", "patent": result.data[0] if result.data else None}


# Conferences endpoints
@router.get("/conferences")
async def get_conferences(academic_year: Optional[str] = None, current_user: dict = Depends(get_current_faculty)):
    user_id = current_user.get("sub")
    query = supabase.table("conferences").select("*").eq("user_id", user_id)
    if academic_year:
        query = query.eq("academic_year", academic_year)
    result = query.order("created_at", desc=True).execute()
    return {"conferences": result.data}


@router.post("/conferences")
async def add_conference(conf: ConferenceCreate, current_user: dict = Depends(get_current_faculty)):
    user_id = current_user.get("sub")
    data = conf.dict()
    data["user_id"] = user_id
    result = supabase.table("conferences").insert(data).execute()
    return {"message": "Conference added", "conference": result.data[0] if result.data else None}


# Get all data for faculty
@router.get("/all-data")
async def get_all_faculty_data(
    academic_year: Optional[str] = None,
    current_user: dict = Depends(get_current_faculty)
):
    """Get all data for the current faculty member"""
    user_id = current_user.get("sub")
    
    def get_table_data(table_name):
        query = supabase.table(table_name).select("*").eq("user_id", user_id)
        if academic_year and table_name not in ["faculty_profiles", "previous_work", "courses_taught", "pg_dissertations"]:
            query = query.eq("academic_year", academic_year)
        return query.execute().data
    
    return {
        "profile": get_table_data("faculty_profiles"),
        "previous_work": get_table_data("previous_work"),
        "courses_taught": get_table_data("courses_taught"),
        "publications": get_table_data("publications"),
        "book_publications": get_table_data("book_publications"),
        "awards": get_table_data("awards"),
        "ict_creations": get_table_data("ict_creations"),
        "research_guidance": get_table_data("research_guidance"),
        "pg_dissertations": get_table_data("pg_dissertations"),
        "research_projects": get_table_data("research_projects"),
        "patents": get_table_data("patents"),
        "conferences": get_table_data("conferences"),
        "seminars": get_table_data("seminars"),
        "lectures": get_table_data("lectures"),
        "other_details": get_table_data("other_details"),
        "memberships": get_table_data("memberships")
    }


# Faculty self PDF download
@router.get("/export/my-pdf")
async def export_my_pdf(
    academic_year: Optional[str] = None,
    current_user: dict = Depends(get_current_faculty)
):
    """Export current faculty member's data as PDF"""
    from fastapi.responses import StreamingResponse
    from services.export_service import generate_faculty_pdf
    import io
    
    user_id = current_user.get("sub")
    
    # Get faculty user info
    user_result = supabase.table("faculty_users").select("*").eq("id", user_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    faculty_user = user_result.data[0]
    
    # Helper to get table data
    def get_table_data(table_name, has_academic_year=True):
        query = supabase.table(table_name).select("*").eq("user_id", user_id)
        if academic_year and has_academic_year:
            query = query.eq("academic_year", academic_year)
        return query.execute().data
    
    data = {
        "user": {
            "id": faculty_user["id"],
            "name": faculty_user["name"],
            "email": faculty_user["email"],
            "employee_id": faculty_user["employee_id"],
            "phone": faculty_user.get("phone")
        },
        "profile": get_table_data("faculty_profiles", False),
        "publications": get_table_data("publications"),
        "book_publications": get_table_data("book_publications"),
        "awards": get_table_data("awards"),
        "research_projects": get_table_data("research_projects"),
        "patents": get_table_data("patents"),
        "conferences": get_table_data("conferences"),
        "seminars": get_table_data("seminars"),
        "lectures": get_table_data("lectures"),
        "memberships": get_table_data("memberships")
    }
    
    # Generate PDF
    pdf_buffer = generate_faculty_pdf(data, academic_year)
    
    filename = f"my_profile_{faculty_user['employee_id']}_{academic_year or 'all'}.pdf"
    
    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
