
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Job, Application, ViewState } from '../types';
import { Icons } from '../constants';
import { StatsGrid } from './StatsGrid';

interface AdminModuleProps {
  jobs: Job[];
  applications: Application[];
  onLogout: () => void;
  onCreateJob: () => void;
  onViewApplications: () => void;
  onEditJob: (job) => void;
  onRemoveJob: (id: string) => void;
  onNavigate: (view: ViewState) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  stats: any;
  userEmail?: string;
}

type TimeScale = 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

export const AdminModule: React.FC<AdminModuleProps> = ({
  jobs,
  applications,
  onLogout,
  onCreateJob,
  onViewApplications,
  onEditJob,
  onRemoveJob,
  onNavigate,
  onRefresh,
  isRefreshing,
  stats,
  userEmail
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timeScale, setTimeScale] = useState<TimeScale>('Monthly');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : 'AD';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chartData = useMemo(() => {
    const now = new Date();
    let periods: { label: string; count: number }[] = [];

    if (timeScale === 'Daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('it-IT', { weekday: 'short' });
        const count = applications.filter(app => {
          const appDate = new Date(app.appliedAt);
          return appDate.toDateString() === d.toDateString();
        }).length;
        periods.push({ label, count });
      }
    } else if (timeScale === 'Weekly') {
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i * 7 + 7));
        const end = new Date();
        end.setDate(now.getDate() - (i * 7));
        const label = `Sett ${4-i}`;
        const count = applications.filter(app => {
          const appDate = new Date(app.appliedAt);
          return appDate >= start && appDate <= end;
        }).length;
        periods.push({ label, count });
      }
    } else if (timeScale === 'Monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
        const count = applications.filter(app => {
          const appDate = new Date(app.appliedAt);
          return appDate.getMonth() === d.getMonth() && appDate.getFullYear() === d.getFullYear();
        }).length;
        periods.push({ label, count });
      }
    } else if (timeScale === 'Custom' && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const step = Math.max(1, Math.floor(diffDays / 6));
      for (let i = 0; i <= 6; i++) {
        const currentStart = new Date(start);
        currentStart.setDate(start.getDate() + (i * step));
        const currentEnd = new Date(currentStart);
        currentEnd.setDate(currentStart.getDate() + step);
        
        const label = currentStart.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
        const count = applications.filter(app => {
          const appDate = new Date(app.appliedAt);
          return appDate >= currentStart && appDate < currentEnd;
        }).length;
        periods.push({ label, count });
      }
    } else {
      periods = Array(6).fill(0).map((_, i) => ({ label: `T${i+1}`, count: 0 }));
    }

    const maxCount = Math.max(...periods.map(p => p.count), 1);
    return periods.map(p => ({ ...p, percentage: (p.count / maxCount) * 100 }));
  }, [applications, timeScale, customRange]);

  return (
    <div className="w-full px-6 lg:px-12 py-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Dashboard Amministratore</h1>
          <p className="text-slate-500 mt-1">Gestisci le tue posizioni aperte e monitora le performance.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-brand transition-all hover:bg-brand-light disabled:opacity-50"
          >
            <div className={isRefreshing ? 'animate-spin' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            </div>
          </button>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 bg-white border border-slate-200 pl-2 pr-4 py-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <div className="w-9 h-9 bg-brand text-white flex items-center justify-center font-bold text-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Account</p>
                <p className="text-sm font-semibold text-slate-700 truncate max-w-[150px]">{userEmail?.split('@')[0]}</p>
              </div>
              <Icons.ChevronDown />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Accesso effettuato come</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{userEmail}</p>
                </div>
                <div className="p-2">
                  <button onClick={() => { onNavigate('ADMIN_PROFILE'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand transition-colors text-left"><Icons.User /> Profilo Aziendale</button>
                  <button onClick={() => { onNavigate('ADMIN_SETTINGS'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand transition-colors text-left"><Icons.Settings /> Impostazioni SaaS</button>
                </div>
                <div className="p-2 border-t border-slate-100">
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-semibold text-left"><Icons.LogOut /> Esci dal sistema</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={onCreateJob} className="flex items-center gap-2 bg-brand text-white px-8 py-4 font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"><Icons.Plus /> Nuova Posizione</button>
        <button onClick={onViewApplications} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 font-bold hover:bg-slate-50 transition-all">
          <Icons.Users /> Visualizza Candidature ({applications.length})
        </button>
      </div>

      <StatsGrid 
        stats={[
          { label: 'Posizioni Attive', value: stats.totalJobs, trend: 'Dashboard Live', trendColor: 'text-brand' },
          { label: 'Candidati Totali', value: stats.totalApps, trend: `+${stats.recentApps} ultimi 7gg`, trendColor: 'text-blue-600' },
          { label: 'Media Candidati', value: stats.avgAppsPerJob, trend: 'Ottimo engagement' },
          { label: 'Tasso AI', value: '100%', trend: 'Assistente attivo', trendColor: 'text-brand' }
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
        <div className="bg-white border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
             <Icons.Briefcase />
             Candidature per Categoria
          </h3>
          <div className="space-y-6">
            {stats.categoryDist.map((cat: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">{cat.name}</span>
                  <span className="text-xs font-bold text-brand uppercase">{cat.apps} Candidati</span>
                </div>
                <div className="w-full bg-slate-100 h-3 overflow-hidden">
                  <div 
                    className="bg-brand h-full transition-all duration-1000"
                    style={{ width: `${Math.max(5, (cat.apps / (stats.totalApps || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {stats.categoryDist.length === 0 && <p className="text-slate-400 text-sm italic">Nessun dato disponibile.</p>}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Icons.Clock />
              Engagement Candidati
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['Daily', 'Weekly', 'Monthly', 'Custom'] as TimeScale[]).map(s => (
                <button
                  key={s}
                  onClick={() => setTimeScale(s)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-tighter transition-all rounded-md ${timeScale === s ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {s === 'Daily' ? 'Giorno' : s === 'Weekly' ? 'Sett' : s === 'Monthly' ? 'Mese' : 'Data'}
                </button>
              ))}
            </div>
          </div>

          {timeScale === 'Custom' && (
            <div className="grid grid-cols-2 gap-4 mb-6 animate-in slide-in-from-top-1 duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Dal</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-slate-200 outline-none focus:ring-1 focus:ring-brand" 
                  value={customRange.start}
                  onChange={e => setCustomRange({...customRange, start: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Al</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-slate-200 outline-none focus:ring-1 focus:ring-brand" 
                  value={customRange.end}
                  onChange={e => setCustomRange({...customRange, end: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="flex items-end gap-5 h-64 pt-6 flex-1">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2.5 py-1 rounded font-bold mb-1">
                  {data.count}
                </div>
                <div 
                  className={`w-full ${data.percentage > 0 ? 'bg-brand' : 'bg-slate-100'} transition-all duration-700 hover:bg-brand-dark cursor-pointer shadow-sm`}
                  style={{ height: `${Math.max(2, data.percentage)}%` }}
                ></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase truncate w-full text-center">{data.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Gestione Annunci</h3>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{jobs.length} Posizioni</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-sm font-bold text-slate-600 uppercase tracking-wider">Posizione</th>
                <th className="px-8 py-5 text-sm font-bold text-slate-600 uppercase tracking-wider">Categoria</th>
                <th className="px-8 py-5 text-sm font-bold text-slate-600 uppercase tracking-wider">Candidati</th>
                <th className="px-8 py-5 text-sm font-bold text-slate-600 uppercase tracking-wider text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6 font-bold text-slate-900 group-hover:text-brand transition-colors text-lg">{job.title}</td>
                  <td className="px-8 py-6 text-slate-500">
                    <span className="px-3 py-1.5 bg-slate-100 text-xs font-bold uppercase rounded">{job.category}</span>
                  </td>
                  <td className="px-8 py-6 text-slate-500 text-lg font-bold">
                    {applications.filter(a => a.jobId === job.id).length}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => onEditJob(job)} className="text-brand p-3 hover:bg-brand-light transition-all rounded-full"><Icons.Edit /></button>
                      <button onClick={() => onRemoveJob(job.id)} className="text-red-500 p-3 hover:bg-red-50 transition-all rounded-full"><Icons.Trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center text-slate-400 text-lg">Nessun annuncio pubblicato. Inizia ora!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
