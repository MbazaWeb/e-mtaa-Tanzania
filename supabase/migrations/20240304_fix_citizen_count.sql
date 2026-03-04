-- Fix "Jumla ya Wananchi" (Total Citizens) showing zero
-- Issue: Dashboard shows 0 citizens even though citizens are signed up

-- Create a view to count citizens safely (bypasses individual row checks)
CREATE OR REPLACE VIEW public.citizen_statistics AS
SELECT 
    COUNT(*) as total_citizens,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_citizens,
    COUNT(CASE WHEN is_diaspora = true THEN 1 END) as diaspora_citizens,
    COUNT(CASE WHEN is_diaspora = false THEN 1 END) as local_citizens
FROM public.users
WHERE role = 'citizen';

-- Grant read access to the view
GRANT SELECT ON public.citizen_statistics TO authenticated;

-- Create another view for staff statistics
CREATE OR REPLACE VIEW public.staff_statistics AS
SELECT 
    COUNT(*) as total_staff,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_staff,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM public.users
WHERE role IN ('staff', 'admin');

GRANT SELECT ON public.staff_statistics TO authenticated;

-- Create view for application statistics
CREATE OR REPLACE VIEW public.application_statistics AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
FROM public.applications;

GRANT SELECT ON public.application_statistics TO authenticated;

-- Ensure users table RLS allows reading citizen count
-- Update the RLS policy to allow staff/admin to see citizen statistics
DROP POLICY IF EXISTS "Anyone can view staff list" ON public.users;

CREATE POLICY "Staff can view all citizens" ON public.users
    FOR SELECT USING (
        role = 'citizen' 
        OR AUTH.uid() = id
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
    );
