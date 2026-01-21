"""
CLI command to create admin user
Run: python create_admin.py
"""
import sys
import getpass
from database import supabase
from services.auth_utils import hash_password


def create_admin():
    """Interactive CLI to create an admin user"""
    print("\n" + "="*50)
    print("   FACULTY MANAGEMENT SYSTEM - CREATE ADMIN")
    print("="*50 + "\n")
    
    # Get admin details
    name = input("Enter admin name: ").strip()
    if not name:
        print("Error: Name is required")
        sys.exit(1)
    
    email = input("Enter admin email: ").strip()
    if not email or "@" not in email:
        print("Error: Valid email is required")
        sys.exit(1)
    
    # Check if email already exists
    existing = supabase.table("admins").select("id").eq("email", email).execute()
    if existing.data:
        print(f"Error: Admin with email '{email}' already exists")
        sys.exit(1)
    
    # Get password
    password = getpass.getpass("Enter password: ")
    if len(password) < 6:
        print("Error: Password must be at least 6 characters")
        sys.exit(1)
    
    confirm_password = getpass.getpass("Confirm password: ")
    if password != confirm_password:
        print("Error: Passwords do not match")
        sys.exit(1)
    
    # Hash password and create admin
    hashed = hash_password(password)
    
    try:
        result = supabase.table("admins").insert({
            "email": email,
            "password_hash": hashed,
            "name": name,
            "is_active": True
        }).execute()
        
        if result.data:
            print("\n" + "="*50)
            print("   ✓ ADMIN CREATED SUCCESSFULLY!")
            print("="*50)
            print(f"\n   Name:  {name}")
            print(f"   Email: {email}")
            print("\n   You can now login at /templates/login.html")
            print("="*50 + "\n")
        else:
            print("Error: Failed to create admin")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    create_admin()
