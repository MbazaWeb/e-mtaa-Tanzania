-- Fix duplicate policy error - clean all policies before recreating
-- Issue: Policy "Users can update own profile" already exists

-- Drop ALL policies from users table first
DROP POLICY IF EXISTS "All can view users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Staff can view all citizens" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Users can manage own records" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Admins full access users" ON public.users;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Anyone can view staff list" ON public.users;
DROP POLICY IF EXISTS "Staff can view profiles for management" ON public.users;

-- Drop ALL policies from applications table
DROP POLICY IF EXISTS "All can view applications" ON public.applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can search applications by number" ON public.applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can view and update all applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;

-- Drop ALL policies from payments table
DROP POLICY IF EXISTS "All can view payments" ON public.payments;

-- Now create clean, permissive policies for development
-- Users table policies
CREATE POLICY "view_all_users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "insert_own_user" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "update_own_user" ON public.users
    FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "delete_own_user" ON public.users
    FOR DELETE USING (auth.uid() = id OR auth.role() = 'service_role');

-- Applications table policies
CREATE POLICY "view_all_applications" ON public.applications
    FOR SELECT USING (true);

CREATE POLICY "insert_application" ON public.applications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "update_application" ON public.applications
    FOR UPDATE USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Payments table policies
CREATE POLICY "view_all_payments" ON public.payments
    FOR SELECT USING (true);

CREATE POLICY "insert_payment" ON public.payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
