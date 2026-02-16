
import React from 'react';
import { Icons } from '../constants';

interface ThankYouProps {
  onBack: () => void;
  jobTitle?: string;
}

export const ThankYou: React.FC<ThankYouProps> = ({ onBack, jobTitle }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-32 text-center animate-in fade-in zoom-in duration-500">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-light text-brand rounded-full mb-8 shadow-inner">
        <Icons.CheckCircle />
      </div>
      
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Candidatura Inviata!</h1>
      <p className="text-xl text-slate-600 mb-2 font-medium">Grazie per aver scelto di candidarti per la posizione di</p>
      <p className="text-2xl font-bold text-brand mb-8">{jobTitle || 'nostro team'}</p>
      
      <div className="bg-white border border-slate-200 p-8 shadow-sm mb-12 text-left leading-relaxed text-slate-600">
        <p className="mb-4">Il tuo profilo è stato ricevuto correttamente dal nostro team. Ecco cosa succederà ora:</p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 bg-brand text-white text-[10px] font-bold flex items-center justify-center rounded-full shrink-0 mt-0.5">1</span>
            <span>Un membro del nostro team analizzerà il tuo CV e la tua lettera di presentazione.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 bg-brand text-white text-[10px] font-bold flex items-center justify-center rounded-full shrink-0 mt-0.5">2</span>
            <span>Se il tuo profilo risulterà in linea, ti contatteremo per un primo colloquio conoscitivo.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 bg-brand text-white text-[10px] font-bold flex items-center justify-center rounded-full shrink-0 mt-0.5">3</span>
            <span>Riceverai comunque un'email di aggiornamento sull'esito della selezione.</span>
          </li>
        </ul>
      </div>
      
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 bg-brand text-white px-10 py-4 font-bold text-lg hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform"><Icons.ChevronLeft /></span>
        Torna alle Posizioni Aperte
      </button>
    </div>
  );
};
