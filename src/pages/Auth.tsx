import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Globe2, 
  Building2, 
  MapPin, 
  Phone 
} from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { supabase } from '@/src/lib/supabase';
import { MapPicker } from '@/src/components/MapPicker';
import { cn } from '@/src/lib/utils';
import { TANZANIA_LOGO_URL } from '@/src/constants/services';

interface AuthProps {
  mode: 'login' | 'signup';
  onClose: () => void;
  setMode: (mode: 'login' | 'signup') => void;
}

export function Auth({ mode, onClose, setMode }: AuthProps) {
  const { fetchUserProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [nidaVerifying, setNidaVerifying] = useState(false);
  const [nidaVerified, setNidaVerified] = useState(false);
  const [nidaError, setNidaError] = useState<string | null>(null);

  const [regForm, setRegForm] = useState({
    firstName: "", middleName: "", lastName: "", sex: "Me", nationality: "Mtanzania", nidaNumber: "",
    region: "", district: "", ward: "", street: "", phone: "", email: "", password: "", confirmPassword: "",
    lat: null as number | null, lng: null as number | null,
    isDiaspora: false, countryOfResidence: "", passportNumber: "", countryOfCitizenship: ""
  });

  const handleLocationSelect = (location: any) => {
    setRegForm(prev => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
      region: location.addressComponents.region || prev.region,
      district: location.addressComponents.district || prev.district,
      ward: location.addressComponents.ward || prev.ward,
      street: location.addressComponents.street || prev.street,
    }));
  };

  const updateRegForm = (key: string, value: any) => setRegForm((p) => ({ ...p, [key]: value }));

  const verifyNIDA = async () => {
    if (regForm.nidaNumber.length !== 20) {
      setNidaError(lang === 'sw' ? "Namba ya NIDA lazima iwe na tarakimu 20" : "NIDA number must be 20 digits");
      return;
    }

    setNidaVerifying(true);
    setNidaError(null);
    setNidaVerified(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (regForm.nidaNumber.startsWith('000')) {
        throw new Error(lang === 'sw' ? "Namba ya NIDA haijapatikana" : "NIDA number not found");
      }

      setNidaVerified(true);
      setRegForm(prev => ({
        ...prev,
        firstName: "JUMA",
        middleName: "ABDALLAH",
        lastName: "MSUYA",
        sex: "Me"
      }));
    } catch (err: any) {
      setNidaError(err.message);
    } finally {
      setNidaVerifying(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert(lang === 'sw' ? "Tafadhali jaza barua pepe na nywila" : "Please enter email and password");
      return;
    }

    if (!email.includes('@')) {
      alert(lang === 'sw' ? "Barua pepe si sahihi" : "Invalid email format");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password.trim()
      });

      if (error) {
        console.error('Login error details:', {
          message: error.message,
          status: error.status,
          error_code: (error as any).error_code,
          email: email
        });

        let errorMsg = error.message;
        if (error.message?.includes('Invalid login credentials')) {
          errorMsg = lang === 'sw' 
            ? "Barua pepe au nywila si sahihi. Hakikisha kuwa akaunti imefungwa na nywila yako ni 'mtaa123.'"
            : "Invalid email or password. Make sure your account is created and password is 'mtaa123.'";
        } else if (error.message?.includes('Email not confirmed')) {
          errorMsg = lang === 'sw'
            ? "Tafadhali thibitisha barua pepe yako kwanza"
            : "Please confirm your email address first";
        }

        alert(errorMsg);
        return;
      }

      if (data.user) {
        console.log('Login successful:', data.user.email);
        await fetchUserProfile();
        onClose();
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      alert(lang === 'sw' ? "Hitilafu: " + err.message : "Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (regForm.password !== regForm.confirmPassword) {
      alert(lang === 'sw' ? "Nywila hazifanani" : "Passwords do not match");
      return;
    }

    if (!regForm.isDiaspora && regForm.nidaNumber.length !== 20) {
      alert(lang === 'sw' ? "Namba ya NIDA lazima iwe na tarakimu 20" : "NIDA number must be 20 digits");
      return;
    }

    if (!regForm.phone || !isValidPhoneNumber(regForm.phone)) {
      alert(lang === 'sw' ? "Namba ya simu haijakamilika au si sahihi" : "Phone number is incomplete or invalid");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ 
      email: regForm.email, 
      password: regForm.password 
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        first_name: regForm.firstName,
        middle_name: regForm.middleName,
        last_name: regForm.lastName,
        email: regForm.email,
        phone: regForm.phone,
        sex: regForm.sex,
        gender: regForm.sex,
        nationality: regForm.nationality === 'Mtanzania' ? 'Tanzanian' : 'Foreigner',
        country_of_citizenship: regForm.nationality === 'Mtanzania' ? 'Tanzania' : regForm.countryOfCitizenship,
        nida_number: regForm.nidaNumber,
        region: regForm.region,
        district: regForm.district,
        ward: regForm.ward,
        street: regForm.street,
        is_diaspora: regForm.isDiaspora,
        country_of_residence: regForm.countryOfResidence,
        passport_number: regForm.passportNumber,
        role: 'citizen',
        is_verified: nidaVerified || regForm.isDiaspora || regForm.nationality === 'Mwingine'
      });
    }
    alert('Signup successful! Please check your email.');
    setLoading(false);
  };

  // Calculate progress percentage for mobile bar
  const progressPercentage = Math.round((regStep / 3) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        aria-label={lang === 'sw' ? 'Funga kidirisha' : 'Close modal'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClose();
          }
        }}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'login' ? t.login : t.signup}
        aria-labelledby="auth-dialog-title"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <img 
                src={TANZANIA_LOGO_URL} 
                alt={lang === 'sw' ? 'Nembo ya Tanzania' : 'Tanzania Coat of Arms'} 
                className="w-6 h-6 object-contain" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <h2 id="auth-dialog-title" className="text-xl font-black tracking-tight text-stone-900">
                {mode === 'login' ? t.login : t.signup}
              </h2>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">E-MTAA PORTAL</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={lang === 'sw' ? 'Funga' : 'Close'}
            title={lang === 'sw' ? 'Funga' : 'Close'}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {mode === 'login' ? (
            <div className="max-w-md mx-auto py-4">
              <form onSubmit={handleLogin} className="space-y-6" noValidate>
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                    {t.email}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} aria-hidden="true" />
                    <input 
                      id="login-email"
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                      placeholder="juma@example.com"
                      aria-label={t.email}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label htmlFor="login-password" className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                      {t.password}
                    </label>
                    <button 
                      type="button" 
                      className="text-xs font-bold text-emerald-600 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-md px-2 py-1"
                      aria-label={lang === 'sw' ? 'Umesahau nywila?' : 'Forgot password?'}
                    >
                      {lang === 'sw' ? 'Umesahau Nywila?' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} aria-hidden="true" />
                    <input 
                      id="login-password"
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                      placeholder="••••••••"
                      aria-label={t.password}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-1"
                      aria-label={showPassword ? (lang === 'sw' ? 'Ficha nywila' : 'Hide password') : (lang === 'sw' ? 'Onyesha nywila' : 'Show password')}
                      title={showPassword ? (lang === 'sw' ? 'Ficha nywila' : 'Hide password') : (lang === 'sw' ? 'Onyesha nywila' : 'Show password')}
                    >
                      {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button 
                  disabled={loading || !email || !password}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl",
                    loading || !email || !password
                      ? "bg-stone-300 text-stone-600 cursor-not-allowed opacity-60"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  )}
                  type="submit"
                  aria-label={loading ? (lang === 'sw' ? 'Inaingia...' : 'Logging in...') : t.login}
                >
                  {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : t.login}
                  {loading && <span className="sr-only">{lang === 'sw' ? 'Inaingia...' : 'Logging in...'}</span>}
                </button>

                <div className="text-center">
                  <p className="text-sm text-stone-500">
                    {lang === 'sw' ? 'Hauna akaunti?' : "Don't have an account?"}{' '}
                    <button 
                      type="button" 
                      onClick={() => setMode('signup')} 
                      className="text-emerald-600 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-md px-2 py-1"
                      aria-label={lang === 'sw' ? 'Jisajili' : 'Sign up'}
                    >
                      {t.signup}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Signup Progress - Desktop */}
              <div className="hidden sm:flex items-center justify-between mb-12 relative" aria-label={lang === 'sw' ? 'Hatua za usajili' : 'Registration steps'}>
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-100 -translate-y-1/2 -z-10" aria-hidden="true"></div>
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center gap-2 bg-white px-4">
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-2",
                        regStep === step ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200" : 
                        regStep > step ? "bg-emerald-100 border-emerald-100 text-emerald-600" : "bg-white border-stone-200 text-stone-400"
                      )}
                      aria-current={regStep === step ? 'step' : undefined}
                    >
                      {regStep > step ? <CheckCircle2 size={20} aria-hidden="true" /> : step}
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", regStep === step ? "text-emerald-600" : "text-stone-400")}>
                      {step === 1 ? (lang === 'sw' ? 'Binafsi' : 'Personal') : 
                       step === 2 ? (lang === 'sw' ? 'Mahali' : 'Location') : 
                       (lang === 'sw' ? 'Akaunti' : 'Account')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mobile Progress Bar */}
              <div 
                className="sm:hidden relative h-1.5 w-full bg-stone-100 rounded-full overflow-hidden mb-8"
                role="progressbar"
                aria-valuenow={`${progressPercentage}`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={lang === 'sw' ? 'Maendeleo ya usajili' : 'Registration progress'}
                aria-valuetext={`${progressPercentage}% ${lang === 'sw' ? 'kamilika' : 'complete'}`}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-emerald-600 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <AnimatePresence mode="wait">
                {regStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                          <Globe2 size={18} aria-hidden="true" />
                          {lang === 'sw' ? 'Upo Diaspora?' : 'Are you in Diaspora?'}
                        </h4>
                        <p className="text-xs text-emerald-700">{lang === 'sw' ? 'Washa hii kama unaishi nje ya Tanzania.' : 'Toggle this if you live outside Tanzania.'}</p>
                      </div>
                      <button 
                        onClick={() => updateRegForm('isDiaspora', !regForm.isDiaspora)}
                        className={cn(
                          "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                          regForm.isDiaspora ? "bg-emerald-600" : "bg-stone-300"
                        )}
                        role="switch"
                        aria-checked={`${regForm.isDiaspora}`}
                        aria-label={lang === 'sw' ? 'Hali ya diaspora' : 'Diaspora status'}
                      >
                        <span 
                          className={cn(
                            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                            regForm.isDiaspora ? "translate-x-6" : "translate-x-1"
                          )} 
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="nationality" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {lang === 'sw' ? 'Uraia' : 'Nationality'}
                        </label>
                        <select 
                          id="nationality"
                          value={regForm.nationality}
                          onChange={(e) => updateRegForm('nationality', e.target.value)}
                          className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                          aria-label={lang === 'sw' ? 'Chagua uraia' : 'Select nationality'}
                        >
                          <option value="Mtanzania">{lang === 'sw' ? 'Mtanzania' : 'Tanzanian'}</option>
                          <option value="Mwingine">{lang === 'sw' ? 'Mwingine' : 'Other'}</option>
                        </select>
                      </div>
                      
                      {regForm.nationality === 'Mwingine' && (
                        <div className="space-y-2">
                          <label htmlFor="countryOfCitizenship" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                            {lang === 'sw' ? 'Nchi ya Uraia' : 'Country of Citizenship'}
                          </label>
                          <input 
                            id="countryOfCitizenship"
                            type="text"
                            value={regForm.countryOfCitizenship}
                            onChange={(e) => updateRegForm('countryOfCitizenship', e.target.value)}
                            className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            placeholder={lang === 'sw' ? 'Mf. Kenya' : 'e.g. Kenya'}
                            aria-label={lang === 'sw' ? 'Nchi ya uraia' : 'Country of citizenship'}
                          />
                        </div>
                      )}
                    </div>

                    {!regForm.isDiaspora && regForm.nationality === 'Mtanzania' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="nidaNumber" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                            {lang === 'sw' ? 'Namba ya NIDA' : 'NIDA Number'}
                          </label>
                          <div className="flex gap-2">
                            <input 
                              id="nidaNumber"
                              type="text"
                              value={regForm.nidaNumber}
                              onChange={(e) => updateRegForm('nidaNumber', e.target.value.replace(/\D/g, '').slice(0, 20))}
                              className="flex-1 h-14 px-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                              placeholder="19900101-XXXXX-XXXXX-XX"
                              aria-label={lang === 'sw' ? 'Namba ya NIDA' : 'NIDA number'}
                              aria-invalid={`${!!nidaError}`}
                              aria-describedby={nidaError ? 'nida-error' : nidaVerified ? 'nida-success' : undefined}
                            />
                            <button 
                              type="button"
                              onClick={verifyNIDA}
                              disabled={nidaVerifying || regForm.nidaNumber.length !== 20}
                              className="px-6 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                              aria-label={lang === 'sw' ? 'Hakiki namba ya NIDA' : 'Verify NIDA number'}
                            >
                              {nidaVerifying ? <Loader2 className="animate-spin" aria-hidden="true" /> : (lang === 'sw' ? 'Hakiki' : 'Verify')}
                            </button>
                          </div>
                          {nidaError && (
                            <p id="nida-error" className="text-xs text-red-500 font-bold flex items-center gap-1" role="alert">
                              <AlertCircle size={12} aria-hidden="true" /> {nidaError}
                            </p>
                          )}
                          {nidaVerified && (
                            <p id="nida-success" className="text-xs text-emerald-600 font-bold flex items-center gap-1" role="status">
                              <CheckCircle2 size={12} aria-hidden="true" /> {lang === 'sw' ? 'NIDA imehakikiwa kikamilifu' : 'NIDA verified successfully'}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label htmlFor="passportNumber" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {lang === 'sw' ? 'Namba ya Pasipoti' : 'Passport Number'}
                        </label>
                        <input 
                          id="passportNumber"
                          type="text"
                          value={regForm.passportNumber}
                          onChange={(e) => updateRegForm('passportNumber', e.target.value)}
                          className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                          placeholder="AB123456"
                          aria-label={lang === 'sw' ? 'Namba ya pasipoti' : 'Passport number'}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {lang === 'sw' ? 'Jina la Kwanza' : 'First Name'}
                        </label>
                        <input 
                          id="firstName"
                          type="text"
                          value={regForm.firstName}
                          onChange={(e) => updateRegForm('firstName', e.target.value)}
                          readOnly={nidaVerified}
                          className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium disabled:opacity-70"
                          aria-label={lang === 'sw' ? 'Jina la kwanza' : 'First name'}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="middleName" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {lang === 'sw' ? 'Jina la Kati' : 'Middle Name'}
                        </label>
                        <input 
                          id="middleName"
                          type="text"
                          value={regForm.middleName}
                          onChange={(e) => updateRegForm('middleName', e.target.value)}
                          readOnly={nidaVerified}
                          className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium disabled:opacity-70"
                          aria-label={lang === 'sw' ? 'Jina la kati' : 'Middle name'}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {lang === 'sw' ? 'Jina la Mwisho' : 'Last Name'}
                        </label>
                        <input 
                          id="lastName"
                          type="text"
                          value={regForm.lastName}
                          onChange={(e) => updateRegForm('lastName', e.target.value)}
                          readOnly={nidaVerified}
                          className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium disabled:opacity-70"
                          aria-label={lang === 'sw' ? 'Jina la mwisho' : 'Last name'}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1" id="gender-label">
                        {lang === 'sw' ? 'Jinsia' : 'Gender'}
                      </span>
                      <div className="flex gap-4" role="radiogroup" aria-labelledby="gender-label">
                        {['Me', 'Ke'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => !nidaVerified && updateRegForm('sex', s)}
                            className={cn(
                              "flex-1 h-14 rounded-2xl font-bold border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                              regForm.sex === s ? "bg-emerald-50 border-emerald-600 text-emerald-600" : "bg-white border-stone-100 text-stone-400"
                            )}
                            role="radio"
                            aria-checked={`${regForm.sex === s}`}
                            aria-label={s === 'Me' ? (lang === 'sw' ? 'Mwanaume' : 'Male') : (lang === 'sw' ? 'Mwanamke' : 'Female')}
                          >
                            {s === 'Me' ? (lang === 'sw' ? 'Mwanaume' : 'Male') : (lang === 'sw' ? 'Mwanamke' : 'Female')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setRegStep(2)}
                      className="w-full h-16 bg-stone-900 text-white rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2 mt-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      aria-label={lang === 'sw' ? 'Endelea kwenye hatua ya pili' : 'Continue to step 2'}
                    >
                      {lang === 'sw' ? 'Endelea' : 'Continue'} <ArrowRight size={20} aria-hidden="true" />
                    </button>
                  </motion.div>
                )}

                {regStep === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {regForm.isDiaspora ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="countryOfResidence" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                            {lang === 'sw' ? 'Nchi Unapoishi' : 'Country of Residence'}
                          </label>
                          <input 
                            id="countryOfResidence"
                            type="text"
                            value={regForm.countryOfResidence}
                            onChange={(e) => updateRegForm('countryOfResidence', e.target.value)}
                            className="w-full h-14 px-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            placeholder={lang === 'sw' ? 'Mf. Uingereza' : 'e.g. United Kingdom'}
                            aria-label={lang === 'sw' ? 'Nchi unayoishi' : 'Country of residence'}
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                          <MapPin className="text-blue-600 shrink-0" size={20} aria-hidden="true" />
                          <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            {lang === 'sw' 
                              ? 'Tafadhali chagua eneo unaloishi kwenye ramani. Hii itatusaidia kukuunganisha na serikali ya mtaa wako.' 
                              : 'Please select your residential location on the map. This helps us connect you with your local government.'}
                          </p>
                        </div>
                        
                        <div className="h-75 rounded-2xl overflow-hidden border border-stone-200 shadow-inner">
                          <MapPicker onLocationSelect={handleLocationSelect} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label htmlFor="region" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                              {lang === 'sw' ? 'Mkoa' : 'Region'}
                            </label>
                            <input 
                              id="region"
                              readOnly 
                              value={regForm.region} 
                              className="w-full h-12 px-4 bg-stone-100 border border-stone-200 rounded-xl text-sm font-bold text-stone-600"
                              aria-label={lang === 'sw' ? 'Mkoa uliochagua' : 'Selected region'}
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="district" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                              {lang === 'sw' ? 'Wilaya' : 'District'}
                            </label>
                            <input 
                              id="district"
                              readOnly 
                              value={regForm.district} 
                              className="w-full h-12 px-4 bg-stone-100 border border-stone-200 rounded-xl text-sm font-bold text-stone-600"
                              aria-label={lang === 'sw' ? 'Wilaya uliyochagua' : 'Selected district'}
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="ward" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                              {lang === 'sw' ? 'Kata' : 'Ward'}
                            </label>
                            <input 
                              id="ward"
                              readOnly 
                              value={regForm.ward} 
                              className="w-full h-12 px-4 bg-stone-100 border border-stone-200 rounded-xl text-sm font-bold text-stone-600"
                              aria-label={lang === 'sw' ? 'Kata uliyochagua' : 'Selected ward'}
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="street" className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                              {lang === 'sw' ? 'Mtaa' : 'Street'}
                            </label>
                            <input 
                              id="street"
                              readOnly 
                              value={regForm.street} 
                              className="w-full h-12 px-4 bg-stone-100 border border-stone-200 rounded-xl text-sm font-bold text-stone-600"
                              aria-label={lang === 'sw' ? 'Mtaa uliochagua' : 'Selected street'}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setRegStep(1)}
                        className="flex-1 h-16 bg-white border border-stone-200 text-stone-600 rounded-2xl font-bold text-lg hover:bg-stone-50 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        aria-label={lang === 'sw' ? 'Rudi kwenye hatua ya kwanza' : 'Back to step 1'}
                      >
                        <ArrowLeft size={20} aria-hidden="true" /> {lang === 'sw' ? 'Rudi' : 'Back'}
                      </button>
                      <button 
                        onClick={() => setRegStep(3)}
                        className="flex-2 h-16 bg-stone-900 text-white rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        aria-label={lang === 'sw' ? 'Endelea kwenye hatua ya tatu' : 'Continue to step 3'}
                      >
                        {lang === 'sw' ? 'Endelea' : 'Continue'} <ArrowRight size={20} aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {regStep === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <form onSubmit={handleSignup} className="space-y-6" noValidate>
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 z-10" size={20} aria-hidden="true" />
                          <PhoneInput
                            id="phone"
                            international
                            defaultCountry="TZ"
                            value={regForm.phone}
                            onChange={(val) => updateRegForm('phone', val)}
                            className="w-full h-14 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500 transition-all font-medium"
                            aria-label={lang === 'sw' ? 'Namba ya simu' : 'Phone number'}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="signup-email" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                          {t.email}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} aria-hidden="true" />
                          <input 
                            id="signup-email"
                            type="email" 
                            value={regForm.email}
                            onChange={(e) => updateRegForm('email', e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            placeholder="juma@example.com"
                            aria-label={t.email}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="signup-password" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                            {t.password}
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} aria-hidden="true" />
                            <input 
                              id="signup-password"
                              type="password" 
                              value={regForm.password}
                              onChange={(e) => updateRegForm('password', e.target.value)}
                              className="w-full h-14 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                              placeholder="••••••••"
                              aria-label={t.password}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="confirmPassword" className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">
                            {lang === 'sw' ? 'Thibitisha Nywila' : 'Confirm Password'}
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} aria-hidden="true" />
                            <input 
                              id="confirmPassword"
                              type="password" 
                              value={regForm.confirmPassword}
                              onChange={(e) => updateRegForm('confirmPassword', e.target.value)}
                              className="w-full h-14 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                              placeholder="••••••••"
                              aria-label={lang === 'sw' ? 'Thibitisha nywila' : 'Confirm password'}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <div className="flex items-start gap-3">
                          <input 
                            id="terms"
                            type="checkbox" 
                            required 
                            className="mt-1 h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                            aria-label={lang === 'sw' ? 'Kubali vigezo na masharti' : 'Accept terms and conditions'}
                          />
                          <label htmlFor="terms" className="text-xs text-stone-500 leading-relaxed font-medium">
                            {lang === 'sw' 
                              ? "Ninakubali Vigezo na Masharti ya E-Mtaa na Sera ya Faragha ya Serikali ya Tanzania." 
                              : "I agree to the E-Mtaa Terms and Conditions and the Government of Tanzania Privacy Policy."}
                          </label>
                        </div>

                        <div className="flex gap-4">
                          <button 
                            className="flex-1 h-16 bg-white border border-stone-200 text-stone-600 rounded-2xl font-bold text-lg hover:bg-stone-50 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            type="button" 
                            onClick={() => setRegStep(2)}
                            aria-label={lang === 'sw' ? 'Rudi kwenye hatua ya pili' : 'Back to step 2'}
                          >
                            <ArrowLeft size={20} aria-hidden="true" /> {lang === 'sw' ? 'Rudi' : 'Back'}
                          </button>
                          <button 
                            disabled={loading}
                            className="flex-2 h-16 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 disabled:opacity-50 group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            type="submit"
                            aria-label={loading ? (lang === 'sw' ? 'Inajisajili...' : 'Signing up...') : (lang === 'sw' ? 'Kamilisha usajili' : 'Complete registration')}
                          >
                            {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : (
                              <>
                                {lang === 'sw' ? 'Kamilisha Usajili' : 'Complete Registration'} 
                                <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" aria-hidden="true" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}