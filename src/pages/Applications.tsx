import React from 'react';
import { motion } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useLanguage } from '@/src/context/LanguageContext';
import { Application } from '@/src/lib/supabase';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { formatCurrency } from '@/src/lib/currency';
import { DocumentRenderer } from '@/src/components/DocumentRenderer';

interface ApplicationsProps {
  applications: Application[];
  onPay: (app: Application) => void;
}

export function Applications({ applications, onPay }: ApplicationsProps) {
  const { lang, t, currency } = useLanguage();

  return (
    <motion.div 
      key="applications"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-stone-800">{t.myApplications}</h2>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.services}</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{lang === 'sw' ? 'Namba ya Maombi' : 'App Number'}</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.date}</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">{t.status}</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">{t.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {applications.map(app => (
              <tr key={app.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-stone-800">{lang === 'sw' ? (app as any).services?.name : (app as any).services?.name_en || (app as any).services?.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-stone-500">{app.application_number}</td>
                <td className="px-6 py-4 text-sm text-stone-500">{new Date(app.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={app.status} lang={lang} />
                </td>
                <td className="px-6 py-4 text-right">
                  {app.status === 'submitted' && (app as any).services?.fee > 0 ? (
                    <button 
                      onClick={() => onPay(app)}
                      className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
                    >
                      {t.payNow} ({formatCurrency((app as any).services?.fee, currency)})
                    </button>
                  ) : app.status === 'issued' ? (
                    <PDFDownloadLink 
                      document={<DocumentRenderer application={app} service={(app as any).services} />} 
                      fileName={`Certificate_${app.application_number}.pdf`}
                      className="text-emerald-600 text-sm font-bold hover:underline"
                    >
                      {({ loading }) => loading ? 'Loading...' : 'Download'}
                    </PDFDownloadLink>
                  ) : (
                    <button className="text-stone-400 text-sm font-bold cursor-not-allowed">In Progress</button>
                  )}
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                  {lang === 'sw' ? 'Hakuna maombi yaliyopatikana.' : 'No applications found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
