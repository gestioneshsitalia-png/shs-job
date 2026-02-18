
import React, { useState, useEffect } from 'react';
import { Job, JobCategoryItem, JobTypeItem } from '../types';
import { Icons } from '../constants';
import { generateJobDescription } from '../geminiService';

interface JobFormProps {
  initialData?: Job;
  onSubmit: (job: Omit<Job, 'id' | 'postedAt'>) => void;
  onCancel: () => void;
  isAiEnabled: boolean;
  categories: JobCategoryItem[];
  jobTypes: JobTypeItem[];
}

export const JobForm: React.FC<JobFormProps> = ({ initialData, onSubmit, onCancel, isAiEnabled, categories, jobTypes }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    category: '',
    type: '',
    location: '',
    description: '',
    requirements: '',
    salaryRange: '',
    isFeatured: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        company: initialData.company,
        category: initialData.category,
        type: initialData.type,
        location: initialData.location,
        description: initialData.description,
        requirements: initialData.requirements.join(', '),
        salaryRange: initialData.salaryRange || '',
        isFeatured: initialData.isFeatured || false
      });
    } else {
      // Imposta default se ci sono dati caricati
      setFormData(prev => ({
        ...prev,
        category: categories.length > 0 ? categories[0].name : '',
        type: jobTypes.length > 0 ? jobTypes[0].name : ''
      }));
    }
  }, [initialData, categories, jobTypes]);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiAssist = async () => {
    if (!formData.title) {
      alert("Inserisci un titolo per usare l'assistente AI");
      return;
    }
    setIsGenerating(true);
    const generated = await generateJobDescription(formData.title, formData.category, formData.requirements);
    setFormData(prev => ({ ...prev, description: generated || '' }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.type) {
      alert("Inserisci categoria e tipo contratto validi.");
      return;
    }

    onSubmit({
      ...formData,
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
            <select
              required
              className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none bg-white"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Seleziona...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tipo Contratto</label>
            <select
              required
              className="w-full px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none bg-white"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="">Seleziona...</option>
              {jobTypes.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
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
            {isAiEnabled && (
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={isGenerating}
                className="flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-dark disabled:opacity-50"
              >
                <Icons.Sparkles />
                {isGenerating ? 'Generando...' : 'Aiutami con AI'}
              </button>
            )}
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
