
import React, { useState, useEffect } from 'react';
import { Job, JobType, JobCategory } from '../types';
import { Icons } from '../constants';
import { generateJobDescription } from '../geminiService';

interface JobFormProps {
  initialData?: Job;
  onSubmit: (job: Omit<Job, 'id' | 'postedAt'>) => void;
  onCancel: () => void;
}

export const JobForm: React.FC<JobFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    category: JobCategory.TECH as string,
    type: JobType.FULL_TIME,
    location: '',
    description: '',
    requirements: '',
    salaryRange: '',
    isFeatured: false
  });

  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  useEffect(() => {
    if (initialData) {
      const isStandard = Object.values(JobCategory).includes(initialData.category as JobCategory);
      setFormData({
        title: initialData.title,
        company: initialData.company,
        category: isStandard ? initialData.category : 'OTHER',
        type: initialData.type,
        location: initialData.location,
        description: initialData.description,
        requirements: initialData.requirements.join(', '),
        salaryRange: initialData.salaryRange || '',
        isFeatured: initialData.isFeatured || false
      });
      
      if (!isStandard) {
        setIsCustomCategory(true);
        setCustomCategory(initialData.category);
      }
    }
  }, [initialData]);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiAssist = async () => {
    if (!formData.title) {
      alert("Inserisci un titolo per usare l'assistente AI");
      return;
    }
    setIsGenerating(true);
    const catForAi = isCustomCategory ? customCategory : formData.category;
    const generated = await generateJobDescription(formData.title, catForAi, formData.requirements);
    setFormData(prev => ({ ...prev, description: generated || '' }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? customCategory.trim() : formData.category;
    
    if (!finalCategory) {
      alert("Inserisci una categoria valida.");
      return;
    }

    onSubmit({
      ...formData,
      category: finalCategory as any,
      requirements: formData.requirements.split(',').map(r => r.trim())
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          {initialData ? 'Modifica Posizione' : 'Nuova Posizione Aperta'}
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          Annulla
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-brand-light/20 border border-brand/10 p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${formData.isFeatured ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <Icons.Sparkles />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Metti in evidenza</p>
              <p className="text-xs text-slate-500">L'annuncio rimarrà in cima alla lista pubblica.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
            className={`w-12 h-6 rounded-full transition-all relative ${formData.isFeatured ? 'bg-brand' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.isFeatured ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Titolo del lavoro</label>
            <input
              required
              className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
              placeholder="es. Frontend Developer"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Luogo</label>
            <input
              required
              className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
              placeholder="es. Milano / Remote"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Categoria</label>
            <div className="space-y-3">
              <select
                className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none bg-white"
                value={isCustomCategory ? 'OTHER' : formData.category}
                onChange={e => {
                  if (e.target.value === 'OTHER') {
                    setIsCustomCategory(true);
                    setFormData({ ...formData, category: 'OTHER' });
                  } else {
                    setIsCustomCategory(false);
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
              >
                {Object.values(JobCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="OTHER">+ Aggiungi categoria personalizzata...</option>
              </select>
              
              {isCustomCategory && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <input
                    required
                    className="w-full px-4 py-2 border border-brand focus:ring-2 focus:ring-brand outline-none bg-brand-light/20"
                    placeholder="Digita il nome della nuova categoria"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                  />
                  <p className="text-[10px] text-brand font-bold uppercase mt-1">Nuova categoria dinamica</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tipo Contratto</label>
            <select
              className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none bg-white"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as JobType })}
            >
              {Object.values(JobType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Azienda (opzionale)</label>
          <input
            className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
            placeholder="Nome azienda"
            value={formData.company}
            onChange={e => setFormData({ ...formData, company: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Requisiti Chiave (separati da virgola)</label>
          <input
            className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
            placeholder="es. React, TypeScript, 3 anni esperienza"
            value={formData.requirements}
            onChange={e => setFormData({ ...formData, requirements: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700">Descrizione del lavoro</label>
            <button
              type="button"
              onClick={handleAiAssist}
              disabled={isGenerating}
              className="flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-dark disabled:opacity-50"
            >
              <Icons.Sparkles />
              {isGenerating ? 'Generando...' : 'Aiutami con AI'}
            </button>
          </div>
          <textarea
            required
            rows={10}
            className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
            placeholder="Scrivi qui la descrizione..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          ></textarea>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 font-medium text-slate-600 hover:bg-slate-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-6 py-2 font-bold bg-brand text-white hover:bg-brand-dark transition-colors"
          >
            {initialData ? 'Salva Modifiche' : 'Pubblica Annuncio'}
          </button>
        </div>
      </form>
    </div>
  );
};
