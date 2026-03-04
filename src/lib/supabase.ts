import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'citizen' | 'staff' | 'admin' | 'viewer' | 'approver';

export interface VirtualOffice {
  id: string;
  name: string;
  level: 'region' | 'district';
  region: string;
  district?: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender?: string;
  sex?: string;
  nationality?: string;
  country_of_citizenship?: string;
  nida_number?: string;
  phone: string;
  email: string;
  photo_url?: string;
  role: UserRole;
  is_verified: boolean;
  is_diaspora?: boolean;
  country_of_residence?: string;
  passport_number?: string;
  office_id?: string;
  assigned_region?: string;
  assigned_district?: string;
  region?: string;
  district?: string;
  ward?: string;
  street?: string;
}

export interface Service {
  id: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  form_schema: any;
  document_template: any;
  fee: number;
  active: boolean;
  diaspora_form_schema?: any;
  created_at?: string;
}

export interface Application {
  id: string;
  user_id: string;
  service_id: string;
  form_data: any;
  status: 'submitted' | 'paid' | 'verified' | 'approved' | 'issued' | 'rejected';
  application_number: string;
  assigned_staff_id?: string;
  created_at: string;
  service?: Service;
  user?: UserProfile;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
  user?: UserProfile;
}
