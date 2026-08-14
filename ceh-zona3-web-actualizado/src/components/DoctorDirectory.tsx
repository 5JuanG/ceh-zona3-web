import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Doctor, Specialty, DoctorType, DoctorStatus } from '../types';
import { Hlc31PrintModal } from './Hlc31PrintModal';
import { 
  UserCheck, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building2, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Edit3, 
  Trash2, 
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  FileSpreadsheet,
  Printer,
  Truck,
  Briefcase,
  X
} from 'lucide-react';

interface DoctorDirectoryProps {
  onOpenDoctorModal: (doc?: Doctor) => void;
  onOpenExcelModal: () => void;
  onOpenProviderModal: (doc?: Doctor) => void;
  onOpenAdminStaffModal: (doc?: Doctor) => void;
  selectedSpecialtyFilter: Specialty | 'todas';
  setSelectedSpecialtyFilter: (s: Specialty | 'todas') => void;
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({
  onOpenDoctorModal,
  onOpenExcelModal,
  onOpenProviderModal,
  onOpenAdminStaffModal,
  selectedSpecialtyFilter,
  setSelectedSpecialtyFilter
}) => {
  const { doctors, hospitals, deleteDoctor } = useApp();


  const [typeFilter, setTypeFilter] = useState<DoctorType | 'todos'>('todos');
  const [hospitalFilter, setHospitalFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<DoctorStatus | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hlc31Doctor, setHlc31Doctor] = useState<Doctor | null>(null);

  const specialtiesList: Specialty[] = [
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
    'Dirección Médica'
  ];

  // Filtering logic
  const filteredDoctors = doctors.filter(doc => {
    // Médicos "pendientes" (solo contactados, aún no autorizados por la
    // sucursal) no aparecen en el directorio oficial. Se revisan y aprueban
    // desde Panel de Admin → Médicos Pendientes de Aprobación.
    if (doc.approvalStatus === 'pendiente') {
      return false;
    }
    // Specialty filter
    if (selectedSpecialtyFilter !== 'todas' && doc.specialty !== selectedSpecialtyFilter) {
      return false;
    }
    // Type filter
    if (typeFilter !== 'todos' && doc.type !== typeFilter) {
      return false;
    }
    // Hospital filter
    if (hospitalFilter !== 'todos' && !doc.hospitalIds.includes(hospitalFilter)) {
      return false;
    }
    // Status filter
    if (statusFilter !== 'todos' && doc.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchSpecialty = doc.specialty.toLowerCase().includes(q);
      const matchSub = doc.subSpecialty ? doc.subSpecialty.toLowerCase().includes(q) : false;
      const matchNotes = doc.notes ? doc.notes.toLowerCase().includes(q) : false;
      if (!matchName && !matchSpecialty && !matchSub && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar a ${name} del directorio?`)) {
      deleteDoctor(id);
    }
  };

  const getCleanWhatsAppUrl = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleaned}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-600" />
            Directorio de Médicos Colaboradores y Consultores
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Localice especialistas por especialidad, hospital o nivel de experiencia en estrategias de medicina sin sangre.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onOpenExcelModal()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            Subir Excel / CSV
          </button>

          <button
            onClick={() => onOpenDoctorModal()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Añadir Nuevo Médico
          </button>

          <button
            onClick={() => onOpenProviderModal()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow transition-colors"
          >
            <Truck className="w-4 h-4" />
            Proveedor de Salud
          </button>

          <button
            onClick={() => onOpenAdminStaffModal()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg shadow transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            Personal Administrativo
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Box */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, subespecialidad o técnica..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Specialty Select */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedSpecialtyFilter}
              onChange={(e) => setSelectedSpecialtyFilter(e.target.value as any)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="todas">Todas las Especialidades</option>
              {specialtiesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Type Select */}
          <div className="w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todos los Roles</option>
              <option value="colaborador">Médico Colaborador</option>
              <option value="consultor">Médico Consultor</option>
              <option value="proveedor_salud">Proveedor de la Salud</option>
              <option value="contacto_administrativo">Contacto Administrativo</option>
            </select>
          </div>

          {/* Hospital Select */}
          <div className="w-full sm:w-auto">
            <select
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todos los Hospitales</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Cualquier Estado</option>
              <option value="disponible">Disponible</option>
              <option value="solo_urgencias">Solo Urgencias</option>
              <option value="en_consulta">En consulta / Licencia</option>
            </select>
          </div>

        </div>

        {/* Active Filters Clear Badge */}
        {(selectedSpecialtyFilter !== 'todas' || typeFilter !== 'todos' || hospitalFilter !== 'todos' || statusFilter !== 'todos' || searchQuery) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-semibold">Filtros activos:</span>
            {selectedSpecialtyFilter !== 'todas' && (
              <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                {selectedSpecialtyFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSpecialtyFilter('todas')} />
              </span>
            )}
            {typeFilter !== 'todos' && (
              <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                {typeFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setTypeFilter('todos')} />
              </span>
            )}
            <button
              onClick={() => {
                setSelectedSpecialtyFilter('todas');
                setTypeFilter('todos');
                setHospitalFilter('todos');
                setStatusFilter('todos');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>

      {/* Doctor Cards Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron médicos con estos criterios</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Pruebe ajustando los filtros de especialidad u hospital, o agregue un nuevo médico al directorio.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <button
              onClick={() => onOpenExcelModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg shadow"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              Subir Archivo Excel / CSV
            </button>
            <button
              onClick={() => onOpenDoctorModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-sky-600 text-white rounded-lg shadow"
            >
              <PlusCircle className="w-4 h-4" />
              Añadir Médico Manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => {
            const affiliatedHospitals = hospitals.filter(h => doc.hospitalIds.includes(h.id));

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Card Top Banner */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Doctor Role Badge */}
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        doc.type === 'colaborador'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : doc.type === 'consultor'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : doc.type === 'proveedor_salud'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {doc.type === 'colaborador' ? 'Médico Colaborador' : doc.type === 'consultor' ? 'Médico Consultor' : doc.type === 'proveedor_salud' ? 'Proveedor de la Salud' : 'Contacto Admin'}
                      </span>

                      {/* Availability Status Badge */}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.status === 'disponible'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'solo_urgencias'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {doc.status === 'disponible' ? 'Disponible' : doc.status === 'solo_urgencias' ? 'Solo Urgencias' : 'En Consulta'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {doc.title} {doc.name}
                    </h3>

                    <div className="text-xs font-semibold text-sky-700 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                      {doc.specialty}
                      {doc.subSpecialty && <span className="text-slate-500 font-normal">({doc.subSpecialty})</span>}
                    </div>
                  </div>

                  {/* Print / Edit / Delete Buttons */}
                  <div className="flex items-center gap-1">
                    {(doc.type === 'colaborador' || doc.type === 'consultor') && (
                      <button
                        onClick={() => setHlc31Doctor(doc)}
                        title="Imprimir Formulario Oficial HLC-31-S"
                        className="p-1.5 rounded-lg text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors flex items-center gap-1 font-bold text-[11px]"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>HLC-31</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (doc.type === 'proveedor_salud') onOpenProviderModal(doc);
                        else if (doc.type === 'contacto_administrativo') onOpenAdminStaffModal(doc);
                        else onOpenDoctorModal(doc);
                      }}
                      title="Editar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      title="Eliminar Médico"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 text-xs flex-1">
                  
                  {/* Affiliated Hospitals */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Centros Hospitalarios
                    </div>
                    {affiliatedHospitals.length === 0 ? (
                      <span className="text-slate-400 italic">Sin hospital asignado</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {affiliatedHospitals.map(h => (
                          <span key={h.id} className="bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded border border-slate-200">
                            {h.shortName || h.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {doc.department && (
                      <div className="text-slate-500 text-[11px] mt-1">
                        Servicio: <strong className="text-slate-700">{doc.department}</strong>
                      </div>
                    )}
                  </div>

                  {/* PBM Bloodless Techniques Tags */}
                  {doc.pbmTechniquesUsed && doc.pbmTechniquesUsed.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                        Estrategias / Técnicas PBM
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {doc.pbmTechniquesUsed.map((tech, idx) => (
                          <span key={idx} className="bg-sky-50 text-sky-900 border border-sky-200 text-[11px] px-2 py-0.5 rounded-md font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Hours & Notes */}
                  {doc.preferredContactHour && (
                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{doc.preferredContactHour}</span>
                    </div>
                  )}

                  {doc.notes && (
                    <p className="text-slate-600 bg-slate-50/80 p-2 rounded-lg text-[11px] italic line-clamp-3">
                      "{doc.notes}"
                    </p>
                  )}

                </div>

                {/* Card Footer Actions (Direct Calls/WhatsApp) */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  {doc.phoneMobile ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${doc.phoneMobile}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-sky-400" />
                        Llamar
                      </a>
                      <a
                        href={getCleanWhatsAppUrl(doc.phoneMobile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Sin celular registrado</span>
                  )}

                  {doc.email && (
                    <a
                      href={`mailto:${doc.email}`}
                      title={doc.email}
                      className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* HLC-31 Official Document Print Modal */}
      <Hlc31PrintModal
        isOpen={!!hlc31Doctor}
        onClose={() => setHlc31Doctor(null)}
        doctor={hlc31Doctor || {}}
      />

    </div>
  );
};
