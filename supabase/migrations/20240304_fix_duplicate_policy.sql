-- Fix duplicate policy error
-- Issue: "Users can insert their own profile" policy already exists

-- Drop the conflicting policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Recreate it properly
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');
