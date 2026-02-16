
import React, { useState, useEffect, useMemo } from 'react';
import { Job, Application, ViewState, JobType, JobCategory } from './types';
import { Icons } from './constants';
import { JobCard } from './components/JobCard';
import { JobForm } from './components/JobForm';
import { ApplicationModal } from './components/ApplicationModal';
import { AdminModule } from './components/AdminModule';
import { CompanyProfile } from './components/CompanyProfile';
import { Settings } from './components/Settings';
import { ThankYou } from './components/ThankYou';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(() => {
    const savedView = localStorage.getItem('shs_job_view');
    return (savedView as ViewState) || 'PUBLIC';
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    localStorage.setItem('shs_job_view', view);
  }, [view]);

  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const isAuth = !!session;
      setIsAuthenticated(isAuth);
      setUserEmail(session?.user?.email);
      if (!isAuth && view.startsWith('ADMIN')) setView('PUBLIC');
      setIsAuthLoading(false);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuth = !!session;
      setIsAuthenticated(isAuth);
      setUserEmail(session?.user?.email);
      if (!isAuth && view.startsWith('ADMIN')) setView('PUBLIC');
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (view.startsWith('ADMIN') && isAuthenticated) fetchData(false); 
  }, [view, isAuthenticated]);

  const fetchData = async (showMainLoader = true) => {
    if (showMainLoader) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('posted_at', { ascending: false });
      if (jobsError) throw jobsError;

      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .order('applied_at', { ascending: false });

      const mappedJobs: Job[] = (jobsData || []).map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        category: j.category as JobCategory,
        type: j.type as JobType,
        location: j.location,
        description: j.description,
        requirements: j.requirements || [],
        salaryRange: j.salary_range,
        postedAt: j.posted_at,
        isFeatured: j.is_featured || false
      }));

      const mappedApps: Application[] = (appsData || []).map(a => ({
        id: a.id,
        jobId: a.job_id,
        candidateName: a.candidate_name,
        email: a.email,
        phone: a.phone,
        coverLetter: a.cover_letter,
        cvFileName: a.cv_file_name,
        cvBase64: a.cv_base64,
        appliedAt: a.applied_at,
        consentGiven: a.consent_given || false
      }));

      setJobs(mappedJobs);
      setApplications(mappedApps);
    } catch (err) {
      console.error("Errore caricamento dati:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    jobs.forEach(j => cats.add(j.category));
    return Array.from(cats).sort();
  }, [jobs]);

  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const totalApps = applications.length;
    const avgAppsPerJob = totalJobs > 0 ? (totalApps / totalJobs).toFixed(1) : 0;
    
    const categoryDist = availableCategories.map(cat => ({
      name: cat,
      count: jobs.filter(j => j.category === cat).length,
      apps: applications.filter(a => jobs.find(j => j.id === a.jobId)?.category === cat).length
    }));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentApps = applications.filter(a => new Date(a.appliedAt) > sevenDaysAgo).length;
    return { totalJobs, totalApps, avgAppsPerJob, categoryDist, recentApps };
  }, [jobs, applications, availableCategories]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.username,
      password: loginForm.password,
    });
    if (error) setLoginError('Credenziali non valide.');
    else setView('ADMIN');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('PUBLIC');
    localStorage.removeItem('shs_job_view');
  };

  const handleAddJob = async (jobData: Omit<Job, 'id' | 'postedAt'>) => {
    try {
      const dbJob = {
        title: jobData.title,
        company: jobData.company,
        category: jobData.category,
        type: jobData.type,
        location: jobData.location,
        description: jobData.description,
        requirements: jobData.requirements,
        salary_range: jobData.salaryRange,
        is_featured: jobData.isFeatured
      };

      if (editingJob) {
        const { error } = await supabase.from('jobs').update(dbJob).eq('id', editingJob.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('jobs').insert([{ ...dbJob, posted_at: new Date().toISOString() }]);
        if (error) throw error;
      }
      await fetchData(false);
      setEditingJob(null);
      setView('ADMIN');
    } catch (err) {
      console.error("Errore salvataggio job:", err);
      alert("Errore nel salvataggio.");
    }
  };

  const handleRemoveJob = async (id: string) => {
    if (!confirm("Eliminare questo annuncio?")) return;
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
      await fetchData(false);
    } catch (err) {
      console.error("Errore eliminazione:", err);
    }
  };

  const handleApply = async (appData: Omit<Application, 'id' | 'appliedAt'>) => {
    setIsApplyModalOpen(false);
    setView('THANK_YOU');
    try {
      const appliedAt = new Date().toISOString();
      const { data: newApp, error: insertError } = await supabase.from('applications').insert([{
        job_id: appData.jobId,
        candidate_name: appData.candidateName,
        email: appData.email,
        phone: appData.phone,
        cover_letter: appData.coverLetter,
        cv_file_name: appData.cvFileName,
        cv_base64: appData.cvBase64,
        applied_at: appliedAt,
        consent_given: appData.consentGiven
      }]).select().single();

      if (insertError) throw insertError;

      // Gestione Webhook
      try {
        const job = jobs.find(j => j.id === appData.jobId);
        const { data: profile } = await supabase
          .from('company_profiles')
          .select('notifications_enabled, webhook_url')
          .limit(1)
          .single();

        if (profile?.notifications_enabled && profile?.webhook_url) {
          fetch(profile.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'new_application',
              candidate: {
                name: appData.candidateName,
                email: appData.email,
                phone: appData.phone,
                message: appData.coverLetter,
                consentGiven: appData.consentGiven
              },
              job: {
                title: job?.title,
                category: job?.category,
                id: appData.jobId
              },
              appliedAt
            })
          }).catch(e => console.error("Webhook failed:", e));
        }
      } catch (webhookErr) {
        console.warn("Could not process webhook:", webhookErr);
      }

      fetchData(false); 
    } catch (err) {
      console.error("Errore invio candidatura:", err);
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    const filtered = filterType === 'All' 
      ? jobs 
      : jobs.filter(j => j.category === filterType);
      
    // Priorità agli annunci in evidenza, poi ordine cronologico
    return [...filtered].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }, [jobs, filterType]);

  if (isAuthLoading || (isLoading && view === 'PUBLIC')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent animate-spin rounded-full"></div>
          <p className="text-slate-500 font-medium animate-pulse">Sincronizzazione in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 px-1.5 py-1.5 shadow-xl flex items-center gap-1">
          <button onClick={() => { setView('PUBLIC'); setSelectedJob(null); }} className={`px-5 py-2 text-sm font-bold transition-all ${view === 'PUBLIC' || view === 'JOB_DETAILS' || view === 'THANK_YOU' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Posizioni Aperte</button>
          <button onClick={() => setView('ADMIN')} className={`px-5 py-2 text-sm font-bold transition-all ${view.startsWith('ADMIN') ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Area Azienda</button>
        </div>
      </div>

      <main className="pt-8">
        {view === 'PUBLIC' && (
          <div className="w-full px-6 lg:px-12 py-20">
            <div className="mb-12 text-center">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Lavora con noi</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Sfoglia le nostre posizioni aperte e trova la tua prossima sfida professionale.</p>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-10 justify-center">
              <button 
                onClick={() => setFilterType('All')} 
                className={`px-5 py-2 text-sm font-semibold transition-all border ${filterType === 'All' ? 'bg-brand text-white shadow-md border-brand' : 'bg-white text-slate-600 border-slate-200 hover:border-brand'}`}
              >
                Tutti
              </button>
              {availableCategories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setFilterType(cat)} 
                  className={`px-5 py-2 text-sm font-semibold transition-all border ${filterType === cat ? 'bg-brand text-white shadow-md border-brand' : 'bg-white text-slate-600 border-slate-200 hover:border-brand'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {filteredAndSortedJobs.length > 0 ? (
                filteredAndSortedJobs.map(job => (
                  <JobCard key={job.id} job={job} onClick={(j) => { setSelectedJob(j); setView('JOB_DETAILS'); }} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-slate-400 font-medium">Nessuna posizione trovata per i criteri selezionati.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'JOB_DETAILS' && selectedJob && (
          <div className="w-full px-6 lg:px-20 py-32">
            <button onClick={() => { setView('PUBLIC'); setSelectedJob(null); }} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-medium group">
              <span className="group-hover:-translate-x-1 transition-transform"><Icons.ChevronLeft /></span>Torna agli annunci
            </button>
            <div className="bg-white border border-slate-200 p-8 md:p-16 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block px-3 py-1 text-xs font-bold bg-brand-light text-brand uppercase tracking-widest">{selectedJob.category}</span>
                    {selectedJob.isFeatured && (
                      <span className="inline-block px-3 py-1 text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Icons.Sparkles /> In Evidenza
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">{selectedJob.title}</h1>
                  <div className="flex flex-wrap gap-6 text-slate-500 font-medium mt-4">
                    <div className="flex items-center gap-2"><Icons.MapPin />{selectedJob.location}</div>
                    <div className="flex items-center gap-2"><Icons.Clock />{selectedJob.type}</div>
                  </div>
                </div>
                <button onClick={() => setIsApplyModalOpen(true)} className="bg-brand text-white px-10 py-5 font-bold text-xl hover:bg-brand-dark transition-all shadow-xl shadow-brand/20">Candidati Ora</button>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap mb-10 text-lg">
                {selectedJob.description}
              </div>
            </div>
          </div>
        )}

        {view === 'THANK_YOU' && (
          <ThankYou onBack={() => { setView('PUBLIC'); setSelectedJob(null); }} jobTitle={selectedJob?.title} />
        )}

        {view.startsWith('ADMIN') && !isAuthenticated && (
          <div className="max-w-md mx-auto px-4 py-32">
            <div className="bg-white p-8 border border-slate-200 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-light text-brand rounded-full mb-4"><Icons.Briefcase /></div>
                <h2 className="text-2xl font-bold text-slate-900">Bentornato</h2>
                <p className="text-slate-500 text-sm">Accedi per gestire la tua bacheca.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input type="email" required className="w-full px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-brand outline-none transition-all" placeholder="email@azienda.it" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                  <input type="password" required className="w-full px-4 py-3 border border-slate-200 focus:ring-2 focus:ring-brand outline-none transition-all" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                {loginError && <div className="bg-red-50 text-red-500 p-3 text-xs border border-red-100 font-medium">{loginError}</div>}
                <button type="submit" className="w-full py-4 bg-brand text-white font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 mt-4 uppercase tracking-widest text-sm">Accedi</button>
              </form>
            </div>
          </div>
        )}

        {view === 'ADMIN' && isAuthenticated && (
          <AdminModule jobs={jobs} applications={applications} stats={stats} onLogout={handleLogout} onCreateJob={() => setView('ADMIN_CREATE')} onViewApplications={() => setView('ADMIN_APPLICATIONS')} onEditJob={(job) => { setEditingJob(job); setView('ADMIN_EDIT'); }} onRemoveJob={handleRemoveJob} onNavigate={(newView) => setView(newView)} onRefresh={() => fetchData(false)} isRefreshing={isRefreshing} userEmail={userEmail} />
        )}

        {view === 'ADMIN_APPLICATIONS' && isAuthenticated && (
          <div className="w-full px-6 lg:px-12 py-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <button onClick={() => setView('ADMIN')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium"><Icons.ChevronLeft />Torna alla Dashboard</button>
              <button onClick={() => fetchData(false)} disabled={isRefreshing} className="text-brand text-sm font-bold flex items-center gap-2 hover:underline disabled:opacity-50"><div className={isRefreshing ? 'animate-spin' : ''}><Icons.Clock /></div>Aggiorna</button>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Registro Candidature ({applications.length})</h1>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {applications.length > 0 ? (
                applications.map(app => (
                  <div key={app.id} className="bg-white p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{app.candidateName}</h3>
                      <p className="text-sm text-slate-500 font-medium mb-1">Per: <span className="text-slate-900">{jobs.find(j => j.id === app.jobId)?.title || 'Posizione rimossa'}</span></p>
                      <p className="text-sm text-slate-500 font-medium mb-4">{app.email} &bull; {app.phone}</p>
                      <div className="bg-slate-50 p-5 border-l-4 border-brand italic text-slate-600 text-sm">"{app.coverLetter || 'Nessuna lettera.'}"</div>
                      {app.consentGiven && (
                        <p className="mt-2 text-[10px] text-green-600 font-bold uppercase flex items-center gap-1">
                           <Icons.CheckCircle /> Consenso Privacy Fornito
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 min-w-[180px] w-full sm:w-auto">
                      <a href={app.cvBase64} download={app.cvFileName} className="bg-slate-900 text-white px-6 py-3 text-sm font-bold text-center hover:bg-slate-800 transition-colors uppercase">Scarica CV</a>
                      <p className="text-[10px] text-center text-slate-400 font-bold uppercase">Ricevuto il: {new Date(app.appliedAt).toLocaleDateString('it-IT')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-white border border-slate-200 p-20 text-center"><p className="text-slate-400 font-medium">Nessuna candidatura trovata.</p></div>
              )}
            </div>
          </div>
        )}

        {view === 'ADMIN_PROFILE' && isAuthenticated && <CompanyProfile onBack={() => setView('ADMIN')} userEmail={userEmail} />}
        {view === 'ADMIN_SETTINGS' && isAuthenticated && <Settings onBack={() => setView('ADMIN')} userEmail={userEmail} />}
        {(view === 'ADMIN_CREATE' || view === 'ADMIN_EDIT') && isAuthenticated && (
          <div className="py-20 px-6 lg:px-12">
            <JobForm initialData={editingJob || undefined} onSubmit={handleAddJob} onCancel={() => setView('ADMIN')} />
          </div>
        )}
      </main>

      {isApplyModalOpen && selectedJob && (
        <ApplicationModal job={selectedJob} isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} onSubmit={handleApply} />
      )}
    </div>
  );
};

export default App;
