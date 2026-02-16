
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { supabase } from '../supabaseClient';

interface CompanyProfileProps {
  onBack: () => void;
  userEmail?: string;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ onBack, userEmail }) => {
  const [companyData, setCompanyData] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
    location: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utente non autenticato");

        const { data, error } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setCompanyData({
            name: data.name || '',
            website: data.website || '',
            industry: data.industry || '',
            description: data.description || '',
            location: data.location || ''
          });
        } else {
          setCompanyData(prev => ({ ...prev, name: userEmail?.split('@')[0] || 'Nuova Azienda' }));
        }
      } catch (err) {
        console.error("Errore caricamento profilo:", err);
        setError("Impossibile caricare i dati del profilo.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userEmail]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessione scaduta");

      const { error: upsertError } = await supabase
        .from('company_profiles')
        .upsert({
          id: user.id,
          name: companyData.name,
          website: companyData.website,
          industry: companyData.industry,
          description: companyData.description,
          location: companyData.location,
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;

      alert("Profilo aziendale aggiornato con successo!");
    } catch (err) {
      console.error("Errore salvataggio profilo:", err);
      setError("Errore durante il salvataggio. Riprova.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full px-6 py-32 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="text-slate-500 font-medium">Caricamento profilo...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 lg:px-12 py-20">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-medium group">
        <span className="group-hover:-translate-x-1 transition-transform"><Icons.ChevronLeft /></span> Torna alla Dashboard
      </button>

      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profilo Aziendale</h1>
            <p className="text-sm text-slate-500">Queste informazioni rendono i tuoi annunci più autorevoli.</p>
          </div>
          <div className="w-20 h-20 bg-brand text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-brand/20">
            {companyData.name ? companyData.name.charAt(0).toUpperCase() : '?'}
          </div>
        </div>

        {error && (
          <div className="mx-10 mt-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="p-10 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Azienda</label>
              <input
                required
                className="w-full px-5 py-3.5 border border-slate-200 focus:ring-2 focus:ring-brand outline-none transition-all text-lg shadow-inner"
                placeholder="es. Acme Corp"
                value={companyData.name}
                onChange={e => setCompanyData({...companyData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Settore</label>
              <input
                className="w-full px-5 py-3.5 border border-slate-200 focus:ring-2 focus:ring-brand outline-none transition-all text-lg shadow-inner"
                placeholder="es. Technology, Logistics..."
                value={companyData.industry}
                onChange={e => setCompanyData({...companyData, industry: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sito Web</label>
              <input
                type="url"
                className="w-full px-5 py-3.5 border border-slate-200 focus:ring-2 focus:ring-brand outline-none transition-all text-lg shadow-inner"
                placeholder="https://www.azienda.it"
                value={companyData.website}
                onChange={e => setCompanyData({...companyData, website: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sede Principale</label>
              <input
                className="w-full px-5 py-3.5 border border-slate-200 focus:ring-2 focus:ring-brand outline-none transition-all text-lg shadow-inner"
                placeholder="es. Milano, IT"
                value={companyData.location}
                onChange={e => setCompanyData({...companyData, location: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrizione Aziendale</label>
            <textarea
              rows={6}
              className="w-full px-5 py-4 border border-slate-200 focus:ring-2 focus:ring-brand outline-none transition-all resize-none text-lg shadow-inner"
              placeholder="Scrivi una breve presentazione dell'azienda..."
              value={companyData.description}
              onChange={e => setCompanyData({...companyData, description: e.target.value})}
            />
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-brand text-white px-12 py-5 font-bold hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest text-sm"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  Salvataggio...
                </>
              ) : 'Salva Profilo Aziendale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
