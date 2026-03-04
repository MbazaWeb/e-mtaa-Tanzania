import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  UserCheck,
  HelpCircle,
  Building2,
  Loader2
} from 'lucide-react';
import { supabase, Application } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { StatCard } from '@/src/components/ui/StatCard';
import { StatusBadge } from '@/src/components/ui/StatusBadge';

export function StaffDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // Fetch applications relevant to the staff's location
      let query = supabase
        .from('applications')
        .select('*, services(*), users(*)')
        .order('created_at', { ascending: false });

      if (user?.role === 'staff') {
        if (user.assigned_district) {
          query = query.eq('district', user.assigned_district);
        } else if (user.assigned_region) {
          query = query.eq('region', user.assigned_region);
        }
      }

      const { data, error } = await query.limit(10);

      if (!error && data) {
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching staff dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    pending: applications.filter(a => a.status === 'submitted').length,
    paid: applications.filter(a => a.status === 'paid').length,
    approved: applications.filter(a => a.status === 'approved' || a.status === 'issued').length,
    total: applications.length
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            {lang === 'sw' ? 'Dashibodi ya Mtumishi' : 'Staff Dashboard'}
          </h1>
          <p className="text-stone-500 font-medium">
            {lang === 'sw' ? `Karibu, ${user?.first_name}. Ofisi: ${user?.assigned_district || user?.assigned_region || 'Makao Makuu'}` : `Welcome, ${user?.first_name}. Office: ${user?.assigned_district || user?.assigned_region || 'Headquarters'}`}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 border border-emerald-100">
            <TrendingUp size={16} />
            {lang === 'sw' ? 'Hali: Mtandaoni' : 'Status: Online'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Clock className="text-blue-500" />} 
          label={lang === 'sw' ? "Maombi Mapya" : "New Applications"} 
          value={stats.pending} 
        />
        <StatCard 
          icon={<AlertCircle className="text-amber-500" />} 
          label={lang === 'sw' ? "Zilizolipwa" : "Paid Applications"} 
          value={stats.paid} 
        />
        <StatCard 
          icon={<CheckCircle className="text-emerald-500" />} 
          label={lang === 'sw' ? "Zilizoidhinishwa" : "Approved"} 
          value={stats.approved} 
        />
        <StatCard 
          icon={<FileText className="text-stone-500" />} 
          label={lang === 'sw' ? "Jumla ya Maombi" : "Total Handled"} 
          value={stats.total} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-stone-100 shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-stone-900">{lang === 'sw' ? 'Maombi ya Karibuni' : 'Recent Applications'}</h3>
            <button className="text-sm font-bold text-emerald-600 hover:underline">{lang === 'sw' ? 'Tazama Yote' : 'View All'}</button>
          </div>
          <div className="divide-y divide-stone-50">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-stone-400 font-bold">{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-stone-400 font-bold">
                {lang === 'sw' ? 'Hakuna maombi mapya.' : 'No new applications.'}
              </div>
            ) : applications.map((app) => (
              <div key={app.id} className="px-8 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{(app as any).services?.name}</p>
                    <p className="text-xs text-stone-400 font-medium">{(app as any).users?.first_name} {(app as any).users?.last_name} • {app.application_number}</p>
                  </div>
                </div>
                <StatusBadge status={app.status} lang={lang} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-stone-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UserCheck size={20} className="text-emerald-400" />
              {lang === 'sw' ? 'Njia za Mkato' : 'Quick Access'}
            </h3>
            <div className="space-y-3 relative z-10">
              <button className="w-full p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <HelpCircle size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{lang === 'sw' ? 'Huduma kwa Wateja' : 'Customer Support'}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">{lang === 'sw' ? 'Tafuta Maombi' : 'Search Applications'}</p>
                </div>
              </button>
              <button className="w-full p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <UserCheck size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{lang === 'sw' ? 'Uhakiki wa Mwongozo' : 'Manual Verification'}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">{lang === 'sw' ? 'Thibitisha Raia' : 'Verify Citizen'}</p>
                </div>
              </button>
            </div>
            <Building2 className="absolute right-[-30px] bottom-[-30px] h-48 w-48 text-white/5 rotate-12" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
