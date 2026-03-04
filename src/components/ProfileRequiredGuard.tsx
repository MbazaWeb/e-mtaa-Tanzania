import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Language } from '@/src/lib/i18n';
import { ProfileCompletion } from './ProfileCompletion';
import { LockKeyhole } from 'lucide-react';

interface ProfileRequiredGuardProps {
  userId: string;
  lang: Language;
  children: React.ReactNode;
}

export const ProfileRequiredGuard: React.FC<ProfileRequiredGuardProps> = ({ userId, lang, children }) => {
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfileCompletion();
  }, [userId]);

  const checkProfileCompletion = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('profile_completion_percentage')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setProfileComplete(data?.profile_completion_percentage === 100);
    } catch (err: any) {
      console.error('Error checking profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <LockKeyhole size={40} className="text-stone-400" />
          </div>
          <p className="text-stone-600">{lang === 'sw' ? 'Inaangalia wasifu...' : 'Checking profile...'}</p>
        </div>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stone-900 mb-2">
              {lang === 'sw' ? 'Kamili Wasifu Wako' : 'Complete Your Profile'}
            </h1>
            <p className="text-stone-600">
              {lang === 'sw' 
                ? 'Lazima ukamili wasifu wako kabla ya kutumia huduma hizi.' 
                : 'You must complete your profile before using services.'}
            </p>
          </div>
          
          <ProfileCompletion 
            userId={userId} 
            lang={lang}
            onComplete={() => {
              setProfileComplete(true);
              // Optionally refresh the page
              window.location.reload();
            }}
          />
        </div>
      </div>
    );
  }

  // Profile is complete, show the protected content
  return <>{children}</>;
};
