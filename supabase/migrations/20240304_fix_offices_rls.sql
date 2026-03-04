-- Fix RLS policy for offices table (403 Forbidden error)
-- Issue: POST requests to offices table returning 403

-- Create offices table if it doesn't exist
CREATE TABLE IF NOT EXISTS offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    level TEXT, -- 'region' or 'district'
    region TEXT,
    district TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view offices" ON offices;
DROP POLICY IF EXISTS "Admins can manage offices" ON offices;

-- Create new policies
CREATE POLICY "Anyone can view offices" ON offices
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage offices" ON offices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow service role to insert (for backend operations)
CREATE POLICY "Service role can manage offices" ON offices
    FOR ALL USING (auth.role() = 'service_role');
