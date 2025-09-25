-- Create student_enrollments table for managing course enrollments
CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email VARCHAR(255) NOT NULL,
    course_id VARCHAR(50) NOT NULL CHECK (course_id IN ('telc_a1', 'telc_a2', 'telc_b1', 'telc_b2')),
    organization_code VARCHAR(50) NOT NULL,
    invited_by VARCHAR(255) NOT NULL, -- Clerk user ID of the teacher who invited
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive', 'completed')),
    enrollment_data JSONB DEFAULT '{}', -- Additional metadata
    activated_at TIMESTAMP WITH TIME ZONE, -- When student first logged in
    completed_at TIMESTAMP WITH TIME ZONE, -- When student completed the course
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique enrollment per student per course per organization
    CONSTRAINT unique_enrollment UNIQUE (student_email, course_id, organization_code)
);

-- Create indexes for better query performance
CREATE INDEX idx_student_enrollments_email ON public.student_enrollments(student_email);
CREATE INDEX idx_student_enrollments_course ON public.student_enrollments(course_id);
CREATE INDEX idx_student_enrollments_org ON public.student_enrollments(organization_code);
CREATE INDEX idx_student_enrollments_status ON public.student_enrollments(status);
CREATE INDEX idx_student_enrollments_invited_by ON public.student_enrollments(invited_by);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view all enrollments in their organization
CREATE POLICY "Teachers can view organization enrollments" ON public.student_enrollments
    FOR SELECT
    USING (true); -- You might want to add organization-based restrictions here

-- Policy: Teachers can insert new enrollments
CREATE POLICY "Teachers can create enrollments" ON public.student_enrollments
    FOR INSERT
    WITH CHECK (true); -- You might want to add role-based restrictions here

-- Policy: Teachers can update enrollments they created
CREATE POLICY "Teachers can update own enrollments" ON public.student_enrollments
    FOR UPDATE
    USING (true) -- You might want to add restrictions based on invited_by
    WITH CHECK (true);

-- Policy: Teachers can delete enrollments they created
CREATE POLICY "Teachers can delete own enrollments" ON public.student_enrollments
    FOR DELETE
    USING (true); -- You might want to add restrictions based on invited_by

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_student_enrollments_updated_at BEFORE UPDATE
    ON public.student_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON public.student_enrollments TO authenticated;
GRANT SELECT ON public.student_enrollments TO anon;

-- Optional: Create a view for enrollment statistics
CREATE OR REPLACE VIEW public.enrollment_statistics AS
SELECT 
    organization_code,
    course_id,
    status,
    COUNT(*) as student_count,
    DATE(invited_at) as enrollment_date
FROM public.student_enrollments
GROUP BY organization_code, course_id, status, DATE(invited_at)
ORDER BY enrollment_date DESC;

-- Grant permissions on the view
GRANT SELECT ON public.enrollment_statistics TO authenticated;
GRANT SELECT ON public.enrollment_statistics TO anon;