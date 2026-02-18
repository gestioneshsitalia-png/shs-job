
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
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [appFilterCategory, setAppFilterCategory] = useState<string>('All');
  const [appFilterDateStart, setAppFilterDateStart] = useState<string>('');
  const [appFilterDateEnd, setAppFilterDateEnd] = useState<string>('');

  // Blocco dello scroll della pagina principale quando il modulo è aperto
  useEffect(() => {
    if (isApplyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isApplyModalOpen]);

  useEffect(() => {
    localStorage.setItem('shs_job_view', view);
  }, [view]);

  useEffect(() => {
    if ((view === 'JOB_DETAILS' || view === 'THANK_YOU') && !selectedJob) {
      setView('PUBLIC');
    }
  }, [view, selectedJob]);

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

  const handleAddJob = async (jobData: Omit<Job, 'id' | 'postedAt'>) => {
    const dbJob: any = {
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

    const performSave = async (payload: any) => {
      if (editingJob) {
        return await supabase.from('jobs').update(payload).eq('id', editingJob.id);
      } else {
        return await supabase.from('jobs').insert([{ ...payload, posted_at: new Date().toISOString() }]);
      }
    };

    try {
      const { error } = await performSave(dbJob);
      if (error) throw error;
      await fetchData(false);
      setEditingJob(null);
      setView('ADMIN');
    } catch (err: any) {
      console.error("Errore salvataggio job:", err);
      alert("Errore nel salvataggio: " + err.message);
    }
  };

  const handleApply = async (appData: Omit<Application, 'id' | 'appliedAt'>) => {
    setIsApplyModalOpen(false);
    setIsSubmittingApp(true);
    
    const dbApp: any = {
      job_id: appData.jobId,
      candidate_name: appData.candidateName,
      email: appData.email,
      phone: appData.phone,
      cover_letter: appData.coverLetter,
      cv_file_name: appData.cvFileName,
      cv_base64: appData.cvBase64,
      applied_at: new Date().toISOString(),
      consent_given: appData.consentGiven
    };

    try {
      const { error: insertError } = await supabase.from('applications').insert([dbApp]);
      if (insertError) throw insertError;

      // Gestione Webhook Robusta
      try {
        const job = jobs.find(j => j.id === appData.jobId);
        // Cerchiamo il profilo senza usare .single() per evitare errori se la tabella è vuota
        const { data: profiles } = await supabase
          .from('company_profiles')
          .select('notifications_enabled, webhook_url')
          .limit(1);

        const profile = profiles && profiles.length > 0 ? profiles[0] : null;

        if (profile?.notifications_enabled && profile?.webhook_url) {
          await fetch(profile.webhook_url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'new_application',
              candidate: {
                name: appData.candidateName,
                email: appData.email,
                phone: appData.phone,
                message: appData.coverLetter,
                consentGiven: appData.consentGiven,
                cv: {
                  fileName: appData.cvFileName,
                  data: appData.cvBase64
                }
              },
              job: {
                title: job?.title,
                category: job?.category,
                id: appData.jobId
              },
              appliedAt: dbApp.applied_at
            })
          });
        }
      } catch (webhookErr) {
        console.warn("Webhook bypassable error:", webhookErr);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchData(false); 
      setView('THANK_YOU');
    } catch (err: any) {
      console.error("Errore invio candidatura:", err);
      alert("Si è verificato un errore nell'invio: " + err.message);
    } finally {
      setIsSubmittingApp(false);
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

  const filteredAndSortedJobs = useMemo(() => {
    const filtered = filterType === 'All' 
      ? jobs 
      : jobs.filter(j => j.category === filterType);
    return [...filtered].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }, [jobs, filterType]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const job = jobs.find(j => j.id === app.jobId);
      const categoryMatch = appFilterCategory === 'All' || (job && job.category === appFilterCategory);
      const appDate = new Date(app.appliedAt);
      const startMatch = !appFilterDateStart || appDate >= new Date(appFilterDateStart);
      const endMatch = !appFilterDateEnd || appDate <= new Date(appFilterDateEnd + 'T23:59:59');
      return categoryMatch && startMatch && endMatch;
    });
  }, [applications, jobs, appFilterCategory, appFilterDateStart, appFilterDateEnd]);

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
      {isSubmittingApp && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-6 text-center px-4">
            <div className="w-16 h-16 border-4 border-brand border-t-transparent animate-spin rounded-full shadow-lg"></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Stiamo inviando la tua candidatura</h2>
              <p className="text-slate-500 font-medium animate-pulse">Attendi qualche secondo, stiamo salvando i tuoi dati e il tuo CV...</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] sm:w-auto">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 px-1 py-1 shadow-xl flex items-center gap-1 w-full sm:w-auto rounded-none">
          <button 
            onClick={() => { setView('PUBLIC'); setSelectedJob(null); }} 
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${view === 'PUBLIC' || view === 'JOB_DETAILS' || view === 'THANK_YOU' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            Posizioni Aperte
          </button>
          <button 
            onClick={() => setView('ADMIN')} 
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${view.startsWith('ADMIN') ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            Area Azienda
          </button>
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
              <button onClick={() => setFilterType('All')} className={`px-5 py-2 text-sm font-semibold transition-all border ${filterType === 'All' ? 'bg-brand text-white shadow-md border-brand' : 'bg-white text-slate-600 border-slate-200 hover:border-brand'}`}>Tutti</button>
              {availableCategories.map(cat => (
                <button key={cat} onClick={() => setFilterType(cat)} className={`px-5 py-2 text-sm font-semibold transition-all border ${filterType === cat ? 'bg-brand text-white shadow-md border-brand' : 'bg-white text-slate-600 border-slate-200 hover:border-brand'}`}>{cat}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {filteredAndSortedJobs.map(job => (
                <JobCard key={job.id} job={job} onClick={(j) => { setSelectedJob(j); setView('JOB_DETAILS'); }} />
              ))}
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
                    {selectedJob.isFeatured && <span className="inline-block px-3 py-1 text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-widest flex items-center gap-1.5"><Icons.Sparkles /> In Evidenza</span>}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">{selectedJob.title}</h1>
                  <div className="flex flex-wrap gap-6 text-slate-500 font-medium mt-4">
                    <div className="flex items-center gap-2"><Icons.MapPin />{selectedJob.location}</div>
                    <div className="flex items-center gap-2"><Icons.Clock />{selectedJob.type}</div>
                  </div>
                </div>
                <button onClick={() => setIsApplyModalOpen(true)} className="bg-brand text-white px-10 py-5 font-bold text-xl hover:bg-brand-dark transition-all shadow-xl shadow-brand/20">Candidati Ora</button>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap mb-10 text-lg">{selectedJob.description}</div>
            </div>
          </div>
        )}

        {view === 'THANK_YOU' && <ThankYou onBack={() => { setView('PUBLIC'); setSelectedJob(null); }} jobTitle={selectedJob?.title} />}
        {view.startsWith('ADMIN') && !isAuthenticated && (
          <div className="max-w-md mx-auto px-4 py-32">
            <div className="bg-white p-8 border border-slate-200 shadow-2xl text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-light text-brand rounded-full mb-4"><Icons.Briefcase /></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Area Azienda</h2>
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <input type="email" required className="w-full px-4 py-3 border border-slate-200 outline-none" placeholder="Email" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
                <input type="password" required className="w-full px-4 py-3 border border-slate-200 outline-none" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
                <button type="submit" className="w-full py-4 bg-brand text-white font-bold uppercase tracking-widest">Accedi</button>
              </form>
            </div>
          </div>
        )}

        {view === 'ADMIN' && isAuthenticated && <AdminModule jobs={jobs} applications={applications} stats={stats} onLogout={handleLogout} onCreateJob={() => setView('ADMIN_CREATE')} onViewApplications={() => setView('ADMIN_APPLICATIONS')} onEditJob={(job) => { setEditingJob(job); setView('ADMIN_EDIT'); }} onRemoveJob={handleRemoveJob} onNavigate={(newView) => setView(newView)} onRefresh={() => fetchData(false)} isRefreshing={isRefreshing} userEmail={userEmail} />}
        {view === 'ADMIN_APPLICATIONS' && isAuthenticated && (
          <div className="w-full px-6 lg:px-12 py-20">
            <button onClick={() => setView('ADMIN')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-medium"><Icons.ChevronLeft />Dashboard</button>
            <h1 className="text-3xl font-bold text-slate-900 mb-12">Registro Candidature</h1>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredApplications.map(app => (
                <div key={app.id} className="bg-white p-8 border border-slate-200 flex flex-col sm:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{app.candidateName}</h3>
                    <p className="text-sm text-slate-500 mb-4">{app.email} &bull; {app.phone}</p>
                    <div className="bg-slate-50 p-4 italic text-sm text-slate-600">"{app.coverLetter || 'Nessun messaggio.'}"</div>
                  </div>
                  <div className="flex flex-col gap-3 min-w-[150px]">
                    {app.cvBase64 && <a href={app.cvBase64} download={app.cvFileName} className="bg-slate-900 text-white px-4 py-2 text-xs font-bold text-center uppercase">Scarica CV</a>}
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase">{new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {view === 'ADMIN_PROFILE' && isAuthenticated && <CompanyProfile onBack={() => setView('ADMIN')} userEmail={userEmail} />}
        {view === 'ADMIN_SETTINGS' && isAuthenticated && <Settings onBack={() => setView('ADMIN')} userEmail={userEmail} />}
        {(view === 'ADMIN_CREATE' || view === 'ADMIN_EDIT') && isAuthenticated && <div className="py-20 px-6 lg:px-12"><JobForm initialData={editingJob || undefined} onSubmit={handleAddJob} onCancel={() => setView('ADMIN')} /></div>}
      </main>

      {isApplyModalOpen && selectedJob && (
        <ApplicationModal job={selectedJob} isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} onSubmit={handleApply} />
      )}
    </div>
  );
};

export default App;
