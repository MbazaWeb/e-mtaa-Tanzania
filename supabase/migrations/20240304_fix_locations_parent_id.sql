-- Fix locations table POST error (400 Bad Request)
-- Issue: POST requests include parent_id column but it doesn't exist in locations table

-- Add parent_id column to locations table (for geographic hierarchy support)
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.geographic_hierarchy(id);

-- Create RLS policies for locations to allow public access
DROP POLICY IF EXISTS "Anyone can view locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON public.locations;

CREATE POLICY "Anyone can view locations" ON public.locations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert locations" ON public.locations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admins can manage locations" ON public.locations
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete locations" ON public.locations
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
