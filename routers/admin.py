"""
Admin Router - Admin dashboard data management and exports
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import io

from database import supabase
from services.auth_utils import decode_access_token

router = APIRouter(prefix="/api/admin", tags=["Admin"])
security = HTTPBearer()


# Dependency to get current admin user
async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    if payload.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return payload


@router.get("/faculty")
async def get_all_faculty(
    search: Optional[str] = None,
    department: Optional[str] = None,
    designation: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Get all faculty members with optional search/filter"""
    query = supabase.table("faculty_users").select("id, name, email, employee_id, phone, is_active, created_at")
    
    if search:
        query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,employee_id.ilike.%{search}%")
    
    result = query.order("created_at", desc=True).execute()
    
    # Get profiles for additional info
    faculty_list = []
    for faculty in result.data:
        profile_result = supabase.table("faculty_profiles").select("designation, department").eq("user_id", faculty["id"]).execute()
        profile = profile_result.data[0] if profile_result.data else {}
        
        # Filter by department if specified
        if department and profile.get("department") != department:
            continue
        
        # Filter by designation if specified
        if designation and profile.get("designation") != designation:
            continue
            
        faculty_list.append({
            **faculty,
            "designation": profile.get("designation"),
            "department": profile.get("department")
        })
    
    return {"faculty": faculty_list, "total": len(faculty_list)}


@router.get("/faculty/{faculty_id}")
async def get_faculty_details(
    faculty_id: str,
    academic_year: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Get detailed information about a specific faculty member"""
    # Get faculty user
    user_result = supabase.table("faculty_users").select("*").eq("id", faculty_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    faculty_user = user_result.data[0]
    
    # Helper to get table data
    def get_table_data(table_name, has_academic_year=True):
        query = supabase.table(table_name).select("*").eq("user_id", faculty_id)
        if academic_year and has_academic_year:
            query = query.eq("academic_year", academic_year)
        return query.execute().data
    
    return {
        "user": {
            "id": faculty_user["id"],
            "name": faculty_user["name"],
            "email": faculty_user["email"],
            "employee_id": faculty_user["employee_id"],
            "phone": faculty_user["phone"]
        },
        "profile": get_table_data("faculty_profiles", False),
        "previous_work": get_table_data("previous_work", False),
        "courses_taught": get_table_data("courses_taught", False),
        "publications": get_table_data("publications"),
        "book_publications": get_table_data("book_publications"),
        "awards": get_table_data("awards"),
        "ict_creations": get_table_data("ict_creations"),
        "research_guidance": get_table_data("research_guidance"),
        "pg_dissertations": get_table_data("pg_dissertations", False),
        "research_projects": get_table_data("research_projects"),
        "patents": get_table_data("patents"),
        "conferences": get_table_data("conferences"),
        "seminars": get_table_data("seminars"),
        "lectures": get_table_data("lectures"),
        "other_details": get_table_data("other_details"),
        "memberships": get_table_data("memberships")
    }


@router.get("/export/faculty/{faculty_id}/pdf")
async def export_faculty_pdf(
    faculty_id: str,
    academic_year: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Export a single faculty member's data as PDF"""
    from services.export_service import generate_faculty_pdf
    
    # Get faculty data
    data = await get_faculty_details(faculty_id, academic_year, current_user)
    
    # Generate PDF
    pdf_buffer = generate_faculty_pdf(data, academic_year)
    
    filename = f"faculty_{data['user']['employee_id']}_{academic_year or 'all'}.pdf"
    
    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/all/excel")
async def export_all_faculty_excel(
    academic_year: Optional[str] = None,
    department: Optional[str] = None,
    designation: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Export all faculty data as Excel file"""
    from services.export_service import generate_all_faculty_excel
    
    # Get all faculty
    faculty_result = supabase.table("faculty_users").select("id, name, email, employee_id").execute()
    
    all_data = []
    for faculty in faculty_result.data:
        # Get profile
        profile_result = supabase.table("faculty_profiles").select("*").eq("user_id", faculty["id"]).execute()
        profile = profile_result.data[0] if profile_result.data else {}
        
        # Filter by department if specified
        if department and profile.get("department") != department:
            continue
        
        # Filter by designation if specified
        if designation and profile.get("designation") != designation:
            continue
        
        # Get publications count
        pub_query = supabase.table("publications").select("id", count="exact").eq("user_id", faculty["id"])
        if academic_year:
            pub_query = pub_query.eq("academic_year", academic_year)
        pub_result = pub_query.execute()
        
        # Get awards count
        award_query = supabase.table("awards").select("id", count="exact").eq("user_id", faculty["id"])
        if academic_year:
            award_query = award_query.eq("academic_year", academic_year)
        award_result = award_query.execute()
        
        # Get patents count
        patent_query = supabase.table("patents").select("id", count="exact").eq("user_id", faculty["id"])
        if academic_year:
            patent_query = patent_query.eq("academic_year", academic_year)
        patent_result = patent_query.execute()
        
        all_data.append({
            "Name": faculty["name"],
            "Email": faculty["email"],
            "Employee ID": faculty["employee_id"],
            "Designation": profile.get("designation", ""),
            "Department": profile.get("department", ""),
            "Publications": len(pub_result.data) if pub_result.data else 0,
            "Awards": len(award_result.data) if award_result.data else 0,
            "Patents": len(patent_result.data) if patent_result.data else 0
        })
    
    # Generate Excel
    excel_buffer = generate_all_faculty_excel(all_data, academic_year)
    
    filename = f"all_faculty_{academic_year or 'all_years'}.xlsx"
    
    return StreamingResponse(
        io.BytesIO(excel_buffer),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/all/pdf")
async def export_all_faculty_pdf(
    academic_year: Optional[str] = None,
    department: Optional[str] = None,
    designation: Optional[str] = None,
    current_user: dict = Depends(get_current_admin)
):
    """Export all faculty summary as PDF"""
    from services.export_service import generate_all_faculty_summary_pdf
    
    # Get all faculty
    faculty_result = supabase.table("faculty_users").select("id, name, email, employee_id").execute()
    
    all_data = []
    for faculty in faculty_result.data:
        profile_result = supabase.table("faculty_profiles").select("*").eq("user_id", faculty["id"]).execute()
        profile = profile_result.data[0] if profile_result.data else {}
        
        if department and profile.get("department") != department:
            continue
        
        if designation and profile.get("designation") != designation:
            continue
        
        all_data.append({
            "name": faculty["name"],
            "email": faculty["email"],
            "employee_id": faculty["employee_id"],
            "designation": profile.get("designation", ""),
            "department": profile.get("department", "")
        })
    
    pdf_buffer = generate_all_faculty_summary_pdf(all_data, academic_year, department)
    
    filename = f"faculty_summary_{academic_year or 'all'}_{department or 'all_depts'}.pdf"
    
    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/academic-years")
async def get_academic_years(current_user: dict = Depends(get_current_admin)):
    """Get list of all academic years with data"""
    tables = ["publications", "awards", "research_projects", "patents", "conferences"]
    years = set()
    
    for table in tables:
        result = supabase.table(table).select("academic_year").execute()
        for row in result.data:
            if row.get("academic_year"):
                years.add(row["academic_year"])
    
    # Add some default years if empty
    if not years:
        years = {"2024-2025", "2025-2026", "2026-2027"}
    
    return {"academic_years": sorted(list(years), reverse=True)}


@router.get("/departments")
async def get_departments(current_user: dict = Depends(get_current_admin)):
    """Get list of all departments"""
    result = supabase.table("faculty_profiles").select("department").execute()
    departments = set()
    for row in result.data:
        if row.get("department"):
            departments.add(row["department"])
    
    return {"departments": sorted(list(departments))}
