
import React, { useState } from 'react';
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
    if (!cvBase64) {
      alert("Carica il tuo CV prima di inviare.");
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl shadow-2xl p-8 relative animate-in zoom-in duration-300 my-8">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <h2 className="text-2xl font-bold text-slate-900 mb-1">Candidati per {job.title}</h2>
        <p className="text-slate-500 mb-8">{job.location}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Nome e Cognome</label>
              <input
                required
                className="w-full px-4 py-2.5 border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
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
                className="w-full px-4 py-2.5 border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
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
              className="w-full px-4 py-2.5 border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
              placeholder="+39 333 1234567"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Carica CV (PDF o DOC)</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-slate-100 px-6 py-2.5 border border-dashed border-slate-300 hover:bg-slate-200 transition-colors text-slate-600 font-medium">
                Scegli file
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              </label>
              <span className="text-sm text-slate-500 italic">
                {formData.cvFileName || 'Nessun file selezionato'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Lettera di Presentazione (opzionale)</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
              placeholder="Raccontaci perché sei la persona giusta..."
              value={formData.coverLetter}
              onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
            ></textarea>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 space-y-3">
             <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="privacy-consent"
                  className="mt-1 w-4 h-4 accent-brand"
                  required
                  checked={formData.consentGiven}
                  onChange={e => setFormData({...formData, consentGiven: e.target.checked})}
                />
                <label htmlFor="privacy-consent" className="text-[11px] text-slate-600 leading-tight cursor-pointer">
                  Dichiaro di aver letto l'<strong>Informativa sulla Privacy</strong> e acconsento al trattamento dei miei dati personali per finalità legate alla selezione del personale, ai sensi del Regolamento UE 2016/679 (GDPR).
                </label>
             </div>
             <div className="flex items-center gap-2 text-[10px] text-brand font-bold uppercase tracking-wider">
                <Icons.Sparkles />
                I tuoi dati sono al sicuro: utilizziamo crittografia end-to-end e non condividiamo i tuoi file con terze parti.
             </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!formData.consentGiven}
              className="w-full py-3.5 bg-brand text-white font-bold text-lg hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:grayscale"
            >
              Invia Candidatura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
