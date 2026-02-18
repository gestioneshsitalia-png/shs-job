
import React, { useState, useEffect } from 'react';
import { Job, Application } from '../types';
import { Icons } from '../constants';

interface ApplicationModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (app: Omit<Application, 'id' | 'appliedAt'>) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ job, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    candidateName: '',
    email: '',
    phone: '',
    coverLetter: '',
    cvFileName: '',
    consentGiven: false
  });
  const [cvBase64, setCvBase64] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Blocco dello scroll della pagina sottostante quando il modal è aperto
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - html.clientWidth;
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.paddingRight = '';
    }
    
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, cvFileName: file.name }));
      const reader = new FileReader();
      reader.onload = () => {
        setCvBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (!formData.cvFileName || !cvBase64) {
      alert("Il caricamento del CV è obbligatorio per procedere con la candidatura.");
      return;
    }

    if (!formData.consentGiven) {
      alert("È necessario accettare il trattamento dei dati personali per procedere.");
      return;
    }
    
    onSubmit({
      ...formData,
      jobId: job.id,
      cvBase64
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm overflow-y-auto outline-none">
      <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
        <div className="bg-white w-full max-w-2xl shadow-2xl p-6 sm:p-10 relative animate-in slide-in-from-top-4 duration-300 mt-4 mb-12 sm:my-12">
          {/* Tasto chiusura migliorato */}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-6 sm:right-6 p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all z-20 rounded-full"
            aria-label="Chiudi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          <div className="pr-12 sm:pr-0 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 leading-tight">Candidati per {job.title}</h2>
            <p className="text-sm text-slate-500">{job.location}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Nome e Cognome</label>
                <input
                  required
                  className="w-full px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-brand outline-none text-base bg-white"
                  placeholder="Mario Rossi"
                  value={formData.candidateName}
                  onChange={e => setFormData({ ...formData, candidateName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                  required
                  type="email"
                  className="w-full px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-brand outline-none text-base bg-white"
                  placeholder="mario@esempio.it"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Telefono</label>
              <input
                required
                type="tel"
                className="w-full px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-brand outline-none text-base bg-white"
                placeholder="es. 3331234567"
                value={formData.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, phone: val });
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                Carica CV (PDF o DOC) <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className={`cursor-pointer px-6 py-3 border border-dashed hover:bg-slate-200 transition-colors font-bold text-center sm:text-left bg-slate-100 ${attemptedSubmit && !formData.cvFileName ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-300 text-slate-600'}`}>
                    Scegli file
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                  </label>
                  <span className={`text-sm italic truncate max-w-full block ${attemptedSubmit && !formData.cvFileName ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                    {formData.cvFileName || 'Nessun file selezionato (Obbligatorio)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Lettera di Presentazione (opzionale)</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-brand outline-none text-base bg-white"
                placeholder="Raccontaci perché sei la persona giusta..."
                value={formData.coverLetter}
                onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
              ></textarea>
            </div>

            <div className="bg-slate-50 p-5 border border-slate-200 space-y-4">
               <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="privacy-consent"
                    className="mt-1 w-6 h-6 shrink-0 accent-brand cursor-pointer"
                    required
                    checked={formData.consentGiven}
                    onChange={e => setFormData({...formData, consentGiven: e.target.checked})}
                  />
                  <label htmlFor="privacy-consent" className="text-[11px] sm:text-xs text-slate-600 leading-tight cursor-pointer font-medium">
                    Dichiaro di aver letto l'<strong>Informativa sulla Privacy</strong> e acconsento al trattamento dei miei dati personali per finalità legate alla selezione del personale (GDPR).
                  </label>
               </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-5 bg-brand text-white font-bold text-lg hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 disabled:opacity-50 disabled:grayscale uppercase tracking-widest active:scale-[0.98]"
              >
                Invia Candidatura
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
