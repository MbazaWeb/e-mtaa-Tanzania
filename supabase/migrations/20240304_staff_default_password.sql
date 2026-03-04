-- Setup default password system for new staff registration
-- Allows staff to login with default password and change it themselves

-- Add columns to track password management
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS temporary_password TEXT,
ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;

-- Create function to generate temporary password
CREATE OR REPLACE FUNCTION generate_temp_password()
RETURNS TEXT AS $$
SELECT 
    SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' FROM FLOOR(RANDOM()*36)::INT+1 FOR 1) ||
    SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' FROM FLOOR(RANDOM()*36)::INT+1 FOR 1) ||
    SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' FROM FLOOR(RANDOM()*36)::INT+1 FOR 1) ||
    SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' FROM FLOOR(RANDOM()*36)::INT+1 FOR 1) ||
    SUBSTRING('0123456789' FROM FLOOR(RANDOM()*10)::INT+1 FOR 1) ||
    SUBSTRING('0123456789' FROM FLOOR(RANDOM()*10)::INT+1 FOR 1) ||
    SUBSTRING('0123456789' FROM FLOOR(RANDOM()*10)::INT+1 FOR 1) ||
    SUBSTRING('0123456789' FROM FLOOR(RANDOM()*10)::INT+1 FOR 1);
$$ LANGUAGE SQL;

-- Create a view to show staff with login credentials
CREATE OR REPLACE VIEW public.staff_login_credentials AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    temporary_password,
    must_change_password,
    created_at,
    'Temp Password: ' || COALESCE(temporary_password, 'Not Set') as credentials_note
FROM public.users
WHERE role IN ('staff', 'admin')
AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

GRANT SELECT ON public.staff_login_credentials TO authenticated;

-- Create procedures/records table for staff onboarding
CREATE TABLE IF NOT EXISTS public.staff_onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email_sent_at TIMESTAMPTZ,
    credentials_sent BOOLEAN DEFAULT false,
    password_changed BOOLEAN DEFAULT false,
    first_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON public.staff_onboarding TO authenticated;

-- Function to get staff by email (for login after registration)
CREATE OR REPLACE FUNCTION get_staff_by_email(email_param TEXT)
RETURNS TABLE (
    staff_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    temporary_password TEXT,
    must_change_password BOOLEAN
) AS $$
SELECT 
    id,
    email,
    first_name,
    last_name,
    temporary_password,
    must_change_password
FROM public.users
WHERE email = email_param AND role IN ('staff', 'admin');
$$ LANGUAGE SQL SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_staff_by_email(TEXT) TO authenticated;
