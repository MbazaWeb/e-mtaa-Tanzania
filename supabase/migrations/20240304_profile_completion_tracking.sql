-- Add profile completion tracking to users table
-- This ensures staff/citizens complete their profiles before using the app

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS profile_completion_percentage INT DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('M', 'F', 'Other', 'Prefer not to say')),
ADD COLUMN IF NOT EXISTS identification_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS identification_type TEXT CHECK (identification_type IN ('NIDA', 'Passport', 'Driving License', 'Other')),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Create function to calculate profile completion
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  completion_percentage INT := 0;
  total_fields INT := 0;
  filled_fields INT := 0;
BEGIN
  -- Count total required fields
  total_fields := 10; -- email, phone, first_name, last_name, date_of_birth, gender, identification_number, identification_type, address, city
  
  -- Count filled fields
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.first_name IS NOT NULL AND NEW.first_name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.date_of_birth IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.gender IS NOT NULL AND NEW.gender != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.identification_number IS NOT NULL AND NEW.identification_number != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.identification_type IS NOT NULL AND NEW.identification_type != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.address IS NOT NULL AND NEW.address != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.city IS NOT NULL AND NEW.city != '' THEN filled_fields := filled_fields + 1; END IF;
  
  -- Calculate percentage
  completion_percentage := (filled_fields * 100) / total_fields;
  
  -- Set profile_completion_percentage
  NEW.profile_completion_percentage := completion_percentage;
  
  -- Set profile_completed_at if 100%
  IF completion_percentage = 100 THEN
    NEW.profile_completed_at := NOW();
  ELSE
    NEW.profile_completed_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS profile_completion_trigger ON public.users;

-- Create trigger to update profile completion on insert/update
CREATE TRIGGER profile_completion_trigger
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION calculate_profile_completion();

-- Create view for profile completion status
CREATE OR REPLACE VIEW public.profile_completion_status AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  profile_completion_percentage,
  CASE 
    WHEN profile_completion_percentage = 100 THEN 'Complete'
    WHEN profile_completion_percentage >= 75 THEN 'Nearly Complete'
    WHEN profile_completion_percentage >= 50 THEN 'Half Complete'
    WHEN profile_completion_percentage >= 25 THEN 'Just Started'
    ELSE 'Not Started'
  END as completion_status,
  profile_completed_at,
  created_at
FROM public.users
WHERE role IN ('staff', 'admin', 'citizen', 'viewer', 'approver')
ORDER BY profile_completion_percentage DESC;

GRANT SELECT ON public.profile_completion_status TO authenticated;

-- Create function to check if profile is complete
CREATE OR REPLACE FUNCTION is_profile_complete(user_id UUID)
RETURNS BOOLEAN AS $$
SELECT 
  CASE 
    WHEN (SELECT profile_completion_percentage FROM public.users WHERE id = user_id) = 100 THEN TRUE
    ELSE FALSE
  END;
$$ LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION is_profile_complete(UUID) TO authenticated;
