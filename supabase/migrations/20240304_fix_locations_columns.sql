-- Fix locations table query error (400 Bad Request)
-- Issue: Queries using level=eq.region and order=name.asc fail because:
-- 1. locations table has no "level" column
-- 2. locations table has no "name" column

-- Create a geographic_hierarchy table for region/district/ward management
CREATE TABLE IF NOT EXISTS public.geographic_hierarchy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('region', 'district', 'ward')),
    parent_id UUID REFERENCES public.geographic_hierarchy(id),
    code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'ward';

-- Update existing locations with name (region + "-" + district if not set)
UPDATE public.locations 
SET name = region || ' - ' || district 
WHERE name IS NULL;

-- Enable RLS
ALTER TABLE public.geographic_hierarchy ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for geographic_hierarchy
DROP POLICY IF EXISTS "Anyone can view geographic hierarchy" ON public.geographic_hierarchy;

CREATE POLICY "Anyone can view geographic hierarchy" ON public.geographic_hierarchy
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage geographic hierarchy" ON public.geographic_hierarchy
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Seed geographic hierarchy with key regions
INSERT INTO public.geographic_hierarchy (name, level, code)
VALUES
    ('Dar es Salaam', 'region', 'DSM'),
    ('Arusha', 'region', 'ARU'),
    ('Kilimanjaro', 'region', 'KLM'),
    ('Mbeya', 'region', 'MBY'),
    ('Mwanza', 'region', 'MWZ'),
    ('Dodoma', 'region', 'DOD'),
    ('Iringa', 'region', 'IRG'),
    ('Morogoro', 'region', 'MOR'),
    ('Tanga', 'region', 'TGA'),
    ('Kigali', 'region', 'KGL')
ON CONFLICT (code) DO NOTHING;
