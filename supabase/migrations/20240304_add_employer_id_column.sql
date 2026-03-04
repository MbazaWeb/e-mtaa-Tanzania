-- Add employer_id column to users table
-- This column stores the staff member's employer identification number

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS employer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_employer_id ON public.users(employer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.users.employer_id IS 'Staff member employer identification number';
