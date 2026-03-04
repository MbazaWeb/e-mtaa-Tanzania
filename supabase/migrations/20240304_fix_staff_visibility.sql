-- Fix staff visibility in "Sajili Mtumishi Mpya" (Register New Staff)
-- Issue: Staff records exist but not visible in the staff management interface

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for users table to ensure staff visibility
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Staff can view profiles for management" ON public.users;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow staff to view all user profiles (for staff management)
CREATE POLICY "Staff can view all profiles" ON public.users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
    );

-- Allow authenticated to view staff list (for staff management pages)
CREATE POLICY "Anyone can view staff list" ON public.users
    FOR SELECT USING (role IN ('staff', 'admin'));

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins full access to manage staff
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow service role to insert/update users (for backend, registration)
CREATE POLICY "Service role can manage users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Create a view for easier staff management
CREATE OR REPLACE VIEW public.staff_members AS
SELECT 
    id,
    first_name,
    middle_name,
    last_name,
    email,
    phone,
    role,
    office_id,
    assigned_region,
    assigned_district,
    is_verified,
    created_at
FROM public.users
WHERE role IN ('staff', 'admin')
ORDER BY created_at DESC;

-- Ensure the view is readable
GRANT SELECT ON public.staff_members TO authenticated;
