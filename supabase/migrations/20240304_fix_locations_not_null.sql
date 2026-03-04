-- Fix locations table NOT NULL constraint error
-- Issue: POST requests fail because region, district, ward, street, council_code are NOT NULL
-- but the application doesn't always provide all these fields

-- Make less critical columns nullable with default values
ALTER TABLE public.locations
ALTER COLUMN region DROP NOT NULL,
ALTER COLUMN district DROP NOT NULL,
ALTER COLUMN ward DROP NOT NULL,
ALTER COLUMN street DROP NOT NULL,
ALTER COLUMN council_code DROP NOT NULL;

-- Set default values for nullable columns
ALTER TABLE public.locations
ALTER COLUMN region SET DEFAULT 'Unspecified',
ALTER COLUMN district SET DEFAULT 'Unspecified',
ALTER COLUMN ward SET DEFAULT 'Unspecified',
ALTER COLUMN street SET DEFAULT 'Unspecified',
ALTER COLUMN council_code SET DEFAULT 'N/A';

-- Update existing NULL values to defaults
UPDATE public.locations SET region = 'Unspecified' WHERE region IS NULL;
UPDATE public.locations SET district = 'Unspecified' WHERE district IS NULL;
UPDATE public.locations SET ward = 'Unspecified' WHERE ward IS NULL;
UPDATE public.locations SET street = 'Unspecified' WHERE street IS NULL;
UPDATE public.locations SET council_code = 'N/A' WHERE council_code IS NULL;

-- Ensure RLS is enabled
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies to ensure they exist
DROP POLICY IF EXISTS "Anyone can view locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON public.locations;

CREATE POLICY "Anyone can view locations" ON public.locations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert locations" ON public.locations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Authenticated users can update locations" ON public.locations
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admins can delete locations" ON public.locations
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
