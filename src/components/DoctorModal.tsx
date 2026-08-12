import React, { useState, useEffect } from 'react';
import { Doctor, Specialty, DoctorType, DoctorStatus, Hlc31Data } from '../types';
import { useApp } from '../context/AppContext';
import { Hlc31PrintModal } from './Hlc31PrintModal';
import { 
  X, 
  UserPlus, 
  Save, 
  Stethoscope, 
  Building2, 
  Phone, 
  Mail, 
  Clock, 
  FileText,
  Printer,
  CheckSquare,
  FileCheck2,
  ShieldAlert
} from 'lucide-react';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorToEdit?: Doctor | null;
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

export const DoctorModal: React.FC<DoctorModalProps> = ({ isOpen, onClose, doctorToEdit }) => {
  const { hospitals, addDoctor, updateDoctor, cehMembers } = useApp();

  // Basic Doctor State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Dr.');
  const [type, setType] = useState<DoctorType>('colaborador');
  const [specialty, setSpecialty] = useState<Specialty>('Cirugía General');
  const [subSpecialty, setSubSpecialty] = useState('');
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<string[]>([]);
  const [department, setDepartment] = useState('');
  const [phoneMobile, setPhoneMobile] = useState('');
  const [phoneHospital, setPhoneHospital] = useState('');
  const [phoneExtension, setPhoneExtension] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<DoctorStatus>('disponible');
  const [bloodlessExperience, setBloodlessExperience] = useState<'alto' | 'medio' | 'en_formacion' | 'por_contactar'>('alto');
  const [pbmTechniquesText, setPbmTechniquesText] = useState('');
  const [preferredContactHour, setPreferredContactHour] = useState('');
  const [notes, setNotes] = useState('');

  // HLC-31 Form Fields
  const [formPurpose, setFormPurpose] = useState<'actualizar' | 'nuevo'>('nuevo');
  const [contactTypes, setContactTypes] = useState<string[]>(['medico_colaborador']);
  const [contactTypeOther, setContactTypeOther] = useState('');
  const [sec1Comments, setSec1Comments] = useState('');
  const [firstContactDateAndPlace, setFirstContactDateAndPlace] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneFixed, setPhoneFixed] = useState('');
  const [gender, setGender] = useState('');
  const [congregationInfo, setCongregationInfo] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('México');
  const [sec2Comments, setSec2Comments] = useState('');

  const [specialty1, setSpecialty1] = useState('Cirugía General');
  const [subSpecialty1, setSubSpecialty1] = useState('');
  const [specialty2, setSpecialty2] = useState('');
  const [subSpecialty2, setSubSpecialty2] = useState('');
  const [specialty3, setSpecialty3] = useState('');
  const [subSpecialty3, setSubSpecialty3] = useState('');
  const [acceptedPatientTypes, setAcceptedPatientTypes] = useState<string[]>(['adulto', 'nino', 'neonato']);
  const [sec3Comments, setSec3Comments] = useState('');

  const [cehName, setCehName] = useState('Comité de Enlace con los Hospitales');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [cehMemberName, setCehMemberName] = useState('');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hlc31_sec1' | 'hlc31_sec2' | 'hlc31_sec3' | 'hlc31_sec4' | 'operativo'>('hlc31_sec2');

  useEffect(() => {
    if (doctorToEdit) {
      setName(doctorToEdit.name || '');
      setTitle(doctorToEdit.title || 'Dr.');
      setType(doctorToEdit.type || 'colaborador');
      setSpecialty(doctorToEdit.specialty || 'Cirugía General');
      setSubSpecialty(doctorToEdit.subSpecialty || '');
      setSelectedHospitalIds(doctorToEdit.hospitalIds || []);
      setDepartment(doctorToEdit.department || '');
      setPhoneMobile(doctorToEdit.phoneMobile || '');
      setPhoneHospital(doctorToEdit.phoneHospital || '');
      setPhoneExtension(doctorToEdit.phoneExtension || '');
      setEmail(doctorToEdit.email || '');
      setStatus(doctorToEdit.status || 'disponible');
      setBloodlessExperience(doctorToEdit.bloodlessExperience || 'alto');
      setPbmTechniquesText(doctorToEdit.pbmTechniquesUsed ? doctorToEdit.pbmTechniquesUsed.join(', ') : '');
      setPreferredContactHour(doctorToEdit.preferredContactHour || '');
      setNotes(doctorToEdit.notes || '');

      const hlc = doctorToEdit.hlc31 || {};
      setFormPurpose(hlc.formPurpose || 'actualizar');
      setContactTypes(hlc.contactTypes || ['medico_colaborador']);
      setContactTypeOther(hlc.contactTypeOther || '');
      setSec1Comments(hlc.sec1Comments || '');
      setFirstContactDateAndPlace(hlc.firstContactDateAndPlace || doctorToEdit.lastContactDate || '');

      setFirstName(hlc.firstName || (doctorToEdit.name ? doctorToEdit.name.split(' ')[0] : ''));
      setLastName(hlc.lastName || (doctorToEdit.name ? doctorToEdit.name.split(' ').slice(1).join(' ') : ''));
      setPhoneFixed(hlc.phoneFixed || doctorToEdit.phoneHospital || '');
      setGender(hlc.gender || '');
      setCongregationInfo(hlc.congregationInfo || '');
      setAddress(hlc.address || '');
      setCity(hlc.city || '');
      setStateProvince(hlc.stateProvince || '');
      setZipCode(hlc.zipCode || '');
      setCountry(hlc.country || 'México');
      setSec2Comments(hlc.sec2Comments || '');

      setSpecialty1(hlc.specialty1 || doctorToEdit.specialty || 'Cirugía General');
      setSubSpecialty1(hlc.subSpecialty1 || doctorToEdit.subSpecialty || '');
      setSpecialty2(hlc.specialty2 || '');
      setSubSpecialty2(hlc.subSpecialty2 || '');
      setSpecialty3(hlc.specialty3 || '');
      setSubSpecialty3(hlc.subSpecialty3 || '');
      setAcceptedPatientTypes(hlc.acceptedPatientTypes || ['adulto', 'nino', 'neonato']);
      setSec3Comments(hlc.sec3Comments || '');

      setCehName(hlc.cehName || 'Comité de Enlace con los Hospitales');
      setFormDate(hlc.formDate || new Date().toISOString().split('T')[0]);
      setCehMemberName(hlc.cehMemberName || (cehMembers.length > 0 ? cehMembers[0].name : ''));
    } else {
      // Defaults for NEW doctor contact HLC-31
      setName('');
      setTitle('Dr.');
      setType('colaborador');
      setSpecialty('Cirugía General');
      setSubSpecialty('');
      setSelectedHospitalIds(hospitals.length > 0 ? [hospitals[0].id] : []);
      setDepartment('');
      setPhoneMobile('');
      setPhoneHospital('');
      setPhoneExtension('');
      setEmail('');
      setStatus('disponible');
      setBloodlessExperience('alto');
      setPbmTechniquesText('Recuperador celular, Ácido Tranexámico, Hierro IV');
      setPreferredContactHour('Horario de consulta');
      setNotes('');

      setFormPurpose('nuevo');
      setContactTypes(['medico_colaborador']);
      setContactTypeOther('');
      setSec1Comments('');
      setFirstContactDateAndPlace('');

      setFirstName('');
      setLastName('');
      setPhoneFixed('');
      setGender('');
      setCongregationInfo('');
      setAddress('');
      setCity('');
      setStateProvince('');
      setZipCode('');
      setCountry('México');
      setSec2Comments('');

      setSpecialty1('Cirugía General');
      setSubSpecialty1('');
      setSpecialty2('');
      setSubSpecialty2('');
      setSpecialty3('');
      setSubSpecialty3('');
      setAcceptedPatientTypes(['adulto', 'nino', 'neonato']);
      setSec3Comments('');

      setCehName('Comité de Enlace con los Hospitales');
      setFormDate(new Date().toISOString().split('T')[0]);
      setCehMemberName(cehMembers.length > 0 ? cehMembers[0].name : '');
    }
  }, [doctorToEdit, isOpen, hospitals, cehMembers]);

  if (!isOpen) return null;

  const toggleContactType = (val: string) => {
    if (contactTypes.includes(val)) {
      setContactTypes(contactTypes.filter(c => c !== val));
    } else {
      setContactTypes([...contactTypes, val]);
    }
  };

  const toggleAcceptedPatient = (val: string) => {
    if (acceptedPatientTypes.includes(val)) {
      setAcceptedPatientTypes(acceptedPatientTypes.filter(p => p !== val));
    } else {
      setAcceptedPatientTypes([...acceptedPatientTypes, val]);
    }
  };

  const getCombinedDoctorData = (): Partial<Doctor> => {
    const fullName = name.trim() || `${firstName.trim()} ${lastName.trim()}`.trim() || 'Médico / Contacto';
    const pbmTechniquesUsed = pbmTechniquesText
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const hlc31: Hlc31Data = {
      formPurpose,
      contactTypes,
      contactTypeOther,
      sec1Comments,
      firstContactDateAndPlace,
      firstName,
      lastName,
      phoneFixed,
      phoneMobile,
      email,
      gender,
      congregationInfo,
      address,
      city,
      stateProvince,
      zipCode,
      country,
      sec2Comments,
      specialty1,
      subSpecialty1,
      specialty2,
      subSpecialty2,
      specialty3,
      subSpecialty3,
      acceptedPatientTypes,
      sec3Comments,
      cehName,
      formDate,
      cehMemberName
    };

    return {
      name: fullName,
      title,
      type,
      specialty: (specialty1 as Specialty) || specialty,
      subSpecialty: subSpecialty1 || subSpecialty,
      hospitalIds: selectedHospitalIds,
      department,
      phoneMobile,
      phoneHospital: phoneFixed || phoneHospital,
      phoneExtension,
      email,
      status,
      bloodlessExperience,
      pbmTechniquesUsed,
      preferredContactHour,
      notes,
      lastContactDate: firstContactDateAndPlace || new Date().toISOString().split('T')[0],
      hlc31
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const compiledDoc = getCombinedDoctorData();

    if (!compiledDoc.name) {
      alert('Por favor ingrese el nombre del médico o contacto.');
      return;
    }

    if (doctorToEdit) {
      updateDoctor(doctorToEdit.id, compiledDoc as Doctor);
    } else {
      addDoctor(compiledDoc as Doctor);
    }

    onClose();
  };

  const toggleHospitalSelection = (id: string) => {
    if (selectedHospitalIds.includes(id)) {
      setSelectedHospitalIds(selectedHospitalIds.filter(hId => hId !== id));
    } else {
      setSelectedHospitalIds([...selectedHospitalIds, id]);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
          
          {/* Modal Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-sm shadow">
                HLC-31
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  {doctorToEdit ? 'Editar Formulario de Contacto (HLC-31-S)' : 'Añadir Nuevo Médico / Contacto (HLC-31-S)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Comité de Enlace con los Hospitales • Registro Oficial HLC-31-S
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors"
                title="Generar vista previa e imprimir documento HLC-31-S"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir HLC-31-S</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Tabs for HLC-31-S Sections */}
          <div className="bg-slate-100 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1 shrink-0 text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('hlc31_sec1')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'hlc31_sec1' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Sección 1</span>
              <span className="text-[10px] opacity-75 font-normal">(Origen)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hlc31_sec2')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'hlc31_sec2' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Sección 2</span>
              <span className="text-[10px] opacity-75 font-normal">(Datos Personales)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hlc31_sec3')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'hlc31_sec3' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Sección 3</span>
              <span className="text-[10px] opacity-75 font-normal">(Especialidades)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hlc31_sec4')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'hlc31_sec4' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Sección 4</span>
              <span className="text-[10px] opacity-75 font-normal">(Firma y Consentimiento)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('operativo')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'operativo' ? 'bg-sky-700 text-white shadow-xs' : 'text-sky-800 bg-sky-50 hover:bg-sky-100'
              }`}
            >
              <span>Hospitales / PBM</span>
            </button>
          </div>

          {/* Modal Form Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            
            {/* SECCIÓN 1: Formulario y Tipo de Contacto */}
            {activeTab === 'hlc31_sec1' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 text-white p-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-sky-400" />
                  SECCIÓN 1: Propósito y Tipo de Contacto
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {/* Purpose */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-2">
                      Formulario utilizado para (marque una opción):
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="radio"
                          name="formPurpose"
                          checked={formPurpose === 'actualizar'}
                          onChange={() => setFormPurpose('actualizar')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span>Actualizar información sobre un contacto</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="radio"
                          name="formPurpose"
                          checked={formPurpose === 'nuevo'}
                          onChange={() => setFormPurpose('nuevo')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span>Introducir información sobre un contacto nuevo</span>
                      </label>
                    </div>
                  </div>

                  {/* Contact Types */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-2">
                      Tipo de contacto (marque todo lo que corresponda):
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={contactTypes.includes('medico_colaborador')}
                          onChange={() => toggleContactType('medico_colaborador')}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>Médico colaborador (llene también la Sección 3)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={contactTypes.includes('medico_consultor')}
                          onChange={() => toggleContactType('medico_consultor')}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>Médico consultor (llene también la Sección 3)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={contactTypes.includes('testigo_jehova')}
                          onChange={() => toggleContactType('testigo_jehova')}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>Testigo de Jehová</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={contactTypes.includes('miembro_ceh')}
                          onChange={() => toggleContactType('miembro_ceh')}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>Miembro del CEH, miembro del GVP u otro colaborador del CEH</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={contactTypes.includes('otro')}
                          onChange={() => toggleContactType('otro')}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>Otro (especifique en Comentarios)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Fecha y lugar del primer contacto con el miembro del CEH:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 15 de marzo de 2026, Hospital Central"
                    value={firstContactDateAndPlace}
                    onChange={e => setFirstContactDateAndPlace(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Comentarios Sección 1:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Notas o detalles del primer contacto..."
                    value={sec1Comments}
                    onChange={e => setSec1Comments(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN 2: Datos Personales y Dirección */}
            {activeTab === 'hlc31_sec2' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 text-white p-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-sky-400" />
                  SECCIÓN 2: Información de Contacto y Dirección
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Título</label>
                    <select
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Dra.">Dra.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Lic.">Lic.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Nombre <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Carlos Alberto"
                      value={firstName}
                      onChange={e => {
                        setFirstName(e.target.value);
                        setName(`${e.target.value} ${lastName}`.trim());
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Apellidos <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Benítez Rodríguez"
                      value={lastName}
                      onChange={e => {
                        setLastName(e.target.value);
                        setName(`${firstName} ${e.target.value}`.trim());
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Teléfono Fijo / Consultorio</label>
                    <input
                      type="text"
                      placeholder="ej. 81 8300 0000"
                      value={phoneFixed}
                      onChange={e => {
                        setPhoneFixed(e.target.value);
                        setPhoneHospital(e.target.value);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Teléfono Móvil (WhatsApp)</label>
                    <input
                      type="text"
                      placeholder="ej. 81 1234 5678"
                      value={phoneMobile}
                      onChange={e => setPhoneMobile(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="ej. doctor@medico.org"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Género</label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                    >
                      <option value="">No especificado</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Nombre y número de la congregación (si procede)
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Vista Hermosa (#63412)"
                      value={congregationInfo}
                      onChange={e => setCongregationInfo(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-extrabold text-slate-800 block text-xs">Domicilio / Dirección del Contacto</span>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Dirección (Calle, Número, Colonia)</label>
                    <input
                      type="text"
                      placeholder="ej. Av. San Jerónimo 402, Col. Real"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Ciudad</label>
                      <input
                        type="text"
                        placeholder="ej. Monterrey"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Provincia o Estado</label>
                      <input
                        type="text"
                        placeholder="ej. Nuevo León"
                        value={stateProvince}
                        onChange={e => setStateProvince(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Zona o C.P.</label>
                      <input
                        type="text"
                        placeholder="ej. 64000"
                        value={zipCode}
                        onChange={e => setZipCode(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">País</label>
                      <input
                        type="text"
                        placeholder="ej. México"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Comentarios Sección 2:</label>
                  <textarea
                    rows={2}
                    placeholder="Comentarios adicionales sobre domicilio o contacto..."
                    value={sec2Comments}
                    onChange={e => setSec2Comments(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN 3: Especialidades y Pacientes */}
            {activeTab === 'hlc31_sec3' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 text-white p-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-400" />
                  SECCIÓN 3: Especialidades y Pacientes Aceptados
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {/* Specialty 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Especialidad 1</label>
                      <select
                        value={specialty1}
                        onChange={e => {
                          setSpecialty1(e.target.value);
                          setSpecialty(e.target.value as Specialty);
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                      >
                        {SPECIALTIES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Subespecialidad 1</label>
                      <input
                        type="text"
                        placeholder="ej. Cirugía Laparoscópica / PBM"
                        value={subSpecialty1}
                        onChange={e => {
                          setSubSpecialty1(e.target.value);
                          setSubSpecialty(e.target.value);
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Specialty 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Especialidad 2 (opcional)</label>
                      <input
                        type="text"
                        placeholder="ej. Terapia Intensiva"
                        value={specialty2}
                        onChange={e => setSpecialty2(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Subespecialidad 2</label>
                      <input
                        type="text"
                        placeholder="ej. Manejo de Hemorragia Crítica"
                        value={subSpecialty2}
                        onChange={e => setSubSpecialty2(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Specialty 3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Especialidad 3 (opcional)</label>
                      <input
                        type="text"
                        placeholder="ej. Anestesiología"
                        value={specialty3}
                        onChange={e => setSpecialty3(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Subespecialidad 3</label>
                      <input
                        type="text"
                        placeholder="ej. Anestesia Obstétrica"
                        value={subSpecialty3}
                        onChange={e => setSubSpecialty3(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Patient Types Accepted */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-2">
                    Tipos de pacientes aceptados por el médico (marque todo lo que corresponda):
                  </label>
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={acceptedPatientTypes.includes('adulto')}
                        onChange={() => toggleAcceptedPatient('adulto')}
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <span>Adulto</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={acceptedPatientTypes.includes('nino')}
                        onChange={() => toggleAcceptedPatient('nino')}
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <span>Niño</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={acceptedPatientTypes.includes('neonato')}
                        onChange={() => toggleAcceptedPatient('neonato')}
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <span>Neonato</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Comentarios Sección 3:</label>
                  <textarea
                    rows={2}
                    placeholder="Observaciones de práctica o experiencia médica..."
                    value={sec3Comments}
                    onChange={e => setSec3Comments(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN 4: Declaración y Consentimiento */}
            {activeTab === 'hlc31_sec4' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 text-white p-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-sky-400" />
                  SECCIÓN 4: Consentimiento de Datos y Registro CEH
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-950 space-y-2 text-xs leading-relaxed">
                  <p className="font-bold text-amber-900">Declaración de Protección de Datos Personal:</p>
                  <p className="italic text-slate-800">
                    "Al llenar y enviar este formulario, confirmo que las personas mencionadas anteriormente han aceptado que el CEH almacene y procese su información personal, y entienden que la información incluida en este formulario pudiera ser enviada a países cuyas leyes proporcionan diferentes niveles de protección de datos, que no siempre equivalen al del país en el que se encuentran actualmente. También les informé que pueden ponerse en contacto con el CEH si cambian sus preferencias sobre cómo se almacenan sus datos personales."
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Nombre del CEH</label>
                    <input
                      type="text"
                      value={cehName}
                      onChange={e => setCehName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Fecha del Formulario</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Miembro del CEH que Registra</label>
                    <input
                      type="text"
                      placeholder="Nombre del integrante CEH"
                      value={cehMemberName}
                      onChange={e => setCehMemberName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Operativo: Hospitales & PBM */}
            {activeTab === 'operativo' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-sky-900 text-white p-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-300" />
                  Detalles Operativos y Afiliación Hospitalaria
                </div>

                {/* Hospital Affiliations */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Hospitales / Centros Médicos Afiliados
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl max-h-36 overflow-y-auto">
                    {hospitals.map(h => (
                      <label key={h.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-semibold">
                        <input
                          type="checkbox"
                          checked={selectedHospitalIds.includes(h.id)}
                          onChange={() => toggleHospitalSelection(h.id)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="truncate">{h.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status & PBM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Estado de Disponibilidad</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as DoctorStatus)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                    >
                      <option value="disponible">Disponible para consultas</option>
                      <option value="solo_urgencias">Solo para Urgencias</option>
                      <option value="en_consulta">En consulta / Licencia</option>
                      <option value="inactivo">Inactivo temporalmente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Experiencia Medicina Sin Sangre</label>
                    <select
                      value={bloodlessExperience}
                      onChange={e => setBloodlessExperience(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                    >
                      <option value="alto">Alto (Múltiples casos exitosos)</option>
                      <option value="medio">Medio (Casos electivos / Dispuesto)</option>
                      <option value="en_formacion">En formación / Receptivo</option>
                      <option value="por_contactar">Por contactar / Pendiente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Técnicas PBM Utilizadas</label>
                  <input
                    type="text"
                    placeholder="ej. Recuperador celular, Ácido Tranexámico, Hierro IV"
                    value={pbmTechniquesText}
                    onChange={e => setPbmTechniquesText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Horario Preferido para Consultas</label>
                  <input
                    type="text"
                    placeholder="ej. Tardes de 15:00 a 17:00 / Días hábiles"
                    value={preferredContactHour}
                    onChange={e => setPreferredContactHour(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Vista Previa Impresión HLC-31-S</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-black text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar Formulario
                </button>
              </div>
            </div>

          </form>

        </div>
      </div>

      {/* Print Modal Overlay */}
      <Hlc31PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        doctor={getCombinedDoctorData()}
      />
    </>
  );
};
