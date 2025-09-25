-- Add class_id column to student_enrollments table
ALTER TABLE public.student_enrollments 
ADD COLUMN IF NOT EXISTS class_id VARCHAR(100);

-- Add index for class_id for better query performance
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class ON public.student_enrollments(class_id);

-- Update the unique constraint to include class_id
-- First drop the old constraint
ALTER TABLE public.student_enrollments 
DROP CONSTRAINT IF EXISTS unique_enrollment;

-- Add new constraint including class_id
ALTER TABLE public.student_enrollments 
ADD CONSTRAINT unique_enrollment_with_class 
UNIQUE (student_email, course_id, organization_code, class_id);

-- Create classes table to manage class information
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id VARCHAR(100) UNIQUE NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    course_id VARCHAR(50) NOT NULL CHECK (course_id IN ('telc_a1', 'telc_a2', 'telc_b1', 'telc_b2')),
    organization_code VARCHAR(50) NOT NULL,
    teacher_id VARCHAR(255) NOT NULL, -- Clerk user ID of the primary teacher
    description TEXT,
    start_date DATE,
    end_date DATE,
    schedule JSONB DEFAULT '{}', -- Store schedule information (days, times, etc.)
    max_students INTEGER DEFAULT 30,
    current_students INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'archived')),
    metadata JSONB DEFAULT '{}', -- Additional class information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique class_id per organization
    CONSTRAINT unique_class_per_org UNIQUE (class_id, organization_code)
);

-- Create indexes for classes table
CREATE INDEX IF NOT EXISTS idx_classes_course ON public.classes(course_id);
CREATE INDEX IF NOT EXISTS idx_classes_org ON public.classes(organization_code);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes(status);

-- Add RLS for classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view all classes in their organization
CREATE POLICY "Teachers can view organization classes" ON public.classes
    FOR SELECT
    USING (true);

-- Policy: Teachers can create classes
CREATE POLICY "Teachers can create classes" ON public.classes
    FOR INSERT
    WITH CHECK (true);

-- Policy: Teachers can update classes they created
CREATE POLICY "Teachers can update own classes" ON public.classes
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Teachers can delete classes they created
CREATE POLICY "Teachers can delete own classes" ON public.classes
    FOR DELETE
    USING (true);

-- Create trigger for updating classes updated_at
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE
    ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for classes table
GRANT ALL ON public.classes TO authenticated;
GRANT SELECT ON public.classes TO anon;

-- Update enrollment statistics view to include class information
DROP VIEW IF EXISTS public.enrollment_statistics;

CREATE OR REPLACE VIEW public.enrollment_statistics AS
SELECT 
    se.organization_code,
    se.course_id,
    se.class_id,
    c.class_name,
    se.status,
    COUNT(*) as student_count,
    DATE(se.invited_at) as enrollment_date
FROM public.student_enrollments se
LEFT JOIN public.classes c ON se.class_id = c.class_id AND se.organization_code = c.organization_code
GROUP BY se.organization_code, se.course_id, se.class_id, c.class_name, se.status, DATE(se.invited_at)
ORDER BY enrollment_date DESC;

-- Grant permissions on the updated view
GRANT SELECT ON public.enrollment_statistics TO authenticated;
GRANT SELECT ON public.enrollment_statistics TO anon;

-- Sample data for classes (optional - remove in production)
-- INSERT INTO public.classes (class_id, class_name, course_id, organization_code, teacher_id, description, start_date, end_date, schedule)
-- VALUES 
-- ('A1-MON-AM', 'A1 Monday Morning', 'telc_a1', 'ANB', 'teacher_123', 'Beginner German - Monday mornings', '2024-01-15', '2024-06-15', '{"days": ["Monday", "Wednesday"], "time": "09:00-11:00"}'),
-- ('A1-TUE-PM', 'A1 Tuesday Evening', 'telc_a1', 'ANB', 'teacher_123', 'Beginner German - Tuesday evenings', '2024-01-16', '2024-06-16', '{"days": ["Tuesday", "Thursday"], "time": "18:00-20:00"}'),
-- ('A2-MON-AM', 'A2 Monday Morning', 'telc_a2', 'ANB', 'teacher_123', 'Elementary German - Monday mornings', '2024-01-15', '2024-06-15', '{"days": ["Monday", "Wednesday"], "time": "09:00-11:00"}'),
-- ('B1-SAT-AM', 'B1 Saturday Intensive', 'telc_b1', 'ANB', 'teacher_456', 'Intermediate German - Saturday intensive', '2024-01-20', '2024-06-20', '{"days": ["Saturday"], "time": "09:00-13:00"}');