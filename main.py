"""
Faculty Management System - Main FastAPI Application
"""
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import os

# Import routers
from routers import auth, faculty, admin

# Create FastAPI app
app = FastAPI(
    title="Faculty Management System",
    description="Engineering College Faculty Information Management System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Include routers
app.include_router(auth.router)
app.include_router(faculty.router)
app.include_router(admin.router)


# Template routes
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Redirect to login page"""
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/templates/{template_name}", response_class=HTMLResponse)
async def serve_template(request: Request, template_name: str):
    """Serve HTML templates"""
    try:
        return templates.TemplateResponse(template_name, {"request": request})
    except Exception:
        return HTMLResponse(content="Template not found", status_code=404)


# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Faculty Management System is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
