-- Fix offices table to use geographic_hierarchy for region selection
-- Issue: Region should be fetched from geographic_hierarchy table, not free text

-- Update offices table structure to use foreign key to geographic_hierarchy
ALTER TABLE public.offices
DROP COLUMN IF EXISTS region,
DROP COLUMN IF EXISTS district,
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.geographic_hierarchy(id),
ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.geographic_hierarchy(id);

-- Ensure RLS is enabled
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
DROP POLICY IF EXISTS "Anyone can view offices" ON public.offices;
DROP POLICY IF EXISTS "Admins can manage offices" ON public.offices;
DROP POLICY IF EXISTS "Service role can manage offices" ON public.offices;

CREATE POLICY "Anyone can view offices" ON public.offices
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage offices" ON public.offices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Service role can manage offices" ON public.offices
    FOR ALL USING (auth.role() = 'service_role');

-- Create a view to make it easier to fetch offices with region/district names
CREATE OR REPLACE VIEW public.offices_with_hierarchy AS
SELECT 
    o.id,
    o.name,
    o.level,
    o.created_at,
    gr.name as region_name,
    gr.code as region_code,
    gd.name as district_name,
    gd.code as district_code
FROM public.offices o
LEFT JOIN public.geographic_hierarchy gr ON o.region_id = gr.id AND gr.level = 'region'
LEFT JOIN public.geographic_hierarchy gd ON o.district_id = gd.id AND gd.level = 'district';

-- Grant permissions on view
ALTER VIEW public.offices_with_hierarchy OWNER TO authenticated;
