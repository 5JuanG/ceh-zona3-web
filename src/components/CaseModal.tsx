import React, { useState, useEffect } from 'react';
import { PatientCase, Specialty } from '../types';
import { useApp } from '../context/AppContext';
import { X, ShieldAlert, Save, Building2, User, Stethoscope } from 'lucide-react';

interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseToEdit?: PatientCase | null;
}

const SPECIALTIES: Specialty[] = [
  'Cirugía General',
  'Anestesiología',
  'Hematología',
  'Ginecología y Obstetricia',
  'Traumatología y Ortopedia',
  'Pediatría y Neonatología',
  'Cuidados Intensivos (UCI)',
  'Cardiología / Cirugía Cardiovascular',
  'Gastroenterología',
  'Nefrología',
  'Oncología',
  'Bioética',
  'Dirección Médica',
  'Otra'
];

export const CaseModal: React.FC<CaseModalProps> = ({ isOpen, onClose, caseToEdit }) => {
  const { hospitals, doctors, addCase, updateCase } = useApp();

  const [caseCode, setCaseCode] = useState('');
  const [hospitalId, setHospitalId] = useState(hospitals.length > 0 ? hospitals[0].id : '');
  const [attendingDoctorId, setAttendingDoctorId] = useState('');
  const [attendingDoctorName, setAttendingDoctorName] = useState('');
  const [consultantDoctorId, setConsultantDoctorId] = useState('');
  const [specialtyRequired, setSpecialtyRequired] = useState<Specialty>('Cirugía General');
  const [assignedCommitteeMember, setAssignedCommitteeMember] = useState('');
  const [patientStatus, setPatientStatus] = useState<'estable' | 'cuidados_intensivos' | 'programado_cirugia' | 'alta' | 'resuelto'>('estable');
  const [summary, setSummary] = useState('');
  const [strategiesText, setStrategiesText] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (caseToEdit) {
      setCaseCode(caseToEdit.caseCode || '');
      setHospitalId(caseToEdit.hospitalId || (hospitals.length > 0 ? hospitals[0].id : ''));
      setAttendingDoctorId(caseToEdit.attendingDoctorId || '');
      setAttendingDoctorName(caseToEdit.attendingDoctorName || '');
      setConsultantDoctorId(caseToEdit.consultantDoctorId || '');
      setSpecialtyRequired(caseToEdit.specialtyRequired || 'Cirugía General');
      setAssignedCommitteeMember(caseToEdit.assignedCommitteeMember || '');
      setPatientStatus(caseToEdit.patientStatus || 'estable');
      setSummary(caseToEdit.summary || '');
      setStrategiesText(caseToEdit.appliedStrategies ? caseToEdit.appliedStrategies.join(', ') : '');
      setNotes(caseToEdit.notes || '');
    } else {
      const randomNum = Math.floor(100 + Math.random() * 900);
      setCaseCode(`CASO-${new Date().getFullYear()}-${randomNum}`);
      setHospitalId(hospitals.length > 0 ? hospitals[0].id : '');
      setAttendingDoctorId('');
      setAttendingDoctorName('');
      setConsultantDoctorId('');
      setSpecialtyRequired('Cirugía General');
      setAssignedCommitteeMember('Representante del Comité');
      setPatientStatus('estable');
      setSummary('');
      setStrategiesText('Hierro carboximaltosa EV, Ácido Tranexámico, Recuperador celular');
      setNotes('');
    }
  }, [caseToEdit, isOpen, hospitals]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseCode.trim()) {
      alert('Ingrese un código de caso.');
      return;
    }

    const appliedStrategies = strategiesText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const caseData = {
      caseCode: caseCode.trim(),
      hospitalId,
      attendingDoctorId: attendingDoctorId || undefined,
      attendingDoctorName: attendingDoctorName.trim() || undefined,
      consultantDoctorId: consultantDoctorId || undefined,
      specialtyRequired,
      assignedCommitteeMember: assignedCommitteeMember.trim(),
      patientStatus,
      summary: summary.trim(),
      appliedStrategies,
      startDate: new Date().toISOString().split('T')[0],
      notes: notes.trim()
    };

    if (caseToEdit) {
      updateCase(caseToEdit.id, caseData);
    } else {
      addCase(caseData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">
              {caseToEdit ? 'Editar Caso de Asistencia' : 'Registrar Nuevo Caso de Paciente'}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Código de Caso (Confidencial)</label>
              <input
                type="text"
                required
                value={caseCode}
                onChange={(e) => setCaseCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado del Caso</label>
              <select
                value={patientStatus}
                onChange={(e) => setPatientStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
              >
                <option value="estable">Estable en Sala</option>
                <option value="programado_cirugia">Programado para Cirugía</option>
                <option value="cuidados_intensivos">Cuidados Intensivos (UCI)</option>
                <option value="alta">Dado de Alta</option>
                <option value="resuelto">Caso Resuelto / Finalizado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital de Atención *</label>
              <select
                required
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Especialidad Requerida *</label>
              <select
                value={specialtyRequired}
                onChange={(e) => setSpecialtyRequired(e.target.value as Specialty)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
              >
                {SPECIALTIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Médico Tratante del Hospital</label>
              <input
                type="text"
                placeholder="Ej. Dr. Carlos Benítez"
                value={attendingDoctorName}
                onChange={(e) => setAttendingDoctorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Médico Consultor Asesor (Opcional)</label>
              <select
                value={consultantDoctorId}
                onChange={(e) => setConsultantDoctorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Ninguno asignado...</option>
                {doctors.filter(d => d.type === 'consultor').map(d => (
                  <option key={d.id} value={d.id}>{d.title} {d.name} ({d.specialty})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Representante del Comité Asignado *</label>
            <input
              type="text"
              required
              placeholder="Ej. Hermano D. López"
              value={assignedCommitteeMember}
              onChange={(e) => setAssignedCommitteeMember(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resumen del Cuadro Clínico y Solicitud</label>
            <textarea
              rows={3}
              placeholder="Diagnóstico principal, nivel de Hb inicial, procedimiento proyectado..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estrategias Médicas Aplicadas (separadas por coma)
            </label>
            <input
              type="text"
              placeholder="Ej. EPO 40.000 UI, Hierro carboximaltosa 1000 mg IV, Ácido Tranexámico"
              value={strategiesText}
              onChange={(e) => setStrategiesText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas de Evolución</label>
            <textarea
              rows={2}
              placeholder="Evolución clínica, estado del consentimiento, respuesta médica..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 resize-none"
            />
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow"
            >
              <Save className="w-4 h-4" />
              Guardar Caso
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
