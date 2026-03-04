-- Create test staff account for login testing
-- This helps verify the authentication system is working

-- First, let's check if we need to disable email confirmation requirement
-- Update auth schema settings to allow password login without email confirmation
-- (This is typically done in Supabase Dashboard > Authentication > Providers)

-- Create or reset a test staff account
-- Delete if exists (optional - comment out if you want to keep existing data)
-- DELETE FROM public.users WHERE email = 'test.staff@mtaa.test';

-- We'll create the auth user using a SQL function that has the proper permissions
CREATE OR REPLACE FUNCTION create_test_staff_account()
RETURNS TABLE(success boolean, user_id uuid, email text, password_note text) AS $$
DECLARE
  test_user_id UUID;
  test_email TEXT := 'test.staff@mtaa.test';
  test_password TEXT := 'mtaa123.';
BEGIN
  -- Check if user exists
  SELECT id INTO test_user_id FROM auth.users WHERE email = test_email LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RETURN QUERY SELECT 
      true,
      test_user_id,
      test_email,
      'Test account already exists with email: test.staff@mtaa.test and password: mtaa123.'::text;
    RETURN;
  END IF;
  
  -- Note: Creating auth users directly via SQL is limited
  -- The account must be created via Supabase Auth API (signUp endpoint)
  -- For testing, you can manually create via dashboard or use the app's registration
  
  RETURN QUERY SELECT 
    false,
    NULL::uuid,
    test_email,
    'Please create test account via: 1) Staff Registration form in app, OR 2) Supabase Dashboard > Authentication > Users'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_test_staff_account() TO authenticated;

-- Alternative: Create a view showing authentication troubleshooting steps
CREATE OR REPLACE VIEW public.auth_troubleshooting AS
SELECT 
  'Step 1: Verify test user exists' as step,
  'Check if test.staff@mtaa.test exists in Supabase Dashboard > Authentication > Users' as action
UNION ALL
SELECT 
  'Step 2: Verify email confirmation',
  'If enabled, check if user email is confirmed in Auth dashboard'
UNION ALL
SELECT 
  'Step 3: Check user profile',
  'Ensure user profile exists in public.users table with matching email'
UNION ALL
SELECT 
  'Step 4: Reset password',
  'In Auth dashboard, click user and manually set password to mtaa123.'
UNION ALL
SELECT
  'Step 5: Test login',
  'Try logging in via app with email: test.staff@mtaa.test, password: mtaa123.';

GRANT SELECT ON public.auth_troubleshooting TO authenticated;

-- Create a stored procedure to check user exists in both auth and users table
CREATE OR REPLACE FUNCTION check_user_account(email_param TEXT)
RETURNS TABLE(
  email text,
  exists_in_auth boolean,
  exists_in_users boolean,
  user_id uuid,
  role text,
  profile_completion int,
  notes text
) AS $$
DECLARE
  auth_user_id UUID;
  users_record RECORD;
BEGIN
  -- Check in auth
  SELECT id INTO auth_user_id FROM auth.users WHERE email = email_param LIMIT 1;
  
  -- Check in users table
  SELECT id, role, profile_completion_percentage INTO users_record
  FROM public.users WHERE email = email_param LIMIT 1;
  
  RETURN QUERY SELECT
    email_param,
    auth_user_id IS NOT NULL,
    users_record IS NOT NULL,
    auth_user_id,
    COALESCE(users_record.role, 'N/A'),
    COALESCE(users_record.profile_completion_percentage, 0),
    CASE 
      WHEN auth_user_id IS NULL THEN 'User NOT in auth system'
      WHEN users_record IS NULL THEN 'User in auth but NOT in users table'
      WHEN users_record.profile_completion_percentage < 100 THEN 'Profile incomplete (' || users_record.profile_completion_percentage || '%)'
      ELSE 'User ready to login'
    END;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION check_user_account(TEXT) TO authenticated;
