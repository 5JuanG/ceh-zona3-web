import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PatientCase, EmergencyWorksheet } from '../types';
import { 
  ShieldAlert, 
  PlusCircle, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  Search,
  Activity,
  FileText,
  Printer,
  FilePlus,
  AlertTriangle,
  PhoneCall,
  User,
  Stethoscope
} from 'lucide-react';
import { EmergencyWorksheetModal } from './EmergencyWorksheetModal';
import { EmergencyWorksheetPrintModal } from './EmergencyWorksheetPrintModal';

interface CasesManagerProps {
  onOpenCaseModal: (c?: PatientCase) => void;
}

export const CasesManager: React.FC<CasesManagerProps> = ({ onOpenCaseModal }) => {
  const { cases, worksheets, hospitals, doctors, deleteCase, deleteWorksheet } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'cases' | 'worksheets'>('cases');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('activos');

  // Worksheet Modals
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [worksheetToEdit, setWorksheetToEdit] = useState<EmergencyWorksheet | undefined>(undefined);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [worksheetToPrint, setWorksheetToPrint] = useState<EmergencyWorksheet | null>(null);

  const filteredCases = cases.filter(c => {
    if (statusFilter === 'activos' && (c.patientStatus === 'alta' || c.patientStatus === 'resuelto')) return false;
    if (statusFilter === 'resueltos' && (c.patientStatus !== 'alta' && c.patientStatus !== 'resuelto')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hosp = hospitals.find(h => h.id === c.hospitalId);
      const matchHosp = hosp ? hosp.name.toLowerCase().includes(q) : false;
      const matchCode = c.caseCode.toLowerCase().includes(q);
      const matchSpec = c.specialtyRequired.toLowerCase().includes(q);
      const matchSummary = c.summary.toLowerCase().includes(q);
      if (!matchHosp && !matchCode && !matchSpec && !matchSummary) return false;
    }
    return true;
  });

  const filteredWorksheets = worksheets.filter(w => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPatient = w.patientName.toLowerCase().includes(q);
      const matchHosp = w.hospitalName.toLowerCase().includes(q);
      const matchCaller = w.callerName.toLowerCase().includes(q);
      const matchProb = w.specificProblem.toLowerCase().includes(q);
      const matchDoctor = w.attendingDoctor.toLowerCase().includes(q);
      if (!matchPatient && !matchHosp && !matchCaller && !matchProb && !matchDoctor) return false;
    }
    return true;
  });

  const handleDeleteCase = (id: string, code: string) => {
    if (confirm(`¿Confirma eliminar el registro del ${code}?`)) {
      deleteCase(id);
    }
  };

  const handleDeleteWorksheet = (id: string, name: string) => {
    if (confirm(`¿Confirma eliminar la hoja de trabajo de emergencia hlc-7-S para ${name || 'este paciente'}?`)) {
      deleteWorksheet(id);
    }
  };

  const handleOpenNewWorksheet = () => {
    setWorksheetToEdit(undefined);
    setIsWorksheetModalOpen(true);
  };

  const handleOpenEditWorksheet = (ws: EmergencyWorksheet) => {
    setWorksheetToEdit(ws);
    setIsWorksheetModalOpen(true);
  };

  const handleOpenPrintWorksheet = (ws: EmergencyWorksheet) => {
    setWorksheetToPrint(ws);
    setIsPrintModalOpen(true);
  };

  const getStatusBadge = (status: PatientCase['patientStatus']) => {
    switch (status) {
      case 'estable':
        return <span className="bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Estable en Sala</span>;
      case 'programado_cirugia':
        return <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Programado Cirugía</span>;
      case 'cuidados_intensivos':
        return <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-xs font-semibold animate-pulse">UCI / Intensivo</span>;
      case 'alta':
        return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Dado de Alta</span>;
      case 'resuelto':
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">Resuelto</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            Asistencia a Pacientes y Emergencias Médicas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión confidencial de casos y llenado de la Hoja de Trabajo para Emergencias Médicas (hlc-7-S 1/12).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenNewWorksheet}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg animate-pulse border border-red-400 transition-all cursor-pointer"
          >
            <FilePlus className="w-4 h-4 text-white shrink-0" />
            🚨 Nueva Hoja Emergencia (hlc-7-S)
          </button>

          <button
            onClick={() => onOpenCaseModal()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Registrar Caso Corto
          </button>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('cases')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'cases'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Casos Registrados ({cases.length})
        </button>

        <button
          onClick={() => setActiveSubTab('worksheets')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'worksheets'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-700" />
          Hojas de Trabajo de Emergencia hlc-7-S ({worksheets.length})
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeSubTab === 'cases' ? "Buscar por código de caso, hospital o especialidad..." : "Buscar por paciente, hospital, quien llamó o problema médico..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {activeSubTab === 'cases' && (
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg p-2 font-medium focus:ring-2 focus:ring-amber-500"
            >
              <option value="activos">Casos Activos Actuales</option>
              <option value="resueltos">Casos Resueltos / Alta</option>
              <option value="todos">Todos los Casos</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: CASES LIST */}
      {activeSubTab === 'cases' && (
        filteredCases.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No hay casos en esta categoría</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Utilice el botón "Registrar Caso Corto" o "Nueva Hoja Emergencia (hlc-7-S)" para ingresar una atención.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCases.map((c) => {
              const hosp = hospitals.find(h => h.id === c.hospitalId);
              const consultantDoc = c.consultantDoctorId ? doctors.find(d => d.id === c.consultantDoctorId) : null;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm bg-amber-100 text-amber-900 px-3 py-1 rounded-lg border border-amber-200">
                        {c.caseCode}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {hosp?.name || 'Hospital'}
                        </h3>
                        <span className="text-xs text-sky-700 font-semibold">
                          Especialidad: {c.specialtyRequired}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(c.patientStatus)}
                      <button
                        onClick={() => onOpenCaseModal(c)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Caso"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCase(c.id, c.caseCode)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar Caso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{c.summary}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>
                        Consultor: <strong>{consultantDoc ? `${consultantDoc.title} ${consultantDoc.name}` : 'Ninguno asignado'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        Habitación: <strong>{c.roomNumber || 'No especificada'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        Ingreso: <strong>{c.admissionDate}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* VIEW 2: EMERGENCY WORKSHEETS LIST (hlc-7-S 1/12) */}
      {activeSubTab === 'worksheets' && (
        filteredWorksheets.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <FileText className="w-12 h-12 text-amber-500/50 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No hay Hojas de Trabajo hlc-7-S guardadas</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Haga clic en el botón "Nueva Hoja Emergencia (hlc-7-S)" para comenzar el llenado del documento de emergencia.
            </p>
            <button
              onClick={handleOpenNewWorksheet}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition-colors"
            >
              <FilePlus className="w-4 h-4" />
              Crear Hoja de Emergencia
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredWorksheets.map((ws) => (
              <div
                key={ws.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 hover:border-amber-300 transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-md">
                      hlc-7-S
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {ws.patientName || 'Paciente sin nombre'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{ws.gender} ({ws.age || 'Edad no especif.'})</span>
                        <span>•</span>
                        <span>Hospital: <strong className="text-slate-800">{ws.hospitalName || 'No asignado'}</strong></span>
                        {ws.roomNumber && <span>(Hab. {ws.roomNumber})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleOpenPrintWorksheet(ws)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 rounded-lg text-xs transition-colors"
                      title="Imprimir o guardar como PDF oficial hlc-7-S"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-700" />
                      Imprimir PDF
                    </button>

                    <button
                      onClick={() => handleOpenEditWorksheet(ws)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar Hoja de Trabajo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteWorksheet(ws.id, ws.patientName)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar Hoja"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                      Notificación de Llamada
                    </div>
                    <div><span className="font-semibold text-slate-600">Fecha/Hora:</span> {ws.callDateTime || '—'}</div>
                    <div><span className="font-semibold text-slate-600">Quien llamó:</span> {ws.callerName || '—'} {ws.callerContactInfo && `(${ws.callerContactInfo})`}</div>
                    <div><span className="font-semibold text-slate-600">Congregación:</span> {ws.congregationName || '—'}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                      Diagnóstico / Problema Específico
                    </div>
                    <p className="text-slate-800 line-clamp-2 italic font-medium">
                      "{ws.specificProblem || 'Sin diagnóstico registrado'}"
                    </p>
                    <div className="text-[11px] text-slate-500 pt-0.5">
                      Médico a cargo: <strong className="text-slate-700">{ws.attendingDoctor || 'No especificado'}</strong>
                    </div>
                  </div>
                </div>

                {/* Lab Highlights */}
                {ws.labResults && ws.labResults.length > 0 && ws.labResults[0].hemoglobin && (
                  <div className="bg-sky-50/70 border border-sky-200 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sky-900">Último Lab ({ws.labResults[0].dateTime}):</span>
                      <span>Hb: <strong className="text-sky-950 font-bold">{ws.labResults[0].hemoglobin} g/dl</strong></span>
                      <span>Hto: <strong className="text-sky-950 font-bold">{ws.labResults[0].hematocrit}</strong></span>
                      <span>Plaquetas: <strong className="text-sky-950 font-bold">{ws.labResults[0].platelets}</strong></span>
                    </div>

                    {ws.legalActionMentioned && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-300">
                        ⚠️ Mención de Acciones Legales
                      </span>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        )
      )}

      {/* Emergency Worksheet Edit/Create Modal */}
      <EmergencyWorksheetModal
        worksheetToEdit={worksheetToEdit}
        isOpen={isWorksheetModalOpen}
        onClose={() => setIsWorksheetModalOpen(false)}
      />

      {/* Emergency Worksheet Print Preview Modal */}
      {worksheetToPrint && (
        <EmergencyWorksheetPrintModal
          worksheet={worksheetToPrint}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

    </div>
  );
};
