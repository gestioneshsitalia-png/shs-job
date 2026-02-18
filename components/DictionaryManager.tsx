
import React, { useState } from 'react';
import { Icons } from '../constants';
import { supabase } from '../supabaseClient';
import { JobCategoryItem, JobTypeItem } from '../types';

interface DictionaryManagerProps {
  categories: JobCategoryItem[];
  jobTypes: JobTypeItem[];
  onBack: () => void;
  onRefresh: () => void;
}

export const DictionaryManager: React.FC<DictionaryManagerProps> = ({ categories, jobTypes, onBack, onRefresh }) => {
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdd = async (table: 'job_categories' | 'job_types') => {
    if (!newItemName.trim()) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from(table).insert([{ name: newItemName.trim() }]);
      if (error) throw error;
      setNewItemName('');
      onRefresh();
    } catch (err: any) {
      alert("Errore nell'inserimento: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async (table: 'job_categories' | 'job_types', id: string) => {
    if (!editValue.trim()) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from(table).update({ name: editValue.trim() }).eq('id', id);
      if (error) throw error;
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      alert("Errore nell'aggiornamento: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (table: 'job_categories' | 'job_types', id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo elemento? Gli annunci associati potrebbero risentirne.")) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert("Errore nell'eliminazione: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full px-6 lg:px-12 py-20">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-medium group">
        <span className="group-hover:-translate-x-1 transition-transform"><Icons.ChevronLeft /></span> Torna alla Dashboard
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Gestione Categorie */}
        <div className="bg-white border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900">Categorie Lavoro</h2>
            <p className="text-sm text-slate-500">Gestisci i settori disponibili per gli annunci.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <input 
                className="flex-1 px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none text-sm"
                placeholder="Nuova categoria..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
              />
              <button 
                onClick={() => handleAdd('job_categories')}
                disabled={isProcessing}
                className="bg-brand text-white px-4 py-2 text-sm font-bold hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                Aggiungi
              </button>
            </div>
            
            <div className="divide-y divide-slate-100 border border-slate-100 mt-6">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 hover:bg-slate-50 group">
                  {editingId === cat.id ? (
                    <div className="flex-1 flex gap-2">
                      <input 
                        className="flex-1 px-3 py-1 border border-brand outline-none text-sm"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => handleUpdate('job_categories', cat.id)} className="text-brand font-bold text-xs uppercase">Salva</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 font-bold text-xs uppercase">Annulla</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingId(cat.id); setEditValue(cat.name); }} className="p-2 text-slate-400 hover:text-brand"><Icons.Edit /></button>
                        <button onClick={() => handleDelete('job_categories', cat.id)} className="p-2 text-slate-400 hover:text-red-500"><Icons.Trash /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gestione Tipi Contratto */}
        <div className="bg-white border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900">Tipi di Contratto</h2>
            <p className="text-sm text-slate-500">Gestisci le tipologie di impiego (es. Full-time, Remote).</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <input 
                className="flex-1 px-4 py-2 border border-slate-200 focus:ring-2 focus:ring-brand outline-none text-sm"
                placeholder="Nuovo tipo contratto..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
              />
              <button 
                onClick={() => handleAdd('job_types')}
                disabled={isProcessing}
                className="bg-brand text-white px-4 py-2 text-sm font-bold hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                Aggiungi
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 mt-6">
              {jobTypes.map(type => (
                <div key={type.id} className="flex items-center justify-between p-3 hover:bg-slate-50 group">
                  {editingId === type.id ? (
                    <div className="flex-1 flex gap-2">
                      <input 
                        className="flex-1 px-3 py-1 border border-brand outline-none text-sm"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => handleUpdate('job_types', type.id)} className="text-brand font-bold text-xs uppercase">Salva</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 font-bold text-xs uppercase">Annulla</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-slate-700">{type.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingId(type.id); setEditValue(type.name); }} className="p-2 text-slate-400 hover:text-brand"><Icons.Edit /></button>
                        <button onClick={() => handleDelete('job_types', type.id)} className="p-2 text-slate-400 hover:text-red-500"><Icons.Trash /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
