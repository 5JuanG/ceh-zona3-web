import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MedicalResource } from '../types';
import { 
  BookOpen, 
  Search, 
  FileText, 
  ShieldCheck, 
  Syringe, 
  Activity, 
  Scale, 
  ChevronDown, 
  ChevronUp,
  Tag
} from 'lucide-react';

export const MedicalResources: React.FC = () => {
  const { resources } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todas' | 'pbm' | 'farmacos' | 'equipos' | 'bioetica' | 'legal'>('todas');
  const [expandedId, setExpandedId] = useState<string | null>('res-1');

  const filteredResources = resources.filter(res => {
    if (selectedCategory !== 'todas' && res.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = res.title.toLowerCase().includes(q);
      const matchDesc = res.description.toLowerCase().includes(q);
      const matchTags = res.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const getCategoryBadge = (category: MedicalResource['category']) => {
    switch (category) {
      case 'farmacos':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"><Syringe className="w-3 h-3" /> Fármacos</span>;
      case 'equipos':
        return <span className="bg-sky-100 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"><Activity className="w-3 h-3" /> Equipamiento / Recuperadores</span>;
      case 'pbm':
        return <span className="bg-sky-100 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Protocolos PBM</span>;
      case 'legal':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"><Scale className="w-3 h-3" /> Legal / Autonomía</span>;
      case 'bioetica':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"><FileText className="w-3 h-3" /> Bioética</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-sky-600" />
          Biblioteca de Recursos Médicos y Estrategias Sin Sangre (PBM)
        </h2>
        <p className="text-xs text-slate-500">
          Guías clínicas de referencia sobre alternativas médicas a las transfusiones para consulta del Comité de Enlace y profesionales de la salud.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por fármaco, técnica (Cell Saver, EPO, Ácido Tranexámico)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedCategory('todas')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedCategory === 'todas' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setSelectedCategory('farmacos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedCategory === 'farmacos' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Fármacos
          </button>
          <button
            onClick={() => setSelectedCategory('equipos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedCategory === 'equipos' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Equipos
          </button>
          <button
            onClick={() => setSelectedCategory('pbm')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedCategory === 'pbm' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            PBM
          </button>
          <button
            onClick={() => setSelectedCategory('legal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedCategory === 'legal' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Legal / DPA
          </button>
        </div>
      </div>

      {/* Resources Cards */}
      <div className="space-y-4">
        {filteredResources.map((res) => {
          const isExpanded = expandedId === res.id;

          return (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              {/* Accordion Bar Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : res.id)}
                className="p-5 cursor-pointer hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(res.category)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {res.description}
                  </p>
                </div>

                <button className="p-2 text-slate-400 hover:text-slate-700">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Accordion Expanded Details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-xs">
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <span className="font-bold text-slate-900 text-sm block">Resumen Clínico:</span>
                    <p className="text-slate-700 leading-relaxed text-xs">{res.clinicalSummary}</p>
                  </div>

                  {res.dosageOrUsage && (
                    <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200/80 space-y-1 text-sky-950">
                      <span className="font-bold text-sky-900 block text-xs">Posología y Manejo Clínico:</span>
                      <p className="text-sky-900">{res.dosageOrUsage}</p>
                    </div>
                  )}

                  {res.references && (
                    <div className="text-slate-500 text-[11px] italic">
                      Referencias bibliográficas médicas: <strong>{res.references}</strong>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap pt-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {res.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
