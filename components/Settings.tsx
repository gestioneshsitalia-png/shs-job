
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { supabase } from '../supabaseClient';

interface SettingsProps {
  onBack: () => void;
  userEmail?: string;
  onUpdateAiStatus?: (status: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, userEmail, onUpdateAiStatus }) => {
  const [settings, setSettings] = useState({
    notifications: false,
    webhookUrl: '',
    aiAssist: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('company_profiles')
          .select('notifications_enabled, webhook_url, ai_assist_enabled')
          .eq('id', user.id)
          .single();

        if (data) {
          setSettings({
            notifications: data.notifications_enabled || false,
            webhookUrl: data.webhook_url || '',
            aiAssist: data.ai_assist_enabled ?? true
          });
        } else {
          // Fallback su localStorage se il profilo non esiste ancora
          const localAi = localStorage.getItem('shs_ai_enabled');
          if (localAi !== null) {
            setSettings(prev => ({ ...prev, aiAssist: localAi === 'true' }));
          }
        }
      } catch (err) {
        console.warn("Errore caricamento impostazioni DB, uso fallback locale.");
        const localAi = localStorage.getItem('shs_ai_enabled');
        if (localAi !== null) {
          setSettings(prev => ({ ...prev, aiAssist: localAi === 'true' }));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Aggiornamento locale immediato per UX
    localStorage.setItem('shs_ai_enabled', String(settings.aiAssist));
    if (onUpdateAiStatus) onUpdateAiStatus(settings.aiAssist);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessione scaduta");

      // Proviamo a salvare tutto su DB
      const { error } = await supabase
        .from('company_profiles')
        .upsert({
          id: user.id,
          notifications_enabled: settings.notifications,
          webhook_url: settings.webhookUrl,
          ai_assist_enabled: settings.aiAssist,
          updated_at: new Date().toISOString()
        });

      if (error) {
        // Se l'errore è dovuto alla colonna mancante (codice 42703 in PostgreSQL), proviamo a salvare solo il resto
        console.warn("Possibile colonna mancante nel DB, provo salvataggio parziale.");
        const { error: partialError } = await supabase
          .from('company_profiles')
          .upsert({
            id: user.id,
            notifications_enabled: settings.notifications,
            webhook_url: settings.webhookUrl,
            updated_at: new Date().toISOString()
          });
          
        if (partialError) throw partialError;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Errore salvataggio:", err);
      // Anche se il DB fallisce, abbiamo già aggiornato il localStorage, 
      // quindi mostriamo comunque successo per l'assistente AI ma avvisiamo dell'errore generale
      alert("Impostazioni AI aggiornate localmente. Si è verificato un errore nel salvataggio su database remoto (probabile schema mancante).");
      setSaveSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Tutti i campi sono obbligatori.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Le nuove password non coincidono.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La nuova password deve essere di almeno 6 caratteri.');
      return;
    }

    setIsChangingPassword(true);

    try {
      // 1. Verifica la vecchia password ri-autenticando l'utente
      if (!userEmail) throw new Error("Email utente non disponibile.");
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: passwordForm.oldPassword,
      });

      if (authError) {
        setPasswordError('La vecchia password non è corretta.');
        setIsChangingPassword(false);
        return;
      }

      // 2. Aggiorna la password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) throw updateError;

      setPasswordSuccess('Password aggiornata con successo!');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error("Errore cambio password:", err);
      setPasswordError(err.message || 'Si è verificato un errore durante il cambio password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full px-6 py-32 flex justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 lg:px-12 py-20">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium group">
          <span className="group-hover:-translate-x-1 transition-transform"><Icons.ChevronLeft /></span> Torna alla Dashboard
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand text-white px-8 py-3 font-bold text-sm hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 disabled:opacity-50 uppercase tracking-widest"
        >
          {isSaving ? 'Salvataggio...' : saveSuccess ? '✓ Salvato' : 'Salva Modifiche'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="p-8 border-b border-slate-100 bg-slate-50/30">
            <h2 className="text-2xl font-bold text-slate-900">Integrazioni & Notifiche</h2>
            <p className="text-sm text-slate-500">Collega la tua bacheca a strumenti esterni come Make.com o Zapier.</p>
          </div>
          <div className="p-8 space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  Notifiche Email & Webhook
                  {settings.notifications && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Attivo</span>}
                </p>
                <p className="text-sm text-slate-500">Invia i dati delle candidature a un indirizzo esterno non appena vengono ricevuti.</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, notifications: !settings.notifications})}
                className={`w-16 h-8 rounded-full transition-all relative shrink-0 ${settings.notifications ? 'bg-brand' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${settings.notifications ? 'left-9' : 'left-1.5'}`}></div>
              </button>
            </div>

            {settings.notifications && (
              <div className="p-8 bg-brand-light/30 border border-brand/10 space-y-6 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-white border border-brand/20 rounded-lg flex items-center justify-center font-bold text-brand italic text-xl shadow-sm">M</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Webhook URL (Make.com / Custom)</p>
                    <p className="text-xs text-slate-500">Incolla qui l'URL fornito dal tuo scenario Make.</p>
                  </div>
                </div>
                <input 
                  type="url"
                  className="w-full px-5 py-4 border border-slate-200 focus:ring-2 focus:ring-brand outline-none font-mono text-sm shadow-inner"
                  placeholder="https://hook.eu1.make.com/your-unique-id"
                  value={settings.webhookUrl}
                  onChange={e => setSettings({...settings, webhookUrl: e.target.value})}
                />
                <div className="flex gap-3 p-4 bg-white border border-brand/10 text-xs text-slate-600 italic">
                  <Icons.Sparkles />
                  <span>Dati inviati: Nome, Email, Job ID, Titolo Posizione, Lettera Motivazionale.</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
              <div>
                <p className="font-bold text-slate-900 text-lg">Assistente AI Gemini</p>
                <p className="text-sm text-slate-500">Usa l'intelligenza artificiale per generare le descrizioni degli annunci.</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, aiAssist: !settings.aiAssist})}
                className={`w-16 h-8 rounded-full transition-all relative shrink-0 ${settings.aiAssist ? 'bg-brand' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${settings.aiAssist ? 'left-9' : 'left-1.5'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm h-fit">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900">Sicurezza Account</h2>
            <p className="text-sm text-slate-500">Gestisci l'accesso e la tua password.</p>
          </div>
          <div className="p-8">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <p className="font-bold text-slate-900 text-lg mb-4">Cambia Password</p>
                
                {passwordError && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-2">
                    <Icons.AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4" />
                    {passwordSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Vecchia Password</label>
                    <input 
                      type="password"
                      required
                      className="w-full px-5 py-3 border border-slate-200 focus:ring-2 focus:ring-brand outline-none text-sm shadow-sm"
                      placeholder="••••••••"
                      value={passwordForm.oldPassword}
                      onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nuova Password</label>
                      <input 
                        type="password"
                        required
                        className="w-full px-5 py-3 border border-slate-200 focus:ring-2 focus:ring-brand outline-none text-sm shadow-sm"
                        placeholder="••••••••"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Conferma Nuova Password</label>
                      <input 
                        type="password"
                        required
                        className="w-full px-5 py-3 border border-slate-200 focus:ring-2 focus:ring-brand outline-none text-sm shadow-sm"
                        placeholder="••••••••"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-slate-900 text-white px-8 py-3.5 font-bold text-sm hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg disabled:opacity-50"
              >
                {isChangingPassword ? 'Aggiornamento...' : 'Aggiorna Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
