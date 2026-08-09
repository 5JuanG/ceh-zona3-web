import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VisitLog } from '../types';
import { 
  CalendarCheck, 
  PlusCircle, 
  Building2, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Search,
  CheckSquare
} from 'lucide-react';

interface VisitsLogProps {
  onOpenVisitModal: (visit?: VisitLog) => void;
}

export const VisitsLog: React.FC<VisitsLogProps> = ({ onOpenVisitModal }) => {
  const { visits, hospitals, doctors, deleteVisit, updateVisit } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'completada' | 'programada' | 'pendiente'>('todas');

  const filteredVisits = visits.filter(v => {
    if (statusFilter !== 'todas' && v.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hosp = hospitals.find(h => h.id === v.hospitalId);
      const matchHosp = hosp ? hosp.name.toLowerCase().includes(q) : false;
      const matchObj = v.objective.toLowerCase().includes(q);
      const matchContact = v.contactName ? v.contactName.toLowerCase().includes(q) : false;
      if (!matchHosp && !matchObj && !matchContact) return false;
    }
    return true;
  });

  const handleDelete = (id: string) => {
    if (confirm('¿Desea eliminar esta visita del registro?')) {
      deleteVisit(id);
    }
  };

  const toggleStatusCompleted = (visit: VisitLog) => {
    const nextStatus = visit.status === 'completada' ? 'programada' : 'completada';
    updateVisit(visit.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600" />
            Registro de Visitas y Contactos del Comité
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bitácora de reuniones institucionales, entregas de literatura médica y acuerdos alcanzados.
          </p>
        </div>

        <button
          onClick={() => onOpenVisitModal()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Registrar Nueva Visita
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por hospital, contacto o tema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="todas">Todos los estados</option>
            <option value="completada">Completadas</option>
            <option value="programada">Programadas</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </div>
      </div>

      {/* Visits List */}
      {filteredVisits.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No hay visitas registradas</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Comience a documentar los contactos y entrevistas realizadas en hospitales de la zona.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((visit) => {
            const hosp = hospitals.find(h => h.id === visit.hospitalId);
            const doc = visit.doctorId ? doctors.find(d => d.id === visit.doctorId) : null;

            return (
              <div
                key={visit.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStatusCompleted(visit)}
                      title="Marcar como completada/programada"
                      className={`p-1.5 rounded-lg border transition-colors ${
                        visit.status === 'completada'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>

                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {hosp?.name || 'Hospital de la Zona'}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Fecha: <strong>{visit.date}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      visit.status === 'completada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : visit.status === 'programada'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {visit.status === 'completada' ? 'Completada' : visit.status === 'programada' ? 'Programada' : 'Pendiente'}
                    </span>

                    <button
                      onClick={() => onOpenVisitModal(visit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(visit.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Contacto / Médico Entrevistado</span>
                    <span className="font-semibold text-slate-800">
                      {visit.contactName || (doc ? `${doc.title} ${doc.name}` : 'No especificado')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Integrantes del Comité</span>
                    <span className="font-medium text-slate-800">
                      {visit.committeeMembers.join(', ') || 'Comité de Enlace'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Objetivo</span>
                    <span className="font-semibold text-indigo-900">
                      {visit.objective}
                    </span>
                  </div>
                </div>

                {/* Summary & Outcome */}
                {visit.summary && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block">Resumen:</span>
                    <p>{visit.summary}</p>
                  </div>
                )}

                {visit.outcome && (
                  <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-100 text-xs text-teal-950">
                    <strong className="text-teal-900">Resultado / Acuerdo: </strong>
                    {visit.outcome}
                  </div>
                )}

                {/* Followup banner */}
                {visit.requiresFollowUp && visit.followUpDate && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Seguimiento programado para: <strong>{visit.followUpDate}</strong></span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
