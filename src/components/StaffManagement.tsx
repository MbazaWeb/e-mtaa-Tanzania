import React, { useState, useEffect } from 'react';
import { supabase, UserProfile, VirtualOffice } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Shield, 
  Mail, 
  Phone,
  Briefcase,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Database,
  Trash2,
  DatabaseZap,
  Globe,
  UserPlus
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Language, useTranslation } from '@/src/lib/i18n';
import { INITIAL_SERVICES } from '@/src/constants/services';

interface StaffManagementProps {
  lang: Language;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ lang }) => {
  const t = useTranslation(lang);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [offices, setOffices] = useState<VirtualOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [officeLevel, setOfficeLevel] = useState<'region' | 'district'>('region');
  
  const [newStaff, setNewStaff] = useState({
    email: '',
    phone: '',
    employer_id: '',
    role: 'viewer' as 'viewer' | 'approver' | 'admin'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [registeredStaffEmail, setRegisteredStaffEmail] = useState('');

  const regions = [
    "Dar es Salaam", "Arusha", "Dodoma", "Mwanza", "Tanga", 
    "Morogoro", "Mbeya", "Kilimanjaro", "Iringa", "Kagera",
    "Tabora", "Kigoma", "Shinyanga", "Manyara", "Ruvuma"
  ];

  // Mock districts per region
  const getDistrictsForRegion = (region: string) => {
    const districtsMap: {[key: string]: string[]} = {
      "Dar es Salaam": ["Ilala", "Kinondoni", "Ubungo", "Temeke", "Kigamboni"],
      "Arusha": ["Arusha CC", "Arusha DC", "Meru", "Longido", "Monduli"],
      "Dodoma": ["Dodoma CC", "Bahi", "Chamwino", "Chemba", "Kondoa"],
      "Mwanza": ["Nyamagana", "Ilemela", "Magu", "Kwimba", "Sengerema"],
      "Tanga": ["Tanga CC", "Muheza", "Korogwe", "Lushoto", "Handeni"],
      "Morogoro": ["Morogoro CC", "Morogoro DC", "Kilosa", "Ulanga", "Malinyi"],
      "Mbeya": ["Mbeya CC", "Mbeya DC", "Rungwe", "Kyela", "Mbozi"],
      "Kilimanjaro": ["Moshi CC", "Moshi DC", "Hai", "Siha", "Rombo"],
      "Iringa": ["Iringa CC", "Iringa DC", "Kilolo", "Mufindi"],
      "Kagera": ["Bukoba CC", "Bukoba DC", "Muleba", "Karagwe", "Kyerwa"]
    };
    return districtsMap[region] || ["Central", "North", "South", "East", "West"];
  };

  useEffect(() => {
    fetchStaff();
    generateOffices();
  }, []);

  const generateOffices = () => {
    // Generate virtual offices based on regions and districts
    const generatedOffices: VirtualOffice[] = [];
    
    regions.forEach((region, regionIndex) => {
      // Add regional office
      generatedOffices.push({
        id: `reg-${regionIndex}`,
        name: `${region} ${lang === 'sw' ? 'Ofisi ya Mkoa' : 'Regional Office'}`,
        level: 'region',
        region: region
      });

      // Add district offices
      const districts = getDistrictsForRegion(region);
      districts.forEach((district, districtIndex) => {
        generatedOffices.push({
          id: `dist-${regionIndex}-${districtIndex}`,
          name: `${district} ${lang === 'sw' ? 'Ofisi ya Wilaya' : 'District Office'}`,
          level: 'district',
          region: region,
          district: district
        });
      });
    });

    setOffices(generatedOffices);
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      // Add slight delay to ensure data is committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['staff', 'admin', 'viewer', 'approver']);
      
      if (error) {
        console.error('Error fetching staff:', error);
        return;
      }
      
      if (data) {
        console.log('Fetched staff:', data.length);
        setStaff(data);
      }
    } catch (err: any) {
      console.error('Fetch staff error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!newStaff.email) {
      newErrors.email = lang === 'sw' ? 'Barua pepe inahitajika' : 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newStaff.email)) {
      newErrors.email = lang === 'sw' ? 'Barua pepe si sahihi' : 'Email is invalid';
    }
    
    if (!newStaff.phone) {
      newErrors.phone = lang === 'sw' ? 'Namba ya simu inahitajika' : 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(newStaff.phone.replace(/[\s\-()]/g, ''))) {
      newErrors.phone = lang === 'sw' ? 'Namba ya simu si sahihi' : 'Phone number is invalid';
    }

    if (officeLevel === 'district' && !newStaff.employer_id.trim()) {
      newErrors.employer_id = lang === 'sw' ? 'Namba ya Mtumishi inahitajika' : 'Employer ID is required';
    }
    
    if (!selectedRegion) {
      newErrors.region = lang === 'sw' ? 'Mkoa unahitajika' : 'Region is required';
    }
    
    if (officeLevel === 'district' && !selectedDistrict) {
      newErrors.district = lang === 'sw' ? 'Wilaya inahitajika' : 'District is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // Find the selected office
      let officeId = '';
      let officeName = '';
      
      if (officeLevel === 'region') {
        const regionalOffice = offices.find(o => o.level === 'region' && o.region === selectedRegion);
        if (regionalOffice) {
          officeId = regionalOffice.id;
          officeName = regionalOffice.name;
        }
      } else {
        const districtOffice = offices.find(o => 
          o.level === 'district' && 
          o.region === selectedRegion && 
          o.district === selectedDistrict
        );
        if (districtOffice) {
          officeId = districtOffice.id;
          officeName = districtOffice.name;
        }
      }

      // Set default password
      const tempPassword = 'mtaa123.';

      // Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStaff.email,
        password: tempPassword,
        options: {
          data: {
            role: newStaff.role,
            office_id: officeId
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Generate first name from email (temporary)
        const firstName = newStaff.email.split('@')[0].split('.')[0] || 'Staff';
        const lastName = newStaff.email.split('@')[0].split('.')[1] || 'Member';
        
        // Create Profile
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          email: newStaff.email,
          phone: newStaff.phone,
          employer_id: newStaff.employer_id,
          role: newStaff.role,
          office_id: officeId,
          assigned_region: selectedRegion,
          assigned_district: officeLevel === 'district' ? selectedDistrict : null,
          is_verified: true,
          gender: 'Me',
          nationality: 'Mtanzania',
          temporary_password: tempPassword,
          must_change_password: true
        });

        if (profileError) throw profileError;

        // Show password modal
        setGeneratedPassword(tempPassword);
        setRegisteredStaffEmail(newStaff.email);
        setShowPasswordModal(true);
        
        setShowAddModal(false);
        resetForm();
        fetchStaff();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewStaff({ email: '', phone: '', employer_id: '', role: 'viewer' });
    setSelectedRegion('');
    setSelectedDistrict('');
    setOfficeLevel('region');
    setErrors({});
  };

  const seedServices = async () => {
    if (!confirm(lang === 'sw' ? 'Je, unataka kuingiza huduma za awali kwenye mfumo?' : 'Do you want to seed initial services into the system?')) return;
    
    setSeeding(true);
    try {
      const { error } = await supabase.from('services').upsert(INITIAL_SERVICES, { onConflict: 'name' });
      if (error) throw error;
      alert(lang === 'sw' ? 'Huduma zimeingizwa kikamilifu!' : 'Services seeded successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm(lang === 'sw' ? 'Je, una uhakika unataka kumfuta mtumishi huyu?' : 'Are you sure you want to delete this staff member?')) return;
    
    try {
      // Note: In production, you'd need to handle auth user deletion via Edge Function
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId);
      
      if (error) throw error;
      
      alert(lang === 'sw' ? 'Mtumishi amefutwa' : 'Staff deleted');
      fetchStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredStaff = staff.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.assigned_region || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">{lang === 'sw' ? 'Usimamizi wa Watumishi' : 'Staff Management'}</h2>
          <p className="text-stone-500 text-sm">{lang === 'sw' ? 'Sajili na panga watumishi kwenye ofisi za mikoa na wilaya.' : 'Register and assign staff to regional and district offices.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={seedServices}
            disabled={seeding}
            className="bg-stone-100 text-stone-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-stone-200 transition-all"
          >
            {seeding ? <Loader2 className="animate-spin" /> : <DatabaseZap size={20} />}
            {lang === 'sw' ? 'Ingiza Huduma' : 'Seed Services'}
          </button>
          <button 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-tz-blue transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={20} /> {lang === 'sw' ? 'Ongeza Mtumishi' : 'Add Staff'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input 
              type="text" 
              placeholder={lang === 'sw' ? 'Tafuta mtumishi...' : 'Search staff...'}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:border-primary outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50 text-stone-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">{lang === 'sw' ? 'Mtumishi' : 'Staff Member'}</th>
                <th className="px-6 py-4">{lang === 'sw' ? 'Ofisi / Eneo' : 'Office / Location'}</th>
                <th className="px-6 py-4">{lang === 'sw' ? 'Wajibu' : 'Role'}</th>
                <th className="px-6 py-4">{lang === 'sw' ? 'Hali' : 'Status'}</th>
                <th className="px-6 py-4 text-right">{lang === 'sw' ? 'Kitendo' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredStaff.map(s => (
                <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold">
                        {s.first_name?.[0] || 'S'}{s.last_name?.[0] || 'M'}
                      </div>
                      <div>
                        <p className="font-bold text-stone-800">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-stone-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-stone-600">
                      <Building2 size={14} className="text-stone-400" />
                      <span className="text-sm">
                        {s.assigned_region} 
                        {s.assigned_district ? ` / ${s.assigned_district}` : ' (Regional)'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      s.role === 'admin' ? "bg-purple-100 text-purple-600" : 
                      s.role === 'approver' ? "bg-emerald-100 text-emerald-600" :
                      s.role === 'viewer' ? "bg-blue-100 text-blue-600" :
                      "bg-stone-100 text-stone-600"
                    )}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteStaff(s.id)}
                      title={lang === 'sw' ? 'Futa mtumishi' : 'Delete staff'}
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    {lang === 'sw' ? 'Hakuna watumishi waliopatikana.' : 'No staff members found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal - Simplified with just email */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <h3 className="text-xl font-heading font-extrabold text-stone-900">{lang === 'sw' ? 'Sajili Mtumishi Mpya' : 'Register New Staff'}</h3>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  title={lang === 'sw' ? 'Funga' : 'Close'}
                  className="p-2 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-stone-500" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="p-8 space-y-6">
                <div className="space-y-6">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <Mail size={14} /> {lang === 'sw' ? 'Barua Pepe' : 'Email'} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required
                      type="email" 
                      placeholder="staff@example.com"
                      className={cn(
                        "w-full h-12 px-4 rounded-xl border focus:border-primary outline-none transition-all",
                        errors.email ? "border-red-300 bg-red-50" : "border-stone-200"
                      )}
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle size={12} /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <Phone size={14} /> {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required
                      type="tel" 
                      placeholder="+255 xxx xxxx xx"
                      className={cn(
                        "w-full h-12 px-4 rounded-xl border focus:border-primary outline-none transition-all",
                        errors.phone ? "border-red-300 bg-red-50" : "border-stone-200"
                      )}
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle size={12} /> {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Region Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <Globe size={14} /> {lang === 'sw' ? 'Mkoa' : 'Region'} <span className="text-red-500">*</span>
                    </label>
                    <select 
                      required
                      title={lang === 'sw' ? 'Chagua Mkoa' : 'Select Region'}
                      className={cn(
                        "w-full h-12 px-4 rounded-xl border focus:border-primary outline-none transition-all bg-white",
                        errors.region ? "border-red-300 bg-red-50" : "border-stone-200"
                      )}
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setSelectedDistrict('');
                        setErrors({});
                      }}
                    >
                      <option value="">{lang === 'sw' ? '-- Chagua Mkoa --' : '-- Select Region --'}</option>
                      {regions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {errors.region && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle size={12} /> {errors.region}
                      </p>
                    )}
                  </div>

                  {/* Office Level Selection */}
                  {selectedRegion && (
                    <div className="space-y-3 p-4 bg-stone-50 rounded-xl">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        {lang === 'sw' ? 'Kiwango cha Ofisi' : 'Office Level'}
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="officeLevel" 
                            value="region"
                            checked={officeLevel === 'region'}
                            onChange={() => {
                              setOfficeLevel('region');
                              setSelectedDistrict('');
                            }}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm font-medium text-stone-700">
                            {lang === 'sw' ? 'Mkoa (Regional)' : 'Regional'}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="officeLevel" 
                            value="district"
                            checked={officeLevel === 'district'}
                            onChange={() => setOfficeLevel('district')}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm font-medium text-stone-700">
                            {lang === 'sw' ? 'Wilaya (District)' : 'District'}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* District Selection (if district level) */}
                  {selectedRegion && officeLevel === 'district' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={14} /> {lang === 'sw' ? 'Wilaya' : 'District'} <span className="text-red-500">*</span>
                      </label>
                      <select 
                        required
                        title={lang === 'sw' ? 'Chagua Wilaya' : 'Select District'}
                        className={cn(
                          "w-full h-12 px-4 rounded-xl border focus:border-primary outline-none transition-all bg-white",
                          errors.district ? "border-red-300 bg-red-50" : "border-stone-200"
                        )}
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value);
                          setErrors({});
                        }}
                      >
                        <option value="">{lang === 'sw' ? '-- Chagua Wilaya --' : '-- Select District --'}</option>
                        {getDistrictsForRegion(selectedRegion).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      {errors.district && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> {errors.district}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Employer ID (if district level) */}
                  {selectedRegion && officeLevel === 'district' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                        <Briefcase size={14} /> {lang === 'sw' ? 'Namba ya Mtumishi' : 'Employer ID'} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required
                        type="text" 
                        placeholder="MTZ-123..."
                        className={cn(
                          "w-full h-12 px-4 rounded-xl border focus:border-primary outline-none transition-all",
                          errors.employer_id ? "border-red-300 bg-red-50" : "border-stone-200"
                        )}
                        value={newStaff.employer_id}
                        onChange={(e) => setNewStaff({...newStaff, employer_id: e.target.value})}
                      />
                      {errors.employer_id && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle size={12} /> {errors.employer_id}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <Shield size={14} /> {lang === 'sw' ? 'Wajibu' : 'Role'}
                    </label>
                    <select 
                      required
                      title={lang === 'sw' ? 'Chagua Wajibu' : 'Select Role'}
                      className="w-full h-12 px-4 rounded-xl border border-stone-200 focus:border-primary outline-none transition-all bg-white"
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})}
                    >
                      <option value="viewer">{lang === 'sw' ? 'Mtazamaji (Viewer)' : 'Viewer'}</option>
                      <option value="approver">{lang === 'sw' ? 'Muidhinishaji (Approver)' : 'Approver'}</option>
                      <option value="admin">{lang === 'sw' ? 'Msimamizi (Admin)' : 'Administrator'}</option>
                    </select>
                  </div>

                  {/* Office Preview */}
                  {selectedRegion && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                        {lang === 'sw' ? 'Ofisi Itakayopangwa' : 'Assigned Office'}
                      </p>
                      <div className="flex items-center gap-2 text-emerald-800">
                        <Building2 size={16} />
                        <span className="font-medium">
                          {officeLevel === 'region' 
                            ? `${selectedRegion} ${lang === 'sw' ? 'Ofisi ya Mkoa' : 'Regional Office'}`
                            : `${selectedDistrict} ${lang === 'sw' ? 'Ofisi ya Wilaya' : 'District Office'}, ${selectedRegion}`
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6 border-t border-stone-100">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-14 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                  >
                    {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                  </button>
                  <button 
                    disabled={loading}
                    type="submit"
                    className="flex-1 h-14 bg-primary text-white rounded-2xl font-bold hover:bg-tz-blue transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                    {lang === 'sw' ? 'Sajili' : 'Register'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Display Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-emerald-50/50">
                <h3 className="text-xl font-heading font-extrabold text-stone-900">
                  {lang === 'sw' ? 'Nywila ya Kuanzia' : 'Temporary Password'}
                </h3>
                <button 
                  onClick={() => setShowPasswordModal(false)} 
                  title={lang === 'sw' ? 'Funga' : 'Close'}
                  className="p-2 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-stone-500" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-center h-16 w-full bg-emerald-100 rounded-2xl border-2 border-emerald-300">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>

                <div className="space-y-2 text-center">
                  <p className="text-sm text-stone-500">
                    {lang === 'sw' ? 'Mtumishi amesajiliwa kikamilifu kwa barua pepe:' : 'Staff registered successfully with email:'}
                  </p>
                  <p className="text-sm font-bold text-stone-800 break-all">
                    {registeredStaffEmail}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    {lang === 'sw' ? 'Nywila ya Kuanzia' : 'Temporary Password'}
                  </p>
                  <div className="bg-stone-100 p-4 rounded-xl border-2 border-stone-200">
                    <code className="text-lg font-mono font-bold text-stone-900 break-all">
                      {generatedPassword}
                    </code>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {lang === 'sw' 
                      ? '⚠️ Mtumishi lazima abadilishe nywila hii katika login ya kwanza. Hakikisha kuwa nywila hii iko salama na sisambazwe kwa watu wengine.' 
                      : '⚠️ Staff must change this password on first login. Keep this password secure and do not share with others.'
                    }
                  </p>
                </div>

                <button
                  onClick={() => {
                    // Copy password to clipboard
                    if (generatedPassword) {
                      navigator.clipboard.writeText(generatedPassword);
                      alert(lang === 'sw' ? 'Nywila iliantiwa kwenye clipboard' : 'Password copied to clipboard');
                    }
                  }}
                  title={lang === 'sw' ? 'Anua Nywila' : 'Copy Password'}
                  className="w-full h-12 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
                >
                  📋 {lang === 'sw' ? 'Anua Nywila' : 'Copy Password'}
                </button>

                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:bg-tz-blue transition-all shadow-lg shadow-primary/20"
                >
                  {lang === 'sw' ? 'Karibu' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};