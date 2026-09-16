import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Hospital } from '../types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  PlusCircle, 
  UserCheck, 
  Edit3, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';

interface HospitalDirectoryProps {
  onOpenHospitalModal: (hosp?: Hospital) => void;
  onFilterDoctorsByHospital?: (hospitalId: string) => void;
}

export const HospitalDirectory: React.FC<HospitalDirectoryProps> = ({
  onOpenHospitalModal,
  onFilterDoctorsByHospital
}) => {
  const { hospitals, doctors, deleteHospital, cehMembers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('Zona 3');
  const [hospitalToDelete, setHospitalToDelete] = useState<Hospital | null>(null);

  const filteredHospitals = hospitals.filter(h => {
    if (zoneFilter !== 'todas' && h.zone && h.zone !== zoneFilter && !h.zone.includes('Zona 3')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = h.name.toLowerCase().includes(q);
      const matchCity = h.city.toLowerCase().includes(q);
      const matchPerson = h.contactPerson ? h.contactPerson.toLowerCase().includes(q) : false;
      if (!matchName && !matchCity && !matchPerson) return false;
    }
    return true;
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar ${name} de la red de hospitales?`)) {
      deleteHospital(id);
    }
  };

  const getGoogleMapsUrl = (h: Hospital) => {
    if (h.googleMapsUrl && h.googleMapsUrl.trim()) {
      return h.googleMapsUrl.trim();
    }
    const query = encodeURIComponent(`${h.name}, ${h.address}, ${h.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-600" />
            Red Hospitalaria de la Zona
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Directorio de hospitales, clínicas y centros médicos de atención para el Comité de Enlace.
          </p>
        </div>

        <button
          onClick={() => onOpenHospitalModal()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Registrar Hospital
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de hospital, ciudad o contacto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg p-2 font-bold focus:ring-2 focus:ring-sky-500"
          >
            <option value="Zona 3">Zona 3</option>
          </select>
        </div>
      </div>

      {/* Hospitals Grid */}
      {filteredHospitals.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron hospitales</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Pruebe modificando los términos de búsqueda o registre un nuevo centro hospitalario.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredHospitals.map((h) => {
            const doctorsInHospital = doctors.filter(d => d.hospitalIds.includes(h.id));
            const colabDocs = doctorsInHospital.filter(d => d.type === 'colaborador');
            const consultDocs = doctorsInHospital.filter(d => d.type === 'consultor');
            const assignedMember = cehMembers.find(m => m.id === h.assignedCEHMemberId);

            return (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Header Banner */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                        {h.zone}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded uppercase">
                        {h.type}
                      </span>
                      {assignedMember && (
                        <span 
                          className="text-[11px] font-bold px-2 py-0.5 rounded text-slate-900 border flex items-center gap-1.5 shadow-sm"
                          style={{ backgroundColor: `${assignedMember.color}25`, borderColor: `${assignedMember.color}70` }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: assignedMember.color }} />
                          👤 {assignedMember.name.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {h.name}
                    </h3>

                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {h.address}, {h.city}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenHospitalModal(h)}
                      title="Editar Hospital"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setHospitalToDelete(h)}
                      title="Eliminar Hospital"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body details */}
                <div className="p-4 space-y-3 text-xs flex-1">
                  
                  {/* Contact Person & Telephones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">Teléfono Urgencias</span>
                      <a
                        href={`tel:${h.phoneEmergency}`}
                        className="font-bold text-slate-900 hover:text-sky-600 flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {h.phoneEmergency}
                      </a>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">Contacto / Bioética</span>
                      <span className="font-semibold text-slate-800 block truncate mt-0.5">
                        {h.contactPerson || 'Sin contacto registrado'}
                      </span>
                    </div>
                  </div>

                  {/* PBM & Bloodless Surgery Badges */}
                  <div className="flex flex-wrap gap-2">
                    {h.pbmProtocolsAccepted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Acepta Protocolos PBM
                      </span>
                    )}

                    {h.acceptsBloodlessSurgery && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                        Cirugía Sin Sangre
                      </span>
                    )}
                  </div>

                  {/* Doctors count in this hospital */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-sky-600" />
                        Médicos Afiliados ({doctorsInHospital.length})
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {colabDocs.length} Colab. | {consultDocs.length} Consult.
                      </span>
                    </div>

                    {doctorsInHospital.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {doctorsInHospital.slice(0, 4).map(d => (
                          <span key={d.id} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {d.title} {d.name} ({d.specialty})
                          </span>
                        ))}
                        {doctorsInHospital.length > 4 && (
                          <span className="text-[11px] text-slate-500 font-bold self-center">
                            +{doctorsInHospital.length - 4} más
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No hay médicos vinculados actualmente.</p>
                    )}
                  </div>

                  {/* Notes */}
                  {h.notes && (
                    <p className="text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-lg italic">
                      "{h.notes}"
                    </p>
                  )}

                </div>

                {/* Footer Action Links */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={getGoogleMapsUrl(h)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    {h.googleMapsUrl ? 'Abrir Enlace Google Maps 📍' : 'Ver en Google Maps'}
                  </a>

                  {onFilterDoctorsByHospital && doctorsInHospital.length > 0 && (
                    <button
                      onClick={() => onFilterDoctorsByHospital(h.id)}
                      className="text-xs font-semibold text-sky-700 hover:underline"
                    >
                      Ver médicos en este centro →
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {hospitalToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar hospital?</h3>
                <p className="text-xs text-slate-500 font-semibold">{hospitalToDelete.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Esta acción eliminará de forma permanente este hospital del directorio y lo retirará del mapa interactivo de la Zona 3.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setHospitalToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteHospital(hospitalToDelete.id);
                  setHospitalToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sí, Eliminar Hospital
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
