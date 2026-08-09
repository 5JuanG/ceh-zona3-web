import React, { useState, useEffect } from 'react';
import { VisitLog } from '../types';
import { useApp } from '../context/AppContext';
import { X, CalendarCheck, Save, Building2, User, Users, FileText } from 'lucide-react';

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitToEdit?: VisitLog | null;
}

export const VisitModal: React.FC<VisitModalProps> = ({ isOpen, onClose, visitToEdit }) => {
  const { hospitals, doctors, addVisit, updateVisit } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hospitalId, setHospitalId] = useState(hospitals.length > 0 ? hospitals[0].id : '');
  const [doctorId, setDoctorId] = useState('');
  const [contactName, setContactName] = useState('');
  const [committeeMembersText, setCommitteeMembersText] = useState('');
  const [objective, setObjective] = useState('');
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState('');
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState<'completada' | 'pendiente' | 'programada'>('completada');

  useEffect(() => {
    if (visitToEdit) {
      setDate(visitToEdit.date || new Date().toISOString().split('T')[0]);
      setHospitalId(visitToEdit.hospitalId || (hospitals.length > 0 ? hospitals[0].id : ''));
      setDoctorId(visitToEdit.doctorId || '');
      setContactName(visitToEdit.contactName || '');
      setCommitteeMembersText(visitToEdit.committeeMembers ? visitToEdit.committeeMembers.join(', ') : '');
      setObjective(visitToEdit.objective || '');
      setSummary(visitToEdit.summary || '');
      setOutcome(visitToEdit.outcome || '');
      setRequiresFollowUp(visitToEdit.requiresFollowUp || false);
      setFollowUpDate(visitToEdit.followUpDate || '');
      setStatus(visitToEdit.status || 'completada');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setHospitalId(hospitals.length > 0 ? hospitals[0].id : '');
      setDoctorId('');
      setContactName('');
      setCommitteeMembersText('Hermano D. López, Hermano M. Giménez');
      setObjective('Presentación de literatura sobre alternativas a transfusiones');
      setSummary('');
      setOutcome('');
      setRequiresFollowUp(false);
      setFollowUpDate('');
      setStatus('completada');
    }
  }, [visitToEdit, isOpen, hospitals]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId) {
      alert('Por favor seleccione un hospital.');
      return;
    }

    const committeeMembers = committeeMembersText
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    const visitData = {
      date,
      hospitalId,
      doctorId: doctorId || undefined,
      contactName: contactName.trim(),
      committeeMembers,
      objective: objective.trim(),
      summary: summary.trim(),
      outcome: outcome.trim(),
      requiresFollowUp,
      followUpDate: requiresFollowUp ? followUpDate : undefined,
      status
    };

    if (visitToEdit) {
      updateVisit(visitToEdit.id, visitData);
    } else {
      addVisit(visitData);
    }

    onClose();
  };

  const selectedHospitalDoctors = doctors.filter(d => d.hospitalIds.includes(hospitalId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">
              {visitToEdit ? 'Editar Visita / Contacto' : 'Registrar Visita del Comité de Enlace'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de la Visita *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de la Visita</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="completada">Completada</option>
                <option value="programada">Programada / Agendada</option>
                <option value="pendiente">Pendiente de confirmación</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Centro Médico *</label>
              <select
                required
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Médico Vinculado (Opcional)</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar médico...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.title} {d.name} ({d.specialty})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Contacto / Servicio Visitado</label>
            <input
              type="text"
              placeholder="Ej. Dr. Benítez y equipo de residentes de anestesia"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Integrantes del Comité asistentes (separados por coma)</label>
            <input
              type="text"
              placeholder="Ej. D. López, M. Giménez"
              value={committeeMembersText}
              onChange={(e) => setCommitteeMembersText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Objetivo / Tema Principal *</label>
            <input
              type="text"
              required
              placeholder="Ej. Entrega de manual PBM, Consulta de caso bioético, Presentación del Comité"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resumen de la Reunión</label>
            <textarea
              rows={3}
              placeholder="Puntos tratados, actitud del médico/autoridades, inquietudes expresadas..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Acuerdos / Resultados</label>
            <input
              type="text"
              placeholder="Ej. Aceptó tener una charla con el servicio en septiembre"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-indigo-50/50 border border-indigo-200 p-3 rounded-lg space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-900">
              <input
                type="checkbox"
                checked={requiresFollowUp}
                onChange={(e) => setRequiresFollowUp(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Requiere Seguimiento Próximo
            </label>

            {requiresFollowUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Estimada de Próximo Seguimiento</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow"
            >
              <Save className="w-4 h-4" />
              Guardar Registro
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
