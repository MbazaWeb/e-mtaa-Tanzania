-- Fix missing column error and simplify citizen types
-- Issue: country_of_residence column doesn't exist

-- Add missing columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS country_of_residence TEXT DEFAULT 'Tanzania',
ADD COLUMN IF NOT EXISTS is_diaspora BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS citizen_type TEXT DEFAULT 'local' CHECK (citizen_type IN ('local', 'diaspora', 'foreigner'));

-- Set defaults for existing records
UPDATE public.users 
SET country_of_residence = 'Tanzania' 
WHERE country_of_residence IS NULL;

UPDATE public.users 
SET citizen_type = 'local', is_diaspora = false 
WHERE citizen_type IS NULL;

-- Drop and recreate statistics views with safer queries
DROP VIEW IF EXISTS public.dashboard_overview CASCADE;
DROP VIEW IF EXISTS public.citizen_statistics CASCADE;
DROP VIEW IF EXISTS public.staff_statistics CASCADE;
DROP VIEW IF EXISTS public.application_statistics CASCADE;

-- Citizen statistics view
CREATE VIEW public.citizen_statistics AS
SELECT 
    COUNT(*) as total_citizens,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_citizens,
    COUNT(CASE WHEN citizen_type = 'local' THEN 1 END) as local_citizens,
    COUNT(CASE WHEN citizen_type = 'diaspora' THEN 1 END) as diaspora_citizens,
    COUNT(CASE WHEN citizen_type = 'foreigner' THEN 1 END) as foreigner_count
FROM public.users
WHERE role = 'citizen';

GRANT SELECT ON public.citizen_statistics TO authenticated, anon;

-- Staff statistics view
CREATE VIEW public.staff_statistics AS
SELECT 
    COUNT(*) as total_staff,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_staff,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff_count
FROM public.users
WHERE role IN ('staff', 'admin');

GRANT SELECT ON public.staff_statistics TO authenticated, anon;

-- Application statistics view
CREATE VIEW public.application_statistics AS
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

-- Dashboard overview - all statistics combined
CREATE VIEW public.dashboard_overview AS
SELECT 
    (SELECT COUNT(*) FROM public.users WHERE role = 'citizen') as total_citizens,
    (SELECT COUNT(*) FROM public.users WHERE role = 'citizen' AND citizen_type = 'local') as local_citizens,
    (SELECT COUNT(*) FROM public.users WHERE role = 'citizen' AND citizen_type = 'diaspora') as diaspora_citizens,
    (SELECT COUNT(*) FROM public.users WHERE role = 'citizen' AND citizen_type = 'foreigner') as foreigner_count,
    (SELECT COUNT(*) FROM public.users WHERE role IN ('staff', 'admin')) as total_staff,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM public.applications) as total_applications,
    (SELECT COUNT(*) FROM public.applications WHERE status = 'approved') as approved_applications,
    (SELECT COUNT(*) FROM public.applications WHERE status = 'issued') as issued_documents;

GRANT SELECT ON public.dashboard_overview TO authenticated, anon;
