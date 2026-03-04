-- Expand dashboard with comprehensive statistics
-- Add: Service metrics, payments, regional data, performance metrics

-- Add missing columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS country_of_residence TEXT DEFAULT 'Tanzania',
ADD COLUMN IF NOT EXISTS is_diaspora BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS citizen_type TEXT DEFAULT 'local' CHECK (citizen_type IN ('local', 'diaspora', 'foreigner'));

-- Set defaults for existing records
UPDATE public.users 
SET country_of_residence = 'Tanzania' 
WHERE country_of_residence IS NULL;

UPDATE public.users 
SET citizen_type = 'local', is_diaspora = false 
WHERE citizen_type IS NULL;

-- Drop and recreate statistics views
DROP VIEW IF EXISTS public.dashboard_overview CASCADE;
DROP VIEW IF EXISTS public.payment_statistics CASCADE;
DROP VIEW IF EXISTS public.service_statistics CASCADE;
DROP VIEW IF EXISTS public.regional_statistics CASCADE;
DROP VIEW IF EXISTS public.staff_performance CASCADE;
DROP VIEW IF EXISTS public.citizen_statistics CASCADE;
DROP VIEW IF EXISTS public.staff_statistics CASCADE;
DROP VIEW IF EXISTS public.application_statistics CASCADE;

-- Citizen statistics view
CREATE VIEW public.citizen_statistics AS
SELECT 
    COUNT(*) as total_citizens,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_citizens,
    COUNT(CASE WHEN citizen_type = 'local' THEN 1 END) as local_citizens,
    COUNT(CASE WHEN citizen_type = 'diaspora' THEN 1 END) as diaspora_citizens,
    COUNT(CASE WHEN citizen_type = 'foreigner' THEN 1 END) as foreigner_count,
    COUNT(CASE WHEN is_verified = false THEN 1 END) as unverified_citizens
FROM public.users
WHERE role = 'citizen';

GRANT SELECT ON public.citizen_statistics TO authenticated, anon;

-- Staff statistics view
CREATE VIEW public.staff_statistics AS
SELECT 
    COUNT(*) as total_staff,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_staff,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff_count,
    COUNT(CASE WHEN assigned_region IS NOT NULL THEN 1 END) as assigned_staff
FROM public.users
WHERE role IN ('staff', 'admin');

GRANT SELECT ON public.staff_statistics TO authenticated, anon;

-- Application statistics view
CREATE VIEW public.application_statistics AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review_count,
    COUNT(DISTINCT user_id) as unique_applicants,
    ROUND(100.0 * COUNT(CASE WHEN status = 'issued' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as completion_rate_percent
FROM public.applications;

GRANT SELECT ON public.application_statistics TO authenticated, anon;

-- Service statistics view
CREATE VIEW public.service_statistics AS
SELECT 
    s.id,
    s.name,
    COUNT(a.id) as application_count,
    COUNT(CASE WHEN a.status = 'issued' THEN 1 END) as completed_count,
    s.fee as service_fee,
    COUNT(a.id) * s.fee as total_revenue,
    ROUND(100.0 * COUNT(CASE WHEN a.status = 'issued' THEN 1 END) / NULLIF(COUNT(a.id), 0), 2) as completion_rate
FROM public.services s
LEFT JOIN public.applications a ON s.id = a.service_id
GROUP BY s.id, s.name, s.fee
ORDER BY application_count DESC;

GRANT SELECT ON public.service_statistics TO authenticated, anon;

-- Payment statistics view
CREATE VIEW public.payment_statistics AS
SELECT 
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END)::NUMERIC(12,2) as total_revenue,
    AVG(CASE WHEN status = 'completed' THEN amount END)::NUMERIC(12,2) as average_payment,
    MAX(amount)::NUMERIC(12,2) as highest_payment
FROM public.payments;

GRANT SELECT ON public.payment_statistics TO authenticated, anon;

-- Regional statistics view (by assigned region)
CREATE VIEW public.regional_statistics AS
SELECT 
    COALESCE(u.assigned_region, 'Unassigned') as region,
    COUNT(DISTINCT u.id) as staff_count,
    COUNT(DISTINCT a.id) as applications_handled,
    COUNT(CASE WHEN a.status = 'issued' THEN 1 END) as documents_issued,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_applications
FROM public.users u
LEFT JOIN public.applications a ON u.id = a.assigned_staff_id
WHERE u.role IN ('staff', 'admin')
GROUP BY u.assigned_region
ORDER BY staff_count DESC;

GRANT SELECT ON public.regional_statistics TO authenticated, anon;

-- Staff performance view
CREATE VIEW public.staff_performance AS
SELECT 
    u.id,
    u.first_name || ' ' || COALESCE(u.last_name, '') as staff_name,
    u.assigned_region,
    u.assigned_district,
    COUNT(a.id) as total_assigned,
    COUNT(CASE WHEN a.status = 'issued' THEN 1 END) as documents_issued,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected,
    COUNT(CASE WHEN a.status = 'pending_review' THEN 1 END) as pending_review,
    ROUND(100.0 * COUNT(CASE WHEN a.status = 'issued' THEN 1 END) / NULLIF(COUNT(a.id), 0), 2) as completion_rate
FROM public.users u
LEFT JOIN public.applications a ON u.id = a.assigned_staff_id
WHERE u.role IN ('staff', 'admin')
GROUP BY u.id, u.first_name, u.last_name, u.assigned_region, u.assigned_district
ORDER BY total_assigned DESC;

GRANT SELECT ON public.staff_performance TO authenticated, anon;

-- Comprehensive dashboard overview
CREATE VIEW public.dashboard_overview AS
SELECT 
    -- Citizens
    (SELECT total_citizens FROM public.citizen_statistics) as total_citizens,
    (SELECT local_citizens FROM public.citizen_statistics) as local_citizens,
    (SELECT diaspora_citizens FROM public.citizen_statistics) as diaspora_citizens,
    (SELECT foreigner_count FROM public.citizen_statistics) as foreigner_count,
    (SELECT verified_citizens FROM public.citizen_statistics) as verified_citizens,
    (SELECT unverified_citizens FROM public.citizen_statistics) as unverified_citizens,
    
    -- Staff
    (SELECT total_staff FROM public.staff_statistics) as total_staff,
    (SELECT admin_count FROM public.staff_statistics) as admin_count,
    (SELECT staff_count FROM public.staff_statistics) as staff_count,
    (SELECT verified_staff FROM public.staff_statistics) as verified_staff,
    
    -- Applications
    (SELECT total_applications FROM public.application_statistics) as total_applications,
    (SELECT submitted_count FROM public.application_statistics) as submitted_applications,
    (SELECT paid_count FROM public.application_statistics) as paid_applications,
    (SELECT verified_count FROM public.application_statistics) as verified_applications,
    (SELECT approved_count FROM public.application_statistics) as approved_applications,
    (SELECT issued_count FROM public.application_statistics) as issued_documents,
    (SELECT rejected_count FROM public.application_statistics) as rejected_applications,
    (SELECT pending_review_count FROM public.application_statistics) as pending_review_applications,
    (SELECT completion_rate_percent FROM public.application_statistics) as application_completion_rate,
    
    -- Payments
    (SELECT total_payments FROM public.payment_statistics) as total_payments,
    (SELECT completed_payments FROM public.payment_statistics) as completed_payments,
    (SELECT failed_payments FROM public.payment_statistics) as failed_payments,
    (SELECT total_revenue FROM public.payment_statistics) as total_revenue,
    (SELECT average_payment FROM public.payment_statistics) as average_payment_amount,
    
    -- Timestamp
    NOW() as last_updated;

GRANT SELECT ON public.dashboard_overview TO authenticated, anon;

-- Enable RLS on views if needed
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
