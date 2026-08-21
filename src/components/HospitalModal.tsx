import React, { useState, useEffect } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { useApp } from '../context/AppContext';
import { Hospital } from '../types';

interface HospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalToEdit?: Hospital | null;
}

export const HospitalModal: React.FC<HospitalModalProps> = ({ isOpen, onClose, hospitalToEdit }) => {
  const { addHospital, updateHospital, cehMembers, congregations } = useApp();
  const [cargarMapa, setCargarMapa] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<'publico' | 'privado' | 'mixto'>('privado');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phoneEmergency, setPhoneEmergency] = useState('');
  const [phoneGeneral, setPhoneGeneral] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [congregationNumber, setCongregationNumber] = useState('');
  const [assignedCEHMemberId, setAssignedCEHMemberId] = useState('');
  const [notes, setNotes] = useState('');
  const [acceptsBloodlessSurgery, setAcceptsBloodlessSurgery] = useState(false);
  const [pbmProtocolsAccepted, setPbmProtocolsAccepted] = useState(false);

  // Esperar a que la animación de apertura del modal de Tailwind termine
  // antes de montar las capas pesadas de Leaflet en el navegador
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setCargarMapa(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setCargarMapa(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (hospitalToEdit) {
      setName(hospitalToEdit.name || '');
      setType(hospitalToEdit.type || 'privado');
      setAddress(hospitalToEdit.address || '');
      setCity(hospitalToEdit.city || '');
      setPhoneEmergency(hospitalToEdit.phoneEmergency || '');
      setPhoneGeneral(hospitalToEdit.phoneGeneral || '');
      setEmail(hospitalToEdit.email || '');
      setContactPerson(hospitalToEdit.contactPerson || '');
      setCongregationNumber(hospitalToEdit.congregationNumber || '');
      setAssignedCEHMemberId(hospitalToEdit.assignedCEHMemberId || '');
      setNotes(hospitalToEdit.notes || '');
      setAcceptsBloodlessSurgery(!!hospitalToEdit.acceptsBloodlessSurgery);
      setPbmProtocolsAccepted(!!hospitalToEdit.pbmProtocolsAccepted);
    } else {
      setName('');
      setType('privado');
      setAddress('');
      setCity('');
      setPhoneEmergency('');
      setPhoneGeneral('');
      setEmail('');
      setContactPerson('');
      setCongregationNumber('');
      setAssignedCEHMemberId(cehMembers.length > 0 ? cehMembers[0].id : '');
      setNotes('');
      setAcceptsBloodlessSurgery(false);
      setPbmProtocolsAccepted(false);
    }
  }, [hospitalToEdit, isOpen, cehMembers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre del hospital es obligatorio.');
      return;
    }

    const data: Omit<Hospital, 'id' | 'createdAt'> = {
      name: name.trim(),
      zone: 'Zona 3',
      type,
      address,
      city,
      phoneEmergency,
      phoneGeneral,
      email,
      contactPerson,
      pbmProtocolsAccepted,
      acceptsBloodlessSurgery,
      assignedCEHMemberId: assignedCEHMemberId || undefined,
      congregationNumber: congregationNumber || undefined,
      notes,
    };

    if (hospitalToEdit) {
      updateHospital(hospitalToEdit.id, data);
    } else {
      addHospital(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-gray-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Formulario */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl shrink-0">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
            🏥 {hospitalToEdit ? 'Editar Hospital de la Zona' : 'Registrar Nuevo Hospital de la Zona'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition text-sm px-2 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Cuerpo del Formulario con Desplazamiento Controlado */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          
          {/* SECCIÓN DEL MAPA RESPONSIVO FIJADO */}
          <div className="w-full rounded-xl overflow-hidden border border-gray-200 bg-white p-2 shadow-sm">
            <p className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
              📍 Ubica el centro de salud en el mapa interactivo de control:
            </p>
            <div className="w-full rounded-lg overflow-hidden bg-slate-100 relative" style={{ height: '280px' }}>
              {cargarMapa ? (
                <InteractiveMap 
                  onOpenHospitalModal={() => {}} 
                  onFilterDoctorsByHospital={() => {}} 
                  readOnly={true} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic">
                  Inicializando visor geográfico...
                </div>
              )}
            </div>
          </div>

          {/* FORMULARIO DE CAMPOS DE DATOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Nombre del Hospital / Clínica *</label>
              <input
                type="text"
                required
                placeholder="Ej. Hospital Central"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Tipo de Centro</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'publico' | 'privado' | 'mixto')}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="publico">Público</option>
                <option value="privado">Privado / Particular</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Dirección Completa</label>
              <input
                type="text"
                placeholder="Av. Gran Vía #450"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Ciudad</label>
              <input
                type="text"
                placeholder="Ej. Monterrey"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Persona de Contacto</label>
              <input
                type="text"
                placeholder="Ej. Lic. Ana Torres, Dirección Médica"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Teléfono de Urgencias *</label>
              <input
                type="text"
                placeholder="+52 81 4555-0100"
                value={phoneEmergency}
                onChange={e => setPhoneEmergency(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Teléfono Conmutador / General</label>
              <input
                type="text"
                placeholder="+52 81 4555-0101"
                value={phoneGeneral}
                onChange={e => setPhoneGeneral(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Correo Electrónico</label>
              <input
                type="email"
                placeholder="contacto@hospital.mx"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-sky-50 border border-sky-200 rounded-lg p-3">
              <div>
                <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Congregación del territorio</label>
                <select
                  value={congregationNumber}
                  onChange={e => setCongregationNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Sin especificar --</option>
                  {(congregations || []).map(c => (
                    <option key={c.number} value={c.number}>{c.name} ({c.number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Miembro del CEH responsable</label>
                <select
                  value={assignedCEHMemberId}
                  onChange={e => setAssignedCEHMemberId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Sin asignar --</option>
                  {cehMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Determina en la Hoja de Trabajo de qué integrante aparecerá este hospital.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                <input type="checkbox" checked={acceptsBloodlessSurgery} onChange={e => setAcceptsBloodlessSurgery(e.target.checked)} className="rounded text-blue-600" />
                Acepta cirugía sin sangre
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                <input type="checkbox" checked={pbmProtocolsAccepted} onChange={e => setPbmProtocolsAccepted(e.target.checked)} className="rounded text-blue-600" />
                Acepta protocolos PBM
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-600 mb-0.5 text-xs">Reseña / Características del centro</label>
              <textarea
                rows={4}
                placeholder="Describe aquí las características relevantes del hospital: trato al paciente, disposición a colaborar, especialidades fuertes, historial de casos, observaciones del comité, etc. Esta reseña es la que aparecerá en la Hoja de Trabajo."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Barra de Acciones Inferior Fija */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md cursor-pointer">
              {hospitalToEdit ? 'Guardar Cambios' : 'Registrar Hospital'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
