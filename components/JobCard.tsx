
import React from 'react';
import { Job } from '../types';
import { Icons } from '../constants';

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  return (
    <div 
      className={`bg-white border p-6 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full relative ${job.isFeatured ? 'border-amber-400 ring-1 ring-amber-100 shadow-sm' : 'border-slate-200'}`}
      onClick={() => onClick(job)}
    >
      {job.isFeatured && (
        <div className="absolute -top-3 left-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1.5 uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
          <Icons.Sparkles /> In Evidenza
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-brand-light text-brand mb-2 uppercase tracking-wide">
            {job.category}
          </span>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand transition-colors line-clamp-1">
            {job.title}
          </h3>
        </div>
      </div>
      
      <div className="mb-6 flex-1">
        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
          {job.description}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-auto pt-4 border-t border-slate-50">
        <div className="flex items-center gap-1">
          <Icons.MapPin />
          {job.location}
        </div>
        <div className="flex items-center gap-1">
          <Icons.Clock />
          {job.type}
        </div>
      </div>
    </div>
  );
};
