import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Plus, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2,
  ChevronRight,
  Building2,
  Home
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useLanguage } from '@/src/context/LanguageContext';
import { cn } from '@/src/lib/utils';

type LocationLevel = 'region' | 'district' | 'ward' | 'street';

interface Location {
  id: string;
  name: string;
  level: LocationLevel;
  parent_id: string | null;
}

export function LocationManagement() {
  const { lang } = useLanguage();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeLevel, setActiveLevel] = useState<LocationLevel>('region');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const [newLocation, setNewLocation] = useState({
    name: '',
    level: 'region' as LocationLevel,
    parent_id: null as string | null
  });

  useEffect(() => {
    fetchLocations();
  }, [activeLevel, selectedParentId]);

  const fetchLocations = async () => {
    setLoading(true);
    let query = supabase
      .from('locations')
      .select('*')
      .eq('level', activeLevel)
      .order('name', { ascending: true });

    if (selectedParentId) {
      query = query.eq('parent_id', selectedParentId);
    } else if (activeLevel !== 'region') {
      // If not region and no parent selected, we might want to show nothing or all at that level
      // For now, let's show all at that level if no parent is selected
    }

    const { data, error } = await query;

    if (!error && data) {
      setLocations(data);
    }
    setLoading(false);
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
    const { error } = await supabase.from('locations').insert({
      name: newLocation.name,
      level: newLocation.level,
      parent_id: newLocation.parent_id
    });

    if (error) {
      alert(error.message);
    } else {
      setShowAddModal(false);
      setNewLocation({ ...newLocation, name: '' });
      fetchLocations();
    }
    setProcessing(false);
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm(lang === 'sw' ? 'Je, una uhakika unataka kufuta eneo hili?' : 'Are you sure you want to delete this location?')) return;
    
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchLocations();
  };

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            {lang === 'sw' ? 'Usimamizi wa Maeneo' : 'Location Management'}
          </h1>
          <p className="text-stone-500 font-medium">
            {lang === 'sw' ? 'Simamia mikoa, wilaya, kata na mitaa' : 'Manage regions, districts, wards and streets'}
          </p>
        </div>
        <button 
          onClick={() => {
            setNewLocation({ ...newLocation, level: activeLevel, parent_id: selectedParentId });
            setShowAddModal(true);
          }}
          className="h-14 px-8 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          {lang === 'sw' ? `Ongeza ${activeLevel === 'region' ? 'Mkoa' : activeLevel === 'district' ? 'Wilaya' : activeLevel === 'ward' ? 'Kata' : 'Mtaa'}` : `Add ${activeLevel}`}
        </button>
      </div>

      {/* Level Navigation */}
      <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-2xl w-fit">
        {(['region', 'district', 'ward', 'street'] as LocationLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => {
              setActiveLevel(level);
              setSelectedParentId(null);
            }}
            className={cn(
              "px-6 py-3 rounded-xl font-bold text-sm transition-all uppercase tracking-widest",
              activeLevel === level ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            {level === 'region' ? (lang === 'sw' ? 'Mikoa' : 'Regions') : 
             level === 'district' ? (lang === 'sw' ? 'Wilaya' : 'Districts') : 
             level === 'ward' ? (lang === 'sw' ? 'Kata' : 'Wards') : 
             (lang === 'sw' ? 'Mitaa' : 'Streets')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-stone-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text"
              placeholder={lang === 'sw' ? 'Tafuta eneo...' : 'Search locations...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">{lang === 'sw' ? 'Jina' : 'Name'}</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">{lang === 'sw' ? 'Ngazi' : 'Level'}</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">{lang === 'sw' ? 'Vitendo' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-emerald-600 mb-2" />
                    <p className="text-stone-400 font-bold">{lang === 'sw' ? 'Inapakia...' : 'Loading...'}</p>
                  </td>
                </tr>
              ) : filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-stone-400 font-bold">
                    {lang === 'sw' ? 'Hakuna maeneo yaliyopatikana.' : 'No locations found.'}
                  </td>
                </tr>
              ) : filteredLocations.map((location) => (
                <tr key={location.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        {location.level === 'region' ? <MapPin size={20} /> : 
                         location.level === 'district' ? <Building2 size={20} /> : 
                         location.level === 'ward' ? <Home size={20} /> : <MapPin size={20} />}
                      </div>
                      <span className="font-bold text-stone-900">{location.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-stone-50 text-stone-500 border-stone-100">
                      {location.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {location.level !== 'street' && (
                        <button 
                          onClick={() => {
                            const nextLevelMap: Record<LocationLevel, LocationLevel> = {
                              'region': 'district',
                              'district': 'ward',
                              'ward': 'street',
                              'street': 'street'
                            };
                            setActiveLevel(nextLevelMap[location.level]);
                            setSelectedParentId(location.id);
                          }}
                          className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all flex items-center gap-1 text-xs font-bold"
                        >
                          {lang === 'sw' ? 'Tazama' : 'View'} <ChevronRight size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteLocation(location.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-stone-900 tracking-tight">
                  {lang === 'sw' ? `Ongeza ${newLocation.level}` : `Add New ${newLocation.level}`}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddLocation} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">{lang === 'sw' ? 'Jina' : 'Name'}</label>
                  <input 
                    type="text"
                    required
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                    className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                    placeholder={lang === 'sw' ? 'Mf. Dar es Salaam' : 'e.g. Dar es Salaam'}
                  />
                </div>

                <button 
                  disabled={processing}
                  className="w-full h-16 bg-stone-900 text-white rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-200 disabled:opacity-50"
                  type="submit"
                >
                  {processing ? <Loader2 className="animate-spin" /> : (lang === 'sw' ? 'Ongeza' : 'Add Location')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
