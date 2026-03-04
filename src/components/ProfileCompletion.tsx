import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Edit2, Save } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Language } from '@/src/lib/i18n';

interface ProfileCompletionProps {
  userId: string;
  lang: Language;
  onComplete?: () => void;
}

export const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ userId, lang, onComplete }) => {
  const [profile, setProfile] = useState<any>(null);
  const [completion, setCompletion] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date_of_birth: '',
    gender: '',
    identification_number: '',
    identification_type: 'NIDA',
    address: '',
    city: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setCompletion(data.profile_completion_percentage || 0);
        setFormData({
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          identification_number: data.identification_number || '',
          identification_type: data.identification_type || 'NIDA',
          address: data.address || '',
          city: data.city || '',
        });
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = lang === 'sw' ? 'Tarehe ya kuzaliwa inahitajika' : 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = lang === 'sw' ? 'Jinsia inahitajika' : 'Gender is required';
    }

    if (!formData.identification_number) {
      newErrors.identification_number = lang === 'sw' ? 'Namba ya utambulisho inahitajika' : 'ID number is required';
    }

    if (!formData.address) {
      newErrors.address = lang === 'sw' ? 'Anwani inahitajika' : 'Address is required';
    }

    if (!formData.city) {
      newErrors.city = lang === 'sw' ? 'Jiji inahitajika' : 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update(formData)
        .eq('id', userId);

      if (error) throw error;

      setIsEditing(false);
      await fetchProfile();
      
      if (completion === 100 && onComplete) {
        onComplete();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="p-4 text-center">{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</div>;
  }

  const isComplete = completion === 100;
  const requiredFields = [
    { key: 'email', label: lang === 'sw' ? 'Barua Pepe' : 'Email', value: profile.email },
    { key: 'phone', label: lang === 'sw' ? 'Namba ya Simu' : 'Phone' , value: profile.phone },
    { key: 'first_name', label: lang === 'sw' ? 'Jina la Kwanza' : 'First Name', value: profile.first_name },
    { key: 'last_name', label: lang === 'sw' ? 'Jina la Ukoo' : 'Last Name', value: profile.last_name },
    { key: 'date_of_birth', label: lang === 'sw' ? 'Tarehe ya Kuzaliwa' : 'Date of Birth', value: formData.date_of_birth },
    { key: 'gender', label: lang === 'sw' ? 'Jinsia' : 'Gender', value: formData.gender },
    { key: 'identification_number', label: lang === 'sw' ? 'Namba ya Utambulisho' : 'ID Number', value: formData.identification_number },
    { key: 'identification_type', label: lang === 'sw' ? 'Aina ya Utambulisho' : 'ID Type', value: formData.identification_type },
    { key: 'address', label: lang === 'sw' ? 'Anwani' : 'Address', value: formData.address },
    { key: 'city', label: lang === 'sw' ? 'Jiji' : 'City', value: formData.city },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Completion Status Card */}
      <div className={cn(
        "p-6 rounded-3xl border-2",
        isComplete ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle2 size={32} className="text-emerald-600" />
            ) : (
              <AlertCircle size={32} className="text-amber-600" />
            )}
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                {lang === 'sw' ? 'Ukamilishaji wa Wasifu' : 'Profile Completion'}
              </h3>
              <p className={cn(
                "text-sm font-medium",
                isComplete ? "text-emerald-700" : "text-amber-700"
              )}>
                {isComplete
                  ? lang === 'sw' ? 'Wasifu wako upo kamili!' : 'Your profile is complete!'
                  : lang === 'sw' ? 'Tafadhali kamili wasifu wako' : 'Please complete your profile'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-stone-700">{completion}%</span>
            <span className="text-sm text-stone-500">
              {lang === 'sw' ? 'Sehemu za karibu' : 'Nearly there'}
            </span>
          </div>
          <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              className={cn(
                "h-full rounded-full transition-colors",
                isComplete ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
          </div>
        </div>

        {/* Missing Fields */}
        {!isComplete && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-stone-600 uppercase">
              {lang === 'sw' ? 'Sehemu zinazohitajika' : 'Required Fields'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {requiredFields.map((field) => (
                <div key={field.key} className="flex items-center gap-2 text-xs">
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
                    field.value ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  )}>
                    {field.value ? '✓' : '○'}
                  </div>
                  <span className="text-stone-600">{field.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Completion Form */}
      {!isComplete && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-stone-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-stone-900">
                {lang === 'sw' ? 'Kamili Taarifa Zako' : 'Complete Your Information'}
              </h4>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-tz-blue transition-colors"
                >
                  <Edit2 size={16} />
                  {lang === 'sw' ? 'Hariri' : 'Edit'}
                </button>
              )}
            </div>

            {isEditing && (
              <div className="space-y-4">
                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    {lang === 'sw' ? 'Tarehe ya Kuzaliwa' : 'Date of Birth'} *
                  </label>
                  <input
                    type="date"
                    title={lang === 'sw' ? 'Tarehe ya Kuzaliwa' : 'Date of Birth'}
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className={cn(
                      "w-full px-4 py-2 border rounded-lg outline-none",
                      errors.date_of_birth ? "border-red-300 bg-red-50" : "border-stone-300"
                    )}
                  />
                  {errors.date_of_birth && <p className="text-xs text-red-600 mt-1">{errors.date_of_birth}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    {lang === 'sw' ? 'Jinsia' : 'Gender'} *
                  </label>
                  <select
                    title={lang === 'sw' ? 'Jinsia' : 'Gender'}
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className={cn(
                      "w-full px-4 py-2 border rounded-lg outline-none bg-white",
                      errors.gender ? "border-red-300 bg-red-50" : "border-stone-300"
                    )}
                  >
                    <option value="">{lang === 'sw' ? '-- Chagua --' : '-- Select --'}</option>
                    <option value="M">{lang === 'sw' ? 'Mwanaume' : 'Male'}</option>
                    <option value="F">{lang === 'sw' ? 'Mwanamke' : 'Female'}</option>
                    <option value="Other">{lang === 'sw' ? 'Nyingine' : 'Other'}</option>
                    <option value="Prefer not to say">{lang === 'sw' ? 'Siamtaka kusema' : 'Prefer not to say'}</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
                </div>

                {/* ID Type */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    {lang === 'sw' ? 'Aina ya Utambulisho' : 'ID Type'} *
                  </label>
                  <select
                    title={lang === 'sw' ? 'Aina ya Utambulisho' : 'ID Type'}
                    value={formData.identification_type}
                    onChange={(e) => setFormData({...formData, identification_type: e.target.value})}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none bg-white"
                  >
                    <option value="NIDA">NIDA</option>
                    <option value="Passport">{lang === 'sw' ? 'Paspoti' : 'Passport'}</option>
                    <option value="Driving License">{lang === 'sw' ? 'Leseni ya Kuendesha' : 'Driving License'}</option>
                  </select>
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    {lang === 'sw' ? 'Namba ya Utambulisho' : 'ID Number'} *
                  </label>
                  <input
                    type="text"
                    value={formData.identification_number}
                    onChange={(e) => setFormData({...formData, identification_number: e.target.value})}
                    placeholder="e.g., 123456789"
                    className={cn(
                      "w-full px-4 py-2 border rounded-lg outline-none",
                      errors.identification_number ? "border-red-300 bg-red-50" : "border-stone-300"
                    )}
                  />
                  {errors.identification_number && <p className="text-xs text-red-600 mt-1">{errors.identification_number}</p>}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    {lang === 'sw' ? 'Anwani' : 'Address'} *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder={lang === 'sw' ? 'Mtaa, Nyumba namba' : 'Street, House number'}
                    className={cn(
                      "w-full px-4 py-2 border rounded-lg outline-none",
                      errors.address ? "border-red-300 bg-red-50" : "border-stone-300"
                    )}
                  />
                  {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    {lang === 'sw' ? 'Jiji' : 'City'} *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder={lang === 'sw' ? 'Jina la jiji' : 'City name'}
                    className={cn(
                      "w-full px-4 py-2 border rounded-lg outline-none",
                      errors.city ? "border-red-300 bg-red-50" : "border-stone-300"
                    )}
                  />
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {loading ? (lang === 'sw' ? 'Inakaguwa...' : 'Saving...') : (lang === 'sw' ? 'Hifadhi' : 'Save')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
