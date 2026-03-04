import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/src/context/LanguageContext';
import { HARDCODED_SERVICES } from '@/src/constants/services';
import { Service } from '@/src/lib/supabase';
import { formatCurrency } from '@/src/lib/currency';
import { 
  FileCheck2, 
  Users2, 
  PartyPopper, 
  Skull, 
  Handshake 
} from 'lucide-react';

interface ServicesProps {
  onSelectService: (service: Service) => void;
}

export function Services({ onSelectService }: ServicesProps) {
  const { lang, currency } = useLanguage();

  const getServiceIcon = (name: string) => {
    if (name.includes('Mkazi')) return FileCheck2;
    if (name.includes('Utambulisho')) return Users2;
    if (name.includes('Tukio')) return PartyPopper;
    if (name.includes('Mazishi')) return Skull;
    if (name.includes('Mauziano')) return Handshake;
    return FileCheck2;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-stone-900">{lang === 'sw' ? 'Huduma Zinazopatikana' : 'Available Services'}</h2>
        <p className="text-stone-500 font-medium">
          {lang === 'sw' ? 'Chagua huduma unayoihitaji na ufanye maombi.' : 'Choose the service you need and make an application.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {HARDCODED_SERVICES.map(service => {
          const Icon = getServiceIcon(service.name);
          return (
            <div 
              key={service.id} 
              className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
              onClick={() => onSelectService(service)}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Icon size={24} />
                </div>
                <div className="bg-orange-50 text-orange-800 px-4 py-1.5 rounded-full text-xs font-bold border border-orange-100">
                  {formatCurrency(service.fee, currency)}
                </div>
              </div>
              
              <div className="space-y-1 mb-3">
                <h3 className="font-bold text-xl text-stone-900 tracking-tight">
                  {lang === 'sw' ? service.name : service.name_en || service.name}
                </h3>
                <p className="text-sm font-medium text-stone-400">
                  {lang === 'sw' ? service.name_en || 'Service' : service.name}
                </p>
              </div>
              
              <p className="text-stone-500 mb-8 line-clamp-2 leading-relaxed font-medium">
                {lang === 'sw' ? service.description : service.description_en || service.description}
              </p>
              
              <div className="mt-auto">
                <button className="w-full bg-[#2471A3] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1F618D] transition-all shadow-lg shadow-blue-100 group-hover:scale-[1.02]">
                  {lang === 'sw' ? 'Omba Sasa' : 'Apply Now'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
