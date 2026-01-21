"""
Database module - Supabase client initialization
"""
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

def get_supabase_client() -> Client:
    """Create and return Supabase client"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL and Key must be set in environment variables")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# Global client instance
supabase: Client = get_supabase_client()
