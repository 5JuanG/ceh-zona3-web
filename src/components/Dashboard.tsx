import React from 'react';
import { useApp } from '../context/AppContext';
import { Specialty } from '../types';
import { CehLogo } from './CehLogo';
import { 
  UserCheck, 
  Building2, 
  CalendarCheck, 
  ShieldAlert, 
  Stethoscope, 
  PlusCircle, 
  ChevronRight, 
  PhoneCall, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  BookOpen,
  ArrowRight,
  Users,
  Sparkles,
  AlertTriangle,
  FilePlus,
  Cloud
} from 'lucide-react';

interface DashboardProps {
  onOpenDoctorModal: () => void;
  onOpenVisitModal: () => void;
  onOpenCaseModal: () => void;
  onOpenWorksheetModal: () => void;
  setSelectedSpecialtyFilter: (s: Specialty | 'todas') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenDoctorModal,
  onOpenVisitModal,
  onOpenCaseModal,
  onOpenWorksheetModal,
  setSelectedSpecialtyFilter
}) => {
  const { doctors, hospitals, visits, cases, stats, cehMembers, setActiveTab, globalSearch, syncAllToCloud, isCloudSynced } = useApp();

  const specialtiesList: Specialty[] = [
    'Cirugía General',
    'Anestesiología',
    'Hematología',
    'Ginecología y Obstetricia',
    'Traumatología y Ortopedia',
    'Cuidados Intensivos (UCI)',
    'Pediatría y Neonatología',
    'Cardiología / Cirugía Cardiovascular'
  ];

  // Filter doctors by global search if active
  const filteredDoctors = globalSearch ? doctors.filter(d => 
    d.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
    d.specialty.toLowerCase().includes(globalSearch.toLowerCase()) ||
    (d.notes && d.notes.toLowerCase().includes(globalSearch.toLowerCase()))
  ) : [];

  const filteredHospitals = globalSearch ? hospitals.filter(h => 
    h.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
    h.zone.toLowerCase().includes(globalSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(globalSearch.toLowerCase())
  ) : [];

  const pendingVisits = visits.filter(v => v.requiresFollowUp || v.status === 'programada');
  const activeCases = cases.filter(c => c.patientStatus !== 'alta' && c.patientStatus !== 'resuelto');

  return (
    <div className="space-y-6">
      
      {/* Global Search Results view if user typed in search bar */}
      {globalSearch && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-amber-900 text-sm">
              Resultados de búsqueda global para "{globalSearch}":
            </h3>
            <span className="text-xs text-amber-700 font-medium">
              {filteredDoctors.length} médicos | {filteredHospitals.length} hospitales
            </span>
          </div>

          {filteredDoctors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Médicos coincidentes:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredDoctors.map(doc => (
                  <div key={doc.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-900">{doc.title} {doc.name}</div>
                    <div className="text-sky-700 font-medium">{doc.specialty} ({doc.type})</div>
                    <div className="text-slate-500 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3 text-slate-400" />
                      {doc.phoneMobile}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredHospitals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Hospitales coincidentes:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHospitals.map(hosp => (
                  <div key={hosp.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-900">{hosp.name}</div>
                    <div className="text-slate-500">{hosp.zone} • {hosp.city}</div>
                    <div className="text-slate-600">Urgencias: {hosp.phoneEmergency}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Welcome & Overview Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-6 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 text-sky-600 shadow-md border border-slate-700/50 shrink-0 hidden sm:flex items-center justify-center">
              <CehLogo color="#1e88e5" className="w-full h-full" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                Panel de Control del Comité de Enlace
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Búsqueda y Gestión de Médicos Colaboradores
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl mt-1">
                Plataforma coordinada para localizar consultores médicos, coordinar visitas a centros de salud y dar seguimiento a estrategias de ahorro de sangre en hospitales de la zona.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                syncAllToCloud().then((res) => {
                  if (res.ok) alert('¡Todos los 16 miembros y datos han sido sincronizados a la Nube (Firestore) con éxito!');
                  else alert(`Error al sincronizar con la Nube:\n${res.error || 'Verifica tu conexión.'}`);
                });
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold bg-sky-900/90 hover:bg-sky-800 text-sky-200 rounded-xl shadow border border-sky-500/70 transition-all shrink-0"
            >
              <Cloud className="w-4 h-4 text-sky-300 animate-pulse" />
              <span>☁️ Sincronizar Nube</span>
            </button>

            <button
              onClick={onOpenWorksheetModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xl animate-pulse border border-red-400 cursor-pointer transition-all shrink-0"
            >
              <FilePlus className="w-4 h-4 text-white" />
              🚨 Nueva Hoja Emergencia (hlc-7-S)
            </button>

            <button
              onClick={() => setActiveTab('congregations')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg shadow transition-colors"
            >
              <Users className="w-4 h-4 text-emerald-200" />
              Integrantes CEH ({cehMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow transition-colors"
            >
              <MapPin className="w-4 h-4 text-amber-200" />
              Mapa Zona 3 & KML
            </button>
            <button
              onClick={onOpenDoctorModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Nuevo Médico
            </button>
            <button
              onClick={onOpenVisitModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <CalendarCheck className="w-4 h-4 text-sky-400" />
              Registrar Visita
            </button>
            <button
              onClick={onOpenCaseModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Asistencia Paciente
            </button>
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Médicos Totales</span>
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalDoctors}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats.totalCollaborators} colab. | {stats.totalConsultants} consult.
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Red Hospitalaria</span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalHospitals}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Centros registrados</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Visitas / Contactos</span>
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{visits.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Historial registrado</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Casos Asistidos</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats.activeCasesCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">En curso actualmente</div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Protocolos PBM</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {hospitals.filter(h => h.pbmProtocolsAccepted).length} / {hospitals.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Hospitales con PBM</div>
          </div>
        </div>
      </div>

      {/* CEH Zona 3 Territory Assignment Widget */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Reparto de Congregaciones • CEH Zona 3
              </h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                16 Integrantes
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              <strong>{stats.validTerritoryCongregations} congregaciones asignables</strong> divididas entre los 16 miembros del comité (~7-8 congregaciones por integrante) para la búsqueda activa de clínicas y hospitales.
              <span className="text-amber-700 ml-1">
                (4 congregaciones de Náhuatl, Inglés, LSM Señas y Chino Mandarín excluidas por superposición de territorio).
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('congregations')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2"
          >
            Gestión de Reparto
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Specialty Search Cards & Active Cases */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Specialty Directory Quick Links */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-sky-600" />
                  Búsqueda Rápida por Especialidad Médica
                </h3>
                <p className="text-xs text-slate-500">
                  Seleccione una especialidad para localizar médicos colaboradores y consultores disponibles.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSpecialtyFilter('todas');
                  setActiveTab('doctors');
                }}
                className="text-xs text-sky-700 font-semibold hover:underline flex items-center gap-1"
              >
                Ver directorio completo <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specialtiesList.map((spec) => {
                const count = doctors.filter(d => d.specialty === spec).length;
                const colabCount = doctors.filter(d => d.specialty === spec && d.type === 'colaborador').length;
                const consultCount = doctors.filter(d => d.specialty === spec && d.type === 'consultor').length;

                return (
                  <div
                    key={spec}
                    onClick={() => {
                      setSelectedSpecialtyFilter(spec);
                      setActiveTab('doctors');
                    }}
                    className="group bg-slate-50 hover:bg-sky-50/80 border border-slate-200 hover:border-sky-300 rounded-xl p-3 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-sky-900">
                        {spec}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {colabCount} colaboradores • {consultCount} consultores
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200 group-hover:border-sky-300 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        {count}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Cases / Patient Assistance */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Casos de Asistencia Activa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seguimiento de pacientes atendidos en hospitales por el Comité.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('cases')}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                Ver todos ({cases.length})
              </button>
            </div>

            {activeCases.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg">
                No hay casos activos requiriendo asistencia en este momento.
              </p>
            ) : (
              <div className="space-y-3">
                {activeCases.map((c) => {
                  const hosp = hospitals.find(h => h.id === c.hospitalId);
                  return (
                    <div key={c.id} className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
                          {c.caseCode}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Actualizado: {c.updatedAt}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {hosp?.name || 'Hospital de la Zona'} ({c.specialtyRequired})
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2">
                        {c.summary}
                      </p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/50">
                        <span className="text-slate-600">
                          Médico tratante: <strong className="text-slate-800">{c.attendingDoctorName || 'No especificado'}</strong>
                        </span>
                        <span className="text-amber-800 font-medium">
                          Rep. Comité: {c.assignedCommitteeMember}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Upcoming Follow-ups & Recent Activity */}
        <div className="space-y-6">
          
          {/* Pending Visits / Follow-ups */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                Seguimientos y Visitas
              </h3>
              <button
                onClick={() => setActiveTab('visits')}
                className="text-xs text-indigo-700 font-semibold hover:underline"
              >
                Ver agenda
              </button>
            </div>

            <div className="space-y-3">
              {pendingVisits.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No hay visitas pendientes registradas.
                </p>
              ) : (
                pendingVisits.map((v) => {
                  const hosp = hospitals.find(h => h.id === v.hospitalId);
                  return (
                    <div key={v.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {v.date}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          v.status === 'programada' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {v.status === 'programada' ? 'Programada' : 'Seguimiento'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {hosp?.name || 'Hospital'}
                      </div>
                      <div className="text-xs text-slate-600 truncate">
                        Contacto: {v.contactName || 'No especificado'}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {v.objective}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Zone Hospitals Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                Hospitales Principales
              </h3>
              <button
                onClick={() => setActiveTab('hospitals')}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                Directorio
              </button>
            </div>

            <div className="space-y-2">
              {hospitals.slice(0, 3).map((h) => (
                <div key={h.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                  <div className="font-bold text-slate-900">{h.name}</div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {h.zone} • {h.city}
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-600">Tel. Urgencias: {h.phoneEmergency}</span>
                    {h.pbmProtocolsAccepted ? (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        PBM Aceptado
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                        En gestión
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
