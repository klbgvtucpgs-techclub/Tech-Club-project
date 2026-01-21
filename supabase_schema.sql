-- ============================================
-- FACULTY MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ADMINS TABLE (Separate Admin Authentication)
-- ============================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. FACULTY USERS TABLE (Faculty Authentication)
-- ============================================
CREATE TABLE faculty_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. FACULTY PROFILES (Extended Details)
-- ============================================
CREATE TABLE faculty_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES faculty_users(id) ON DELETE CASCADE,
    name_prefix VARCHAR(20),
    name VARCHAR(255),
    designation VARCHAR(100),
    department VARCHAR(100),
    employee_id VARCHAR(100),
    faculty_id VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PREVIOUS WORK EXPERIENCE
-- ============================================
CREATE TABLE previous_work (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    institution VARCHAR(255),
    position_held VARCHAR(255),
    from_year INTEGER,
    to_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. COURSES TAUGHT
-- ============================================
CREATE TABLE courses_taught (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    course_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. PUBLICATIONS (Research Papers in Journals)
-- ============================================
CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    authors TEXT,
    title VARCHAR(500),
    journal_name VARCHAR(255),
    issn_isbn VARCHAR(100),
    url TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. BOOK PUBLICATIONS
-- ============================================
CREATE TABLE book_publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    chapter_book_name VARCHAR(500),
    level VARCHAR(50),
    editor_author VARCHAR(255),
    issn_isbn VARCHAR(100),
    url TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. AWARDS
-- ============================================
CREATE TABLE awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    title VARCHAR(500),
    awarding_agency VARCHAR(255),
    level VARCHAR(50),
    award_date DATE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. ICT CREATIONS
-- ============================================
CREATE TABLE ict_creations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    title VARCHAR(500),
    content TEXT,
    url TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. RESEARCH GUIDANCE
-- ============================================
CREATE TABLE research_guidance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    number_enrolled INTEGER,
    thesis_submitted INTEGER,
    degree_awarded INTEGER,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. PG DISSERTATIONS
-- ============================================
CREATE TABLE pg_dissertations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    student_name VARCHAR(255),
    usn VARCHAR(100),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. RESEARCH PROJECTS
-- ============================================
CREATE TABLE research_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    title VARCHAR(500),
    agency VARCHAR(255),
    period VARCHAR(100),
    investigator_type VARCHAR(100),
    grant_amount DECIMAL(15, 2),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. PATENTS
-- ============================================
CREATE TABLE patents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    title VARCHAR(500),
    patent_number VARCHAR(100),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. CONFERENCES
-- ============================================
CREATE TABLE conferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    paper_title VARCHAR(500),
    issn_isbn VARCHAR(100),
    conference_details TEXT,
    level VARCHAR(100),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. SEMINARS/WORKSHOPS
-- ============================================
CREATE TABLE seminars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    title VARCHAR(500),
    details TEXT,
    degree_awarded VARCHAR(255),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 15. INVITED LECTURES
-- ============================================
CREATE TABLE lectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    lecture_name VARCHAR(500),
    lecture_date DATE,
    location VARCHAR(255),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 16. OTHER DETAILS
-- ============================================
CREATE TABLE other_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    details TEXT,
    detail_date DATE,
    location VARCHAR(255),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 17. PROFESSIONAL MEMBERSHIPS
-- ============================================
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES faculty_users(id) ON DELETE CASCADE,
    si_no INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    details TEXT,
    institute VARCHAR(255),
    date_period VARCHAR(100),
    location VARCHAR(255),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_faculty_users_email ON faculty_users(email);
CREATE INDEX idx_faculty_users_employee_id ON faculty_users(employee_id);
CREATE INDEX idx_publications_academic_year ON publications(academic_year);
CREATE INDEX idx_awards_academic_year ON awards(academic_year);
CREATE INDEX idx_research_projects_academic_year ON research_projects(academic_year);
CREATE INDEX idx_patents_academic_year ON patents(academic_year);
CREATE INDEX idx_conferences_academic_year ON conferences(academic_year);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Note: Since we're using custom auth (not Supabase Auth),
-- RLS policies are simplified. Backend handles authorization.
-- ============================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service role (backend will use service key)
CREATE POLICY "Service role has full access" ON admins FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON faculty_users FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON faculty_profiles FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON publications FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON awards FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON research_projects FOR ALL USING (true);

-- ============================================
-- STORAGE BUCKET (Profile Pictures)
-- ============================================

-- Create bucket for faculty profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-pictures bucket (public read)
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Service role can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Service role can update profile pictures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Service role can delete profile pictures"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-pictures');

-- ============================================
-- DONE! 18 Tables + 1 Storage Bucket created.
-- Run this in Supabase SQL Editor.
-- ============================================
