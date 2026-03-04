import React, { useState, useEffect } from 'react';
import { supabase, Application, UserProfile } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Eye,
  MoreVertical,
  Shield,
  ArrowRight,
  Loader2,
  Building2,
  MapPin,
  Calendar,
  User,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { formatCurrency } from '@/src/lib/currency';

interface ApplicationReviewProps {
  lang: 'sw' | 'en';
  user: UserProfile | null;
}

export const ApplicationReview: React.FC<ApplicationReviewProps> = ({ lang, user }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'paid' | 'verified' | 'approved' | 'rejected' | 'pending_review'>('all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*, services(*), users(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setProcessing(true);
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
      if (selectedApp?.id === id) {
        setSelectedApp(prev => prev ? { ...prev, status } : null);
      }
    }
    setProcessing(false);
  };

  const filteredApps = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = 
      app.application_number.toLowerCase().includes(search.toLowerCase()) ||
      (app as any).users?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      (app as any).users?.last_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusStyle = (status: string) => {
    const styles: any = {
      submitted: "bg-blue-50 text-blue-600 border-blue-100",
      paid: "bg-amber-50 text-amber-600 border-amber-100",
      verified: "bg-indigo-50 text-indigo-600 border-indigo-100",
      pending_review: "bg-purple-50 text-purple-600 border-purple-100",
      approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
      issued: "bg-emerald-600 text-white border-emerald-600",
      rejected: "bg-red-50 text-red-600 border-red-100",
    };
    return styles[status] || "bg-stone-100 text-stone-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-stone-900">
            {lang === 'sw' ? 'Uhakiki wa Maombi' : 'Application Review'}
          </h2>
          <p className="text-stone-500">
            {lang === 'sw' ? 'Simamia na uhakiki maombi yote ya wananchi.' : 'Manage and verify all citizen applications.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input 
              type="text"
              placeholder={lang === 'sw' ? 'Tafuta...' : 'Search...'}
              className="pl-10 pr-4 h-11 rounded-xl border border-stone-200 focus:border-primary outline-none transition-all bg-white w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <select 
              className="pl-10 pr-8 h-11 rounded-xl border border-stone-200 focus:border-primary outline-none transition-all bg-white appearance-none cursor-pointer font-semibold text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">{lang === 'sw' ? 'Yote' : 'All Status'}</option>
              <option value="submitted">{lang === 'sw' ? 'Yaliyotumwa' : 'Submitted'}</option>
              <option value="paid">{lang === 'sw' ? 'Yaliyolipiwa' : 'Paid'}</option>
              <option value="verified">{lang === 'sw' ? 'Yaliyothibitishwa' : 'Verified'}</option>
              <option value="pending_review">{lang === 'sw' ? 'Yanasubiri Uhakiki' : 'Pending Review'}</option>
              <option value="approved">{lang === 'sw' ? 'Yaliyoidhinishwa' : 'Approved'}</option>
              <option value="rejected">{lang === 'sw' ? 'Yaliyokataliwa' : 'Rejected'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{lang === 'sw' ? 'Mwombaji' : 'Applicant'}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{lang === 'sw' ? 'Huduma' : 'Service'}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{lang === 'sw' ? 'Tarehe' : 'Date'}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{lang === 'sw' ? 'Hali' : 'Status'}</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                      {lang === 'sw' ? 'Hakuna maombi yaliyopatikana.' : 'No applications found.'}
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => (
                    <tr 
                      key={app.id} 
                      className={cn(
                        "hover:bg-stone-50 transition-colors cursor-pointer",
                        selectedApp?.id === app.id ? "bg-emerald-50/50" : ""
                      )}
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-stone-800">{(app as any).users?.first_name} {(app as any).users?.last_name}</p>
                            <p className="text-[10px] text-stone-400 font-mono">{app.application_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-stone-700">{(app as any).services?.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-500">{new Date(app.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider", getStatusStyle(app.status))}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="h-4 w-4 text-stone-300 ml-auto" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedApp ? (
              <motion.div 
                key={selectedApp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden sticky top-24"
              >
                <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider", getStatusStyle(selectedApp.status))}>
                      {selectedApp.status}
                    </span>
                    <button 
                      onClick={() => setSelectedApp(null)}
                      className="p-1 hover:bg-stone-200 rounded-full transition-colors"
                    >
                      <XCircle className="h-5 w-5 text-stone-400" />
                    </button>
                  </div>
                  <h3 className="text-xl font-heading font-extrabold text-stone-900">{(selectedApp as any).services?.name}</h3>
                  <p className="text-sm text-stone-500">{(selectedApp as any).users?.first_name} {(selectedApp as any).users?.last_name}</p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{lang === 'sw' ? 'Namba ya Maombi' : 'App Number'}</p>
                      <p className="text-sm font-mono font-bold text-stone-800">{selectedApp.application_number}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{lang === 'sw' ? 'Tarehe' : 'Date'}</p>
                      <p className="text-sm font-bold text-stone-800">{new Date(selectedApp.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{lang === 'sw' ? 'Taarifa za Maombi' : 'Application Data'}</p>
                    <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                      {Object.entries(selectedApp.form_data || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4 border-b border-stone-200 pb-2 last:border-0 last:pb-0">
                          <span className="text-xs font-bold text-stone-500 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-bold text-stone-800 text-right">{String(value)}</span>
                        </div>
                      ))}
                      {(selectedApp as any).buyer_accepted !== undefined && (
                        <div className="flex justify-between gap-4 border-b border-stone-200 pb-2 last:border-0 last:pb-0 pt-2">
                          <span className="text-xs font-bold text-purple-600 uppercase tracking-tighter">{lang === 'sw' ? 'Mnunuzi Amekubali?' : 'Buyer Accepted?'}</span>
                          <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full",
                            (selectedApp as any).buyer_accepted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {(selectedApp as any).buyer_accepted ? (lang === 'sw' ? 'NDIYO' : 'YES') : (lang === 'sw' ? 'BADO' : 'NOT YET')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {user?.role !== 'viewer' && (
                    <div className="space-y-3 pt-4 border-t border-stone-100">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{lang === 'sw' ? 'Hatua za Uhakiki' : 'Verification Actions'}</p>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {selectedApp.status === 'paid' && (
                          <button 
                            disabled={processing}
                            onClick={() => updateStatus(selectedApp.id, 'verified')}
                            className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                          >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                            {lang === 'sw' ? 'Thibitisha Maombi' : 'Verify Application'}
                          </button>
                        )}

                        {(selectedApp.status === 'verified' || selectedApp.status === 'paid' || selectedApp.status === 'pending_review') && (
                          <button 
                            disabled={processing || ((selectedApp as any).services?.name === 'Makubaliano ya Mauziano' && !(selectedApp as any).buyer_accepted)}
                            onClick={() => updateStatus(selectedApp.id, 'approved')}
                            className={cn(
                              "w-full h-12 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg",
                              ((selectedApp as any).services?.name === 'Makubaliano ya Mauziano' && !(selectedApp as any).buyer_accepted)
                                ? "bg-stone-300 cursor-not-allowed shadow-none"
                                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                            )}
                          >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            {lang === 'sw' ? 'Idhinisha' : 'Approve Application'}
                          </button>
                        )}
                        
                        {((selectedApp as any).services?.name === 'Makubaliano ya Mauziano' && !(selectedApp as any).buyer_accepted) && (
                          <p className="text-[10px] text-amber-600 font-bold text-center">
                            {lang === 'sw' ? 'Inasubiri mnunuzi akubali kwanza' : 'Awaiting buyer acceptance first'}
                          </p>
                        )}

                        {selectedApp.status === 'approved' && (
                          <button 
                            disabled={processing}
                            onClick={() => updateStatus(selectedApp.id, 'issued')}
                            className="w-full h-12 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-200"
                          >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                            {lang === 'sw' ? 'Toa Hati (Issue)' : 'Issue Document'}
                          </button>
                        )}

                        {['submitted', 'paid', 'verified'].includes(selectedApp.status) && (
                          <button 
                            disabled={processing}
                            onClick={() => updateStatus(selectedApp.id, 'rejected')}
                            className="w-full h-12 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                          >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            {lang === 'sw' ? 'Kataa' : 'Reject'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {user?.role === 'viewer' && (
                    <div className="pt-4 border-t border-stone-100">
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex items-center gap-3 text-stone-500">
                        <Shield size={18} />
                        <p className="text-xs font-bold">
                          {lang === 'sw' ? 'Akaunti yako ni ya "Mtazamaji" tu. Huna ruhusa ya kufanya mabadiliko.' : 'Your account is "Viewer" only. You do not have permission to make changes.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 text-center border-2 border-dashed border-stone-200 rounded-3xl text-stone-400">
                <div className="space-y-4">
                  <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="h-8 w-8" />
                  </div>
                  <p className="font-bold">{lang === 'sw' ? 'Chagua ombi ili kuona maelezo zaidi' : 'Select an application to view details'}</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
