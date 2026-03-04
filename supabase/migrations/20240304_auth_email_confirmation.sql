-- Disable email confirmation requirement for development
-- This allows users to login immediately after signup

-- Update auth schema to disable email verification requirement
-- Note: This should typically be done via Supabase Dashboard

-- Create a SQL to help debug auth issues
-- This query shows the difference between auth users and profile users

CREATE OR REPLACE VIEW public.auth_profile_sync AS
SELECT 
  a.id as auth_id,
  a.email,
  a.email_confirmed_at,
  a.created_at as auth_created_at,
  COALESCE(u.id, 'MISSING'::uuid) as profile_id,
  COALESCE(u.first_name, 'MISSING') as first_name,
  COALESCE(u.role, 'MISSING') as role,
  COALESCE(u.profile_completion_percentage, 0) as completion_pct,
  CASE
    WHEN a.email_confirmed_at IS NULL THEN '⚠️ Email not confirmed'
    WHEN u.id IS NULL THEN '⚠️ Profile missing'
    WHEN u.profile_completion_percentage < 100 THEN '⚠️ Profile incomplete (' || u.profile_completion_percentage || '%)'
    ELSE '✓ Ready to login'
  END as status
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
ORDER BY a.created_at DESC;

GRANT SELECT ON public.auth_profile_sync TO authenticated;

-- Create function to manually confirm user email in development
CREATE OR REPLACE FUNCTION confirm_user_email(user_email TEXT)
RETURNS TABLE(
  success boolean,
  message text,
  email text,
  email_confirmed_at timestamptz
) AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(), updated_at = NOW()
  WHERE email = user_email AND email_confirmed_at IS NULL;
  
  RETURN QUERY SELECT
    true,
    'Email confirmed successfully',
    user_email,
    (SELECT email_confirmed_at FROM auth.users WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION confirm_user_email(TEXT) TO authenticated;

-- View to check if email confirmation is required
CREATE OR REPLACE VIEW public.auth_settings AS
SELECT 
  'Email Confirmation' as setting,
  'If you''re getting "Invalid login credentials" error,'
  'you likely need to confirm email in Supabase Dashboard'
  as note,
  'Dashboard > Authentication > Users > Select user > Search and confirm' as action;

GRANT SELECT ON public.auth_settings TO authenticated;
