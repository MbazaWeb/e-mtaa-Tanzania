-- Fix duplicate table creation error
-- This migration handles tables safely without causing conflicts

-- Add missing tables that aren't in the main schema
-- Locations table (from 20240302 schema)
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region TEXT NOT NULL,
    district TEXT NOT NULL,
    ward TEXT NOT NULL,
    street TEXT NOT NULL,
    council_code TEXT NOT NULL
);

-- Offices table (for location management)
CREATE TABLE IF NOT EXISTS public.offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    level TEXT, -- 'region' or 'district'
    region TEXT,
    district TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Documents table (from 20240302 schema)
CREATE TABLE IF NOT EXISTS public.generated_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES public.applications(id) NOT NULL,
    document_url TEXT NOT NULL,
    qr_code_url TEXT,
    certificate_id TEXT UNIQUE,
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add location_id column to applications if it doesn't exist
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

-- Enable RLS on new tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for offices
DROP POLICY IF EXISTS "Anyone can view offices" ON public.offices;
DROP POLICY IF EXISTS "Admins can manage offices" ON public.offices;

CREATE POLICY "Anyone can view offices" ON public.offices
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage offices" ON public.offices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Service role can manage offices" ON public.offices
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for locations
DROP POLICY IF EXISTS "Anyone can view locations" ON public.locations;

CREATE POLICY "Anyone can view locations" ON public.locations
    FOR SELECT USING (true);

-- Create RLS policies for generated_documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.generated_documents;

CREATE POLICY "Users can view own documents" ON public.generated_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.applications 
            WHERE id = generated_documents.application_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage documents" ON public.generated_documents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
    );
