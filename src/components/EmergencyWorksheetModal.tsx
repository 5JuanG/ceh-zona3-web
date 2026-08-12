import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EmergencyWorksheet, LabResultEntry } from '../types';
import { 
  FileText, 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Printer, 
  CheckSquare, 
  Square, 
  User, 
  Building2, 
  Stethoscope, 
  FilePlus, 
  AlertTriangle,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { EmergencyWorksheetPrintModal } from './EmergencyWorksheetPrintModal';

interface EmergencyWorksheetModalProps {
  worksheetToEdit?: EmergencyWorksheet;
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyWorksheetModal: React.FC<EmergencyWorksheetModalProps> = ({
  worksheetToEdit,
  isOpen,
  onClose
}) => {
  const { addWorksheet, updateWorksheet, hospitals, doctors } = useApp();
  const [activeTab, setActiveTab] = useState<'notificacion' | 'paciente' | 'medico' | 'estrategias' | 'traslado'>('notificacion');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentWorksheetForPrint, setCurrentWorksheetForPrint] = useState<EmergencyWorksheet | null>(null);

  // Form States
  const [callDateTime, setCallDateTime] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callerContactInfo, setCallerContactInfo] = useState('');
  const [patientRequestsHlcHelp, setPatientRequestsHlcHelp] = useState(true);
  const [relationshipToPatient, setRelationshipToPatient] = useState('');

  const [patientName, setPatientName] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Femenino' | ''>('Masculino');
  const [age, setAge] = useState('');
  const [isBaptized, setIsBaptized] = useState(false);
  const [hasGoodReputation, setHasGoodReputation] = useState(true);
  const [hasDpaCompleted, setHasDpaCompleted] = useState(true);
  const [patientComments, setPatientComments] = useState('');

  const [fatherName, setFatherName] = useState('');
  const [fatherBaptized, setFatherBaptized] = useState(false);
  const [motherName, setMotherName] = useState('');
  const [motherBaptized, setMotherBaptized] = useState(false);
  const [familyComments, setFamilyComments] = useState('');

  const [hospitalName, setHospitalName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [congregationName, setCongregationName] = useState('');
  const [contactedEldersNames, setContactedEldersNames] = useState('');
  const [contactedEldersPhones, setContactedEldersPhones] = useState('');

  const [birthWeight, setBirthWeight] = useState('');
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [apgarBirth, setApgarBirth] = useState('');
  const [apgar5Min, setApgar5Min] = useState('');

  const [specificProblem, setSpecificProblem] = useState('');
  const [relevantMedicalHistory, setRelevantMedicalHistory] = useState('');

  const [labResults, setLabResults] = useState<LabResultEntry[]>([
    { dateTime: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }), hemoglobin: '', hematocrit: '', platelets: '', others: '' }
  ]);

  const [attendingDoctor, setAttendingDoctor] = useState('');
  const [attendingDoctorSpecialty, setAttendingDoctorSpecialty] = useState('');
  const [otherDoctor, setOtherDoctor] = useState('');
  const [otherDoctorSpecialty, setOtherDoctorSpecialty] = useState('');

  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [medicalStaffNotifiedHlcHelp, setMedicalStaffNotifiedHlcHelp] = useState(false);
  const [legalActionMentioned, setLegalActionMentioned] = useState(false);

  const [strategiesAndAlternatives, setStrategiesAndAlternatives] = useState('');
  const [medicalArticles, setMedicalArticles] = useState('');
  const [doctorWillingToCollabAfterArticles, setDoctorWillingToCollabAfterArticles] = useState(false);

  const [consultantDoctorName, setConsultantDoctorName] = useState('');
  const [consultantPreferredContact, setConsultantPreferredContact] = useState('');
  const [consultantSpecialty, setConsultantSpecialty] = useState('');
  const [consultantAdditionalInfo, setConsultantAdditionalInfo] = useState('');

  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [hospitalInfoSectionContacted, setHospitalInfoSectionContacted] = useState(false);
  const [transferHospitalName, setTransferHospitalName] = useState('');
  const [transferAttendingDoctor, setTransferAttendingDoctor] = useState('');
  const [transferHospitalContactPhone, setTransferHospitalContactPhone] = useState('');
  const [transferAdditionalInfo, setTransferAdditionalInfo] = useState('');

  const [localEldersContactedFollowup, setLocalEldersContactedFollowup] = useState(false);
  const [followupResultsAndDetails, setFollowupResultsAndDetails] = useState('');

  useEffect(() => {
    if (worksheetToEdit) {
      setCallDateTime(worksheetToEdit.callDateTime || '');
      setCallerName(worksheetToEdit.callerName || '');
      setCallerContactInfo(worksheetToEdit.callerContactInfo || '');
      setPatientRequestsHlcHelp(worksheetToEdit.patientRequestsHlcHelp ?? true);
      setRelationshipToPatient(worksheetToEdit.relationshipToPatient || '');

      setPatientName(worksheetToEdit.patientName || '');
      setGender(worksheetToEdit.gender || 'Masculino');
      setAge(worksheetToEdit.age || '');
      setIsBaptized(worksheetToEdit.isBaptized ?? false);
      setHasGoodReputation(worksheetToEdit.hasGoodReputation ?? true);
      setHasDpaCompleted(worksheetToEdit.hasDpaCompleted ?? true);
      setPatientComments(worksheetToEdit.patientComments || '');

      setFatherName(worksheetToEdit.fatherName || '');
      setFatherBaptized(worksheetToEdit.fatherBaptized ?? false);
      setMotherName(worksheetToEdit.motherName || '');
      setMotherBaptized(worksheetToEdit.motherBaptized ?? false);
      setFamilyComments(worksheetToEdit.familyComments || '');

      setHospitalName(worksheetToEdit.hospitalName || '');
      setRoomNumber(worksheetToEdit.roomNumber || '');
      setHospitalPhone(worksheetToEdit.hospitalPhone || '');
      setCongregationName(worksheetToEdit.congregationName || '');
      setContactedEldersNames(worksheetToEdit.contactedEldersNames || '');
      setContactedEldersPhones(worksheetToEdit.contactedEldersPhones || '');

      setBirthWeight(worksheetToEdit.birthWeight || '');
      setGestationalAgeWeeks(worksheetToEdit.gestationalAgeWeeks || '');
      setBirthDate(worksheetToEdit.birthDate || '');
      setApgarBirth(worksheetToEdit.apgarBirth || '');
      setApgar5Min(worksheetToEdit.apgar5Min || '');

      setSpecificProblem(worksheetToEdit.specificProblem || '');
      setRelevantMedicalHistory(worksheetToEdit.relevantMedicalHistory || '');

      setLabResults(worksheetToEdit.labResults && worksheetToEdit.labResults.length > 0 ? worksheetToEdit.labResults : [
        { dateTime: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }), hemoglobin: '', hematocrit: '', platelets: '', others: '' }
      ]);

      setAttendingDoctor(worksheetToEdit.attendingDoctor || '');
      setAttendingDoctorSpecialty(worksheetToEdit.attendingDoctorSpecialty || '');
      setOtherDoctor(worksheetToEdit.otherDoctor || '');
      setOtherDoctorSpecialty(worksheetToEdit.otherDoctorSpecialty || '');

      setTreatmentPlan(worksheetToEdit.treatmentPlan || '');
      setMedicalStaffNotifiedHlcHelp(worksheetToEdit.medicalStaffNotifiedHlcHelp ?? false);
      setLegalActionMentioned(worksheetToEdit.legalActionMentioned ?? false);

      setStrategiesAndAlternatives(worksheetToEdit.strategiesAndAlternatives || '');
      setMedicalArticles(worksheetToEdit.medicalArticles || '');
      setDoctorWillingToCollabAfterArticles(worksheetToEdit.doctorWillingToCollabAfterArticles ?? false);

      setConsultantDoctorName(worksheetToEdit.consultantDoctorName || '');
      setConsultantPreferredContact(worksheetToEdit.consultantPreferredContact || '');
      setConsultantSpecialty(worksheetToEdit.consultantSpecialty || '');
      setConsultantAdditionalInfo(worksheetToEdit.consultantAdditionalInfo || '');

      setTransferConfirmed(worksheetToEdit.transferConfirmed ?? false);
      setHospitalInfoSectionContacted(worksheetToEdit.hospitalInfoSectionContacted ?? false);
      setTransferHospitalName(worksheetToEdit.transferHospitalName || '');
      setTransferAttendingDoctor(worksheetToEdit.transferAttendingDoctor || '');
      setTransferHospitalContactPhone(worksheetToEdit.transferHospitalContactPhone || '');
      setTransferAdditionalInfo(worksheetToEdit.transferAdditionalInfo || '');

      setLocalEldersContactedFollowup(worksheetToEdit.localEldersContactedFollowup ?? false);
      setFollowupResultsAndDetails(worksheetToEdit.followupResultsAndDetails || '');
    } else {
      // Default new worksheet call date/time
      setCallDateTime(new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }));
    }
  }, [worksheetToEdit, isOpen]);

  if (!isOpen) return null;

  const buildCurrentWorksheetData = (): Omit<EmergencyWorksheet, 'id' | 'createdAt' | 'updatedAt'> => ({
    callDateTime: callDateTime.trim(),
    callerName: callerName.trim(),
    callerContactInfo: callerContactInfo.trim(),
    patientRequestsHlcHelp,
    relationshipToPatient: relationshipToPatient.trim(),

    patientName: patientName.trim(),
    gender,
    age: age.trim(),
    isBaptized,
    hasGoodReputation,
    hasDpaCompleted,
    patientComments: patientComments.trim(),

    fatherName: fatherName.trim(),
    fatherBaptized,
    motherName: motherName.trim(),
    motherBaptized,
    familyComments: familyComments.trim(),

    hospitalName: hospitalName.trim(),
    roomNumber: roomNumber.trim(),
    hospitalPhone: hospitalPhone.trim(),
    congregationName: congregationName.trim(),
    contactedEldersNames: contactedEldersNames.trim(),
    contactedEldersPhones: contactedEldersPhones.trim(),

    birthWeight: birthWeight.trim(),
    gestationalAgeWeeks: gestationalAgeWeeks.trim(),
    birthDate: birthDate.trim(),
    apgarBirth: apgarBirth.trim(),
    apgar5Min: apgar5Min.trim(),

    specificProblem: specificProblem.trim(),
    relevantMedicalHistory: relevantMedicalHistory.trim(),

    labResults,

    attendingDoctor: attendingDoctor.trim(),
    attendingDoctorSpecialty: attendingDoctorSpecialty.trim(),
    otherDoctor: otherDoctor.trim(),
    otherDoctorSpecialty: otherDoctorSpecialty.trim(),

    treatmentPlan: treatmentPlan.trim(),
    medicalStaffNotifiedHlcHelp,
    legalActionMentioned,

    strategiesAndAlternatives: strategiesAndAlternatives.trim(),
    medicalArticles: medicalArticles.trim(),
    doctorWillingToCollabAfterArticles,

    consultantDoctorName: consultantDoctorName.trim(),
    consultantPreferredContact: consultantPreferredContact.trim(),
    consultantSpecialty: consultantSpecialty.trim(),
    consultantAdditionalInfo: consultantAdditionalInfo.trim(),

    transferConfirmed,
    hospitalInfoSectionContacted,
    transferHospitalName: transferHospitalName.trim(),
    transferAttendingDoctor: transferAttendingDoctor.trim(),
    transferHospitalContactPhone: transferHospitalContactPhone.trim(),
    transferAdditionalInfo: transferAdditionalInfo.trim(),

    localEldersContactedFollowup,
    followupResultsAndDetails: followupResultsAndDetails.trim()
  });

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!patientName.trim()) {
      alert('Por favor ingrese al menos el nombre del paciente.');
      setActiveTab('paciente');
      return;
    }

    const data = buildCurrentWorksheetData();
    if (worksheetToEdit) {
      updateWorksheet(worksheetToEdit.id, data);
    } else {
      addWorksheet(data);
    }

    onClose();
  };

  const handlePreviewPrint = () => {
    const data = buildCurrentWorksheetData();
    const tempWs: EmergencyWorksheet = {
      ...data,
      id: worksheetToEdit ? worksheetToEdit.id : 'preview-temp',
      createdAt: worksheetToEdit ? worksheetToEdit.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setCurrentWorksheetForPrint(tempWs);
    setShowPrintModal(true);
  };

  const addLabRow = () => {
    setLabResults([
      ...labResults,
      { dateTime: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }), hemoglobin: '', hematocrit: '', platelets: '', others: '' }
    ]);
  };

  const updateLabRow = (index: number, field: keyof LabResultEntry, val: string) => {
    setLabResults(labResults.map((r, i) => i === index ? { ...r, [field]: val } : r));
  };

  const removeLabRow = (index: number) => {
    if (labResults.length === 1) return;
    setLabResults(labResults.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded tracking-wide">hlc-7-S</span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  {worksheetToEdit ? 'Editar Hoja de Trabajo de Emergencia' : 'Nueva Hoja de Trabajo para Emergencias Médicas'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Formulario oficial hlc-7-S 1/12 • Registro confidencial para asistencia del HLC
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreviewPrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Vista Previa / Imprimir PDF
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 pt-2 flex overflow-x-auto gap-1 text-xs shrink-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('notificacion')}
              className={`px-3 py-2 font-bold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'notificacion'
                  ? 'bg-white text-slate-900 border-t-2 border-amber-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FilePlus className="w-3.5 h-3.5 text-amber-600" />
              1. Notificación
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paciente')}
              className={`px-3 py-2 font-bold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'paciente'
                  ? 'bg-white text-slate-900 border-t-2 border-amber-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-3.5 h-3.5 text-sky-600" />
              2. Paciente / Hospital
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('medico')}
              className={`px-3 py-2 font-bold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'medico'
                  ? 'bg-white text-slate-900 border-t-2 border-amber-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
              3. Problema Médico / Labs
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('estrategias')}
              className={`px-3 py-2 font-bold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'estrategias'
                  ? 'bg-white text-slate-900 border-t-2 border-amber-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              4. Estrategias / Artículos
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('traslado')}
              className={`px-3 py-2 font-bold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'traslado'
                  ? 'bg-white text-slate-900 border-t-2 border-amber-500 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-rose-600" />
              5. Traslado / Seguimiento
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
            
            {/* TAB 1: NOTIFICACIÓN */}
            {activeTab === 'notificacion' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 font-medium">
                  <strong>Notificación Inicial de Emergencia:</strong> Complete estos datos tan pronto reciba la llamada o reporte del caso para que cualquier otro integrante del CEH pueda dar seguimiento.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fecha / Hora de llamada</label>
                    <input
                      type="text"
                      placeholder="Ej. 05/08/2026 - 14:30"
                      value={callDateTime}
                      onChange={(e) => setCallDateTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Persona que llamó</label>
                    <input
                      type="text"
                      placeholder="Nombre de quien reporta la emergencia"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contacto de quien llamó</label>
                    <input
                      type="text"
                      placeholder="Teléfono / Celular de contacto"
                      value={callerContactInfo}
                      onChange={(e) => setCallerContactInfo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      id="patientRequestsHlcHelp"
                      checked={patientRequestsHlcHelp}
                      onChange={(e) => setPatientRequestsHlcHelp(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <label htmlFor="patientRequestsHlcHelp" className="font-bold text-slate-900 cursor-pointer">
                      El paciente o familiar solicita ayuda del HLC / CEH
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Relación con el paciente</label>
                    <input
                      type="text"
                      placeholder="Ej. Esposo, Madre, Anciano de la congregación"
                      value={relationshipToPatient}
                      onChange={(e) => setRelationshipToPatient(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('paciente')}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800"
                  >
                    Siguiente: Paciente / Hospital
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PACIENTE / HOSPITAL */}
            {activeTab === 'paciente' && (
              <div className="space-y-4">
                
                {/* General Patient Info */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                    Datos del Paciente
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Nombre completo del paciente *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nombre y Apellidos"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sexo</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Edad</label>
                      <input
                        type="text"
                        placeholder="Ej. 45 años / 8 meses"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        id="isBaptized"
                        checked={isBaptized}
                        onChange={(e) => setIsBaptized(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <label htmlFor="isBaptized" className="font-semibold text-slate-800 cursor-pointer">¿Bautizado?</label>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        id="hasGoodReputation"
                        checked={hasGoodReputation}
                        onChange={(e) => setHasGoodReputation(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <label htmlFor="hasGoodReputation" className="font-semibold text-slate-800 cursor-pointer">¿Buena reputación?</label>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        id="hasDpaCompleted"
                        checked={hasDpaCompleted}
                        onChange={(e) => setHasDpaCompleted(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <label htmlFor="hasDpaCompleted" className="font-semibold text-slate-800 cursor-pointer">¿DPA completa?</label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Comentarios adicionales sobre el paciente</label>
                    <textarea
                      rows={2}
                      placeholder="Situación personal, familiar o espiritual..."
                      value={patientComments}
                      onChange={(e) => setPatientComments(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                {/* Section for Minors / Newborns */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                    Si el paciente es un menor o recién nacido
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Nombre del padre"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-medium text-xs"
                      />
                      <label className="flex items-center gap-1 shrink-0 text-[11px] font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={fatherBaptized}
                          onChange={(e) => setFatherBaptized(e.target.checked)}
                          className="w-3.5 h-3.5 rounded"
                        />
                        ¿Bautizado?
                      </label>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Nombre de la madre"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-medium text-xs"
                      />
                      <label className="flex items-center gap-1 shrink-0 text-[11px] font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={motherBaptized}
                          onChange={(e) => setMotherBaptized(e.target.checked)}
                          className="w-3.5 h-3.5 rounded"
                        />
                        ¿Bautizada?
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Comentarios (situación familiar, reputación, etc.)</label>
                    <textarea
                      rows={1}
                      placeholder="Detalles sobre padres / tutores legales..."
                      value={familyComments}
                      onChange={(e) => setFamilyComments(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  {/* Newborn specific data */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Peso al nacer</label>
                      <input
                        type="text"
                        placeholder="Ej. 2.8 kg"
                        value={birthWeight}
                        onChange={(e) => setBirthWeight(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Edad gestacional (semanas)</label>
                      <input
                        type="text"
                        placeholder="Ej. 34 semanas"
                        value={gestationalAgeWeeks}
                        onChange={(e) => setGestationalAgeWeeks(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Fecha de nacimiento</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">APGAR al nacimiento</label>
                      <input
                        type="text"
                        placeholder="Ej. 8/10"
                        value={apgarBirth}
                        onChange={(e) => setApgarBirth(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">APGAR a los 5 minutos</label>
                      <input
                        type="text"
                        placeholder="Ej. 9/10"
                        value={apgar5Min}
                        onChange={(e) => setApgar5Min(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Hospital & Elders */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                    Ubicación Hospitalaria y Ancianos de Contacto
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nombre del Hospital</label>
                      <input
                        type="text"
                        placeholder="Ej. Hospital Regional de Zona 3"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                        list="hospital-list"
                      />
                      <datalist id="hospital-list">
                        {hospitals.map(h => <option key={h.id} value={h.name} />)}
                      </datalist>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Habitación / Cama / Piso</label>
                      <input
                        type="text"
                        placeholder="Ej. Hab. 302 / Cama A"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Teléfono del Hospital</label>
                      <input
                        type="text"
                        placeholder="Ej. 555-1234 Ext 402"
                        value={hospitalPhone}
                        onChange={(e) => setHospitalPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Congregación</label>
                      <input
                        type="text"
                        placeholder="Ej. Congregación Central"
                        value={congregationName}
                        onChange={(e) => setCongregationName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ancianos contactados</label>
                      <input
                        type="text"
                        placeholder="Nombres de los ancianos"
                        value={contactedEldersNames}
                        onChange={(e) => setContactedEldersNames(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Teléfonos de los ancianos</label>
                      <input
                        type="text"
                        placeholder="Teléfonos de contacto"
                        value={contactedEldersPhones}
                        onChange={(e) => setContactedEldersPhones(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('notificacion')}
                    className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg text-xs hover:bg-slate-300"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('medico')}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800"
                  >
                    Siguiente: Problema Médico
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* TAB 3: PROBLEMA MÉDICO Y LABS */}
            {activeTab === 'medico' && (
              <div className="space-y-4">
                
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                    Información sobre el Problema Médico
                  </h4>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Problema específico *
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1 italic">
                      ¿Cuál es el diagnóstico médico? ¿Por qué se plantea la cuestión de la sangre: hemorragia, prematuro, anemia, etc.?
                    </p>
                    <textarea
                      rows={2}
                      placeholder="Describa el diagnóstico actual y la urgencia médica..."
                      value={specificProblem}
                      onChange={(e) => setSpecificProblem(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Historial médico relevante
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1 italic">
                      ¿A qué se debe la crisis actual? Antecedentes patológicos o intervenciones previas.
                    </p>
                    <textarea
                      rows={2}
                      placeholder="Antecedentes quirúrgicos, enfermedades crónicas, etc."
                      value={relevantMedicalHistory}
                      onChange={(e) => setRelevantMedicalHistory(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                {/* Lab Results Table Form */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      Resultados de los Análisis de Laboratorio
                    </h4>
                    <button
                      type="button"
                      onClick={addLabRow}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Añadir Toma de Muestra
                    </button>
                  </div>

                  <div className="space-y-2">
                    {labResults.map((lab, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-300 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-500">Fecha/Hora de Análisis</label>
                          <input
                            type="text"
                            placeholder="Ej. 05/08 - 08:00"
                            value={lab.dateTime}
                            onChange={(e) => updateLabRow(idx, 'dateTime', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500">Hb (g/dl)</label>
                          <input
                            type="text"
                            placeholder="Ej. 8.5"
                            value={lab.hemoglobin}
                            onChange={(e) => updateLabRow(idx, 'hemoglobin', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500">Hto (%)</label>
                          <input
                            type="text"
                            placeholder="Ej. 26%"
                            value={lab.hematocrit}
                            onChange={(e) => updateLabRow(idx, 'hematocrit', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500">Plaquetas (/μL)</label>
                          <input
                            type="text"
                            placeholder="Ej. 180,000"
                            value={lab.platelets}
                            onChange={(e) => updateLabRow(idx, 'platelets', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500">Otros (INR, TP...)</label>
                          <input
                            type="text"
                            placeholder="Otros parámetros"
                            value={lab.others}
                            onChange={(e) => updateLabRow(idx, 'others', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeLabRow(idx)}
                            disabled={labResults.length === 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doctors Section */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                    Información sobre el Médico y Plan de Tratamiento
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Médico a cargo</label>
                      <input
                        type="text"
                        placeholder="Dr. Nombre Apellido"
                        value={attendingDoctor}
                        onChange={(e) => setAttendingDoctor(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Especialidad</label>
                      <input
                        type="text"
                        placeholder="Ej. Cirugía General / Hematología"
                        value={attendingDoctorSpecialty}
                        onChange={(e) => setAttendingDoctorSpecialty(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Otro médico involucrado</label>
                      <input
                        type="text"
                        placeholder="Dr. Nombre Apellido"
                        value={otherDoctor}
                        onChange={(e) => setOtherDoctor(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Especialidad otro médico</label>
                      <input
                        type="text"
                        placeholder="Ej. Anestesiología"
                        value={otherDoctorSpecialty}
                        onChange={(e) => setOtherDoctorSpecialty(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Plan de Tratamiento del Médico (Análisis, procedimientos o tratamientos propuestos)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describa el plan médico actual..."
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        id="medicalStaffNotifiedHlcHelp"
                        checked={medicalStaffNotifiedHlcHelp}
                        onChange={(e) => setMedicalStaffNotifiedHlcHelp(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <label htmlFor="medicalStaffNotifiedHlcHelp" className="font-semibold text-slate-800 cursor-pointer text-xs">
                        ¿Se comunicó al personal médico que el paciente solicita la ayuda del HLC?
                      </label>
                    </div>

                    <div className="flex items-center gap-2 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      <input
                        type="checkbox"
                        id="legalActionMentioned"
                        checked={legalActionMentioned}
                        onChange={(e) => setLegalActionMentioned(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded"
                      />
                      <label htmlFor="legalActionMentioned" className="font-bold text-rose-900 cursor-pointer text-xs">
                        ⚠️ ¿Se ha mencionado la posibilidad de acciones legales?
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('paciente')}
                    className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg text-xs hover:bg-slate-300"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('estrategias')}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800"
                  >
                    Siguiente: Estrategias
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* TAB 4: ESTRATEGIAS / ARTÍCULOS */}
            {activeTab === 'estrategias' && (
              <div className="space-y-4">
                
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                    Estrategias, Alternativas y Artículos Médicos
                  </h4>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Estrategias / Alternativas Médicas
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1 italic">
                      Especificar modalidades, protocolos o técnicas para proponer a los médicos (ej. Eritropoyetina, Recuperación intraoperatoria de sangre, Ácido tranexámico, etc.)
                    </p>
                    <textarea
                      rows={2}
                      placeholder="Protocolos y técnicas médicas propuestas..."
                      value={strategiesAndAlternatives}
                      onChange={(e) => setStrategiesAndAlternatives(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Artículos Médicos de Apoyo Entregados
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1 italic">
                      Especificar artículos que puedan entregarse al personal médico como documentación de apoyo.
                    </p>
                    <textarea
                      rows={2}
                      placeholder="Artículos médicos facilitados al equipo..."
                      value={medicalArticles}
                      onChange={(e) => setMedicalArticles(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <input
                      type="checkbox"
                      id="doctorWillingToCollabAfterArticles"
                      checked={doctorWillingToCollabAfterArticles}
                      onChange={(e) => setDoctorWillingToCollabAfterArticles(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <label htmlFor="doctorWillingToCollabAfterArticles" className="font-bold text-emerald-900 cursor-pointer">
                      Tras revisar artículos de apoyo, ¿está el médico dispuesto a colaborar?
                    </label>
                  </div>
                </div>

                {/* Consulta Entre Médicos */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                    Consulta entre Médicos (Interconsulta con Especialista)
                  </h4>

                  <p className="text-[11px] text-slate-500 italic">
                    ¿Está el médico a cargo dispuesto a consultar con un especialista de experiencia en el tratamiento sin sangre?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Médico Consultor a contactar</label>
                      <input
                        type="text"
                        placeholder="Dr. Consultor"
                        value={consultantDoctorName}
                        onChange={(e) => setConsultantDoctorName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Método de contacto preferido</label>
                      <input
                        type="text"
                        placeholder="Ej. Llamada directa / WhatsApp / Email"
                        value={consultantPreferredContact}
                        onChange={(e) => setConsultantPreferredContact(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Especialidad</label>
                      <input
                        type="text"
                        placeholder="Especialidad del consultor"
                        value={consultantSpecialty}
                        onChange={(e) => setConsultantSpecialty(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Información adicional sobre la consulta</label>
                    <textarea
                      rows={2}
                      placeholder="Acuerdos o detalles de la interconsulta..."
                      value={consultantAdditionalInfo}
                      onChange={(e) => setConsultantAdditionalInfo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('medico')}
                    className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg text-xs hover:bg-slate-300"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('traslado')}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800"
                  >
                    Siguiente: Traslado
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* TAB 5: TRASLADO Y SEGUIMIENTO */}
            {activeTab === 'traslado' && (
              <div className="space-y-4">
                
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                    Solicitud de Traslado Hospitalario
                  </h4>

                  <p className="text-[11px] text-slate-500 italic">
                    Deben decidirlo el paciente o su familia. Describa el método y destino del traslado si aplica.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        id="transferConfirmed"
                        checked={transferConfirmed}
                        onChange={(e) => setTransferConfirmed(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <label htmlFor="transferConfirmed" className="font-bold text-slate-900 cursor-pointer">
                        Planes de traslado confirmados
                      </label>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        id="hospitalInfoSectionContacted"
                        checked={hospitalInfoSectionContacted}
                        onChange={(e) => setHospitalInfoSectionContacted(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <label htmlFor="hospitalInfoSectionContacted" className="font-bold text-slate-900 cursor-pointer">
                        Se contactó con Sección de Información sobre Hospitales
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Hospital al que se traslada</label>
                      <input
                        type="text"
                        placeholder="Nombre del hospital destino"
                        value={transferHospitalName}
                        onChange={(e) => setTransferHospitalName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Médico receptor que atenderá</label>
                      <input
                        type="text"
                        placeholder="Dr. Receptor"
                        value={transferAttendingDoctor}
                        onChange={(e) => setTransferAttendingDoctor(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Contacto del hospital de destino</label>
                      <input
                        type="text"
                        placeholder="Teléfono directo / Extensión"
                        value={transferHospitalContactPhone}
                        onChange={(e) => setTransferHospitalContactPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Información adicional sobre el traslado</label>
                    <textarea
                      rows={2}
                      placeholder="Ambulancia, requerimientos de traslado, etc."
                      value={transferAdditionalInfo}
                      onChange={(e) => setTransferAdditionalInfo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                {/* Resultados y Seguimiento */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-1">
                    Resultados y Seguimiento Final
                  </h4>

                  <div className="flex items-center gap-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <input
                      type="checkbox"
                      id="localEldersContactedFollowup"
                      checked={localEldersContactedFollowup}
                      onChange={(e) => setLocalEldersContactedFollowup(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <label htmlFor="localEldersContactedFollowup" className="font-bold text-emerald-950 cursor-pointer">
                      Ancianos locales contactados para seguimiento constante
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Resultados y Detalles del Seguimiento
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describa los resultados del caso, evolución médica y notas finales..."
                      value={followupResultsAndDetails}
                      onChange={(e) => setFollowupResultsAndDetails(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('estrategias')}
                    className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg text-xs hover:bg-slate-300"
                  >
                    Anterior
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow text-xs"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Hoja de Trabajo
                  </button>
                </div>

              </div>
            )}

          </form>

          {/* Modal Footer */}
          <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handlePreviewPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Vista Previa / Imprimir PDF
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSave()}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow text-xs"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Print Preview Modal */}
      {currentWorksheetForPrint && (
        <EmergencyWorksheetPrintModal
          worksheet={currentWorksheetForPrint}
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </>
  );
};
