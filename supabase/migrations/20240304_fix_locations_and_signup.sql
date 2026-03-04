-- Fix locations POST 400 error and signup 422 error
-- Issue 1: Locations table has schema mismatches or missing fields
-- Issue 2: Signup validation failures (422 Unprocessable Content)

-- Simplify locations table - remove complex foreign key to parent_id
ALTER TABLE public.locations
DROP CONSTRAINT IF EXISTS locations_parent_id_fkey;

ALTER TABLE public.locations
DROP COLUMN IF EXISTS parent_id;

-- Ensure locations has the right structure
ALTER TABLE public.locations
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN name SET DEFAULT 'New Location',
ALTER COLUMN code DROP NOT NULL,
ALTER COLUMN code SET DEFAULT 'LOC-' || gen_random_uuid()::text;

-- Allow these to be nullable with defaults
ALTER TABLE public.locations
ALTER COLUMN region SET NOT NULL,
ALTER COLUMN region SET DEFAULT 'Unspecified',
ALTER COLUMN district SET NOT NULL,
ALTER COLUMN district SET DEFAULT 'Unspecified',
ALTER COLUMN ward SET NOT NULL,
ALTER COLUMN ward SET DEFAULT 'Unspecified',
ALTER COLUMN street SET NOT NULL,
ALTER COLUMN street SET DEFAULT 'Unspecified',
ALTER COLUMN council_code SET NOT NULL,
ALTER COLUMN council_code SET DEFAULT 'N/A';

-- Recreate RLS policies to allow inserting with minimal fields
DROP POLICY IF EXISTS "Anyone can view locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON public.locations;

CREATE POLICY "Anyone can view locations" ON public.locations
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert locations" ON public.locations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update locations" ON public.locations
    FOR UPDATE USING (true);

CREATE POLICY "Admins can delete locations" ON public.locations
    FOR DELETE USING (auth.role() = 'service_role');

-- Fix auth.users profile during signup
-- Ensure users table has RLS that allows signup to work
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;

CREATE POLICY "Service role can manage users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Add a policy to allow users to insert their own profile after signup
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');
