import { useState, useEffect } from 'react';
import { supabase, Application, UserProfile } from '@/src/lib/supabase';

export function useApplications(user: UserProfile | null) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*, services(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setApplications(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchApplications();
    } else {
      setApplications([]);
    }
  }, [user]);

  return { applications, loading, fetchApplications, setApplications };
}
