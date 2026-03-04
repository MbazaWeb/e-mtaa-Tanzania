-- Set default staff password as 'mtaa123.'
-- This migration establishes the default password policy for all new staff registrations

-- Create or replace function to set default staff password
CREATE OR REPLACE FUNCTION set_staff_default_password()
RETURNS TEXT AS $$
BEGIN
  RETURN 'mtaa123.';
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically set temporary_password to default
CREATE OR REPLACE FUNCTION on_staff_created()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('staff', 'admin', 'approver', 'viewer') THEN
    IF NEW.temporary_password IS NULL OR NEW.temporary_password = '' THEN
      NEW.temporary_password := 'mtaa123.';
    END IF;
    IF NEW.must_change_password IS NULL THEN
      NEW.must_change_password := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS staff_default_password_trigger ON public.users;

-- Create trigger to set default password on staff creation
CREATE TRIGGER staff_default_password_trigger
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION on_staff_created();

-- Update existing staff without passwords to use default
UPDATE public.users
SET temporary_password = 'mtaa123.'
WHERE temporary_password IS NULL 
  AND role IN ('staff', 'admin', 'approver', 'viewer');

-- Create or replace view for staff credentials display
CREATE OR REPLACE VIEW public.staff_credentials_display AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    office_id,
    assigned_region,
    assigned_district,
    temporary_password,
    must_change_password,
    created_at,
    CASE 
      WHEN must_change_password = true THEN 'Requires password change on first login'
      ELSE 'Password set'
    END as password_status
FROM public.users
WHERE role IN ('staff', 'admin', 'approver', 'viewer')
ORDER BY created_at DESC;

GRANT SELECT ON public.staff_credentials_display TO authenticated;

-- Create function to get staff credentials for display
CREATE OR REPLACE FUNCTION get_staff_credentials(staff_email TEXT)
RETURNS TABLE (
    staff_id UUID,
    email TEXT,
    default_password TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    must_change_password BOOLEAN
) AS $$
SELECT 
    id,
    email,
    temporary_password,
    first_name,
    last_name,
    role,
    must_change_password
FROM public.users
WHERE email = staff_email 
  AND role IN ('staff', 'admin', 'approver', 'viewer')
LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_staff_credentials(TEXT) TO authenticated;

-- Ensure RLS policy allows viewing credentials for staff management
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view credentials" ON public.users
FOR SELECT
USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'approver'));
