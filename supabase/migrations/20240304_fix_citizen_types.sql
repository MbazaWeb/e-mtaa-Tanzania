-- Fix missing columns and add citizen type statistics
-- Issue 1: is_diaspora column doesn't exist
-- Issue 2: Need to distinguish Tanzania citizens, diaspora, and foreigners

-- Add missing columns to users table if they don't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_diaspora BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS citizen_type TEXT DEFAULT 'local' CHECK (citizen_type IN ('local', 'diaspora', 'foreigner'));

-- Update existing records based on available data
UPDATE public.users 
SET citizen_type = 'local', is_diaspora = false 
WHERE citizen_type IS NULL AND country_of_residence = 'Tanzania';

UPDATE public.users 
SET citizen_type = 'diaspora', is_diaspora = true 
WHERE citizen_type IS NULL AND country_of_residence IS NOT NULL AND country_of_residence != 'Tanzania';

UPDATE public.users 
SET citizen_type = 'local', is_diaspora = false 
WHERE citizen_type IS NULL;

-- Drop and recreate the citizen statistics view
DROP VIEW IF EXISTS public.citizen_statistics CASCADE;

CREATE OR REPLACE VIEW public.citizen_statistics AS
SELECT 
    COUNT(*) as total_citizens,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_citizens,
    COUNT(CASE WHEN citizen_type = 'local' THEN 1 END) as local_citizens,
    COUNT(CASE WHEN citizen_type = 'diaspora' THEN 1 END) as diaspora_citizens,
    COUNT(CASE WHEN citizen_type = 'foreigner' THEN 1 END) as foreigner_count,
    COUNT(CASE WHEN is_diaspora = true THEN 1 END) as diaspora_count
FROM public.users
WHERE role = 'citizen';

GRANT SELECT ON public.citizen_statistics TO authenticated, anon;

-- Drop and recreate staff statistics view
DROP VIEW IF EXISTS public.staff_statistics CASCADE;

CREATE OR REPLACE VIEW public.staff_statistics AS
SELECT 
    COUNT(*) as total_staff,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_staff,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff_count
FROM public.users
WHERE role IN ('staff', 'admin');

GRANT SELECT ON public.staff_statistics TO authenticated, anon;

-- Drop and recreate application statistics view
DROP VIEW IF EXISTS public.application_statistics CASCADE;

CREATE OR REPLACE VIEW public.application_statistics AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(DISTINCT user_id) as unique_applicants
FROM public.applications;

GRANT SELECT ON public.application_statistics TO authenticated, anon;

-- Create a comprehensive dashboard statistics view
CREATE OR REPLACE VIEW public.dashboard_overview AS
SELECT 
    (SELECT total_citizens FROM public.citizen_statistics) as total_citizens,
    (SELECT verified_citizens FROM public.citizen_statistics) as verified_citizens,
    (SELECT local_citizens FROM public.citizen_statistics) as local_citizens,
    (SELECT diaspora_citizens FROM public.citizen_statistics) as diaspora_citizens,
    (SELECT foreigner_count FROM public.citizen_statistics) as foreigner_count,
    (SELECT total_staff FROM public.staff_statistics) as total_staff,
    (SELECT admin_count FROM public.staff_statistics) as admin_count,
    (SELECT total_applications FROM public.application_statistics) as total_applications,
    (SELECT approved_count FROM public.application_statistics) as approved_count,
    (SELECT issued_count FROM public.application_statistics) as issued_count;

GRANT SELECT ON public.dashboard_overview TO authenticated, anon;
