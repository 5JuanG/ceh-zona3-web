import React, { useState, useEffect } from 'react';
import { Doctor } from '../types';
import { useApp } from '../context/AppContext';
import { X, Save, Truck, Phone, Mail, Building2, Trash2 } from 'lucide-react';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerToEdit?: Doctor | null;
}

const SERVICE_TYPES = [
  'Farmacia',
  'Laboratorio Clínico',
  'Ambulancia / Traslados',
  'Equipo Médico / Insumos',
  'Banco de Sangre Autólogo',
  'Servicios de Enfermería',
  'Otro'
];

export const ProviderModal: React.FC<ProviderModalProps> = ({ isOpen, onClose, providerToEdit }) => {
  const { hospitals, addDoctor, updateDoctor, deleteDoctor } = useApp();

  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [serviceTypeOther, setServiceTypeOther] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<string[]>([]);
  const [coverageArea, setCoverageArea] = useState('');
  const [phoneMobile, setPhoneMobile] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (providerToEdit) {
      setName(providerToEdit.name || '');
      const st = providerToEdit.subSpecialty || '';
      if (st && SERVICE_TYPES.includes(st)) {
        setServiceType(st);
        setServiceTypeOther('');
      } else if (st) {
        setServiceType('Otro');
        setServiceTypeOther(st);
      } else {
        setServiceType(SERVICE_TYPES[0]);
        setServiceTypeOther('');
      }
      setContactPerson(providerToEdit.department || '');
      setSelectedHospitalIds(providerToEdit.hospitalIds || []);
      const rawNotes = providerToEdit.notes || '';
      const coverageMatch = rawNotes.match(/^Zona\/cobertura:\s*(.*?)(?:\n([\s\S]*))?$/);
      if (coverageMatch) {
        setCoverageArea(coverageMatch[1] || '');
        setNotes(coverageMatch[2] || '');
      } else {
        setCoverageArea('');
        setNotes(rawNotes);
      }
      setPhoneMobile(providerToEdit.phoneMobile || '');
      setEmail(providerToEdit.email || '');
    } else {
      setName('');
      setServiceType(SERVICE_TYPES[0]);
      setServiceTypeOther('');
      setContactPerson('');
      setSelectedHospitalIds([]);
      setCoverageArea('');
      setPhoneMobile('');
      setEmail('');
      setNotes('');
    }
  }, [providerToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleHospitalSelection = (id: string) => {
    setSelectedHospitalIds(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingrese el nombre o razón social del proveedor.');
      return;
    }

    const resolvedServiceType = serviceType === 'Otro' ? (serviceTypeOther.trim() || 'Otro') : serviceType;

    const compiled: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      title: 'Proveedor',
      type: 'proveedor_salud',
      specialty: 'Otra',
      subSpecialty: resolvedServiceType,
      hospitalIds: selectedHospitalIds,
      department: contactPerson,
      phoneMobile,
      email,
      status: 'disponible',
      approvalStatus: 'autorizado',
      bloodlessExperience: 'por_contactar',
      notes: coverageArea ? `Zona/cobertura: ${coverageArea}${notes ? `\n${notes}` : ''}` : notes,
    };

    if (providerToEdit) {
      updateDoctor(providerToEdit.id, compiled as Doctor);
    } else {
      addDoctor(compiled);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto">

        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">
              {providerToEdit ? 'Editar Proveedor de la Salud' : 'Registrar Proveedor de la Salud'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre o razón social *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Farmacia San Rafael, Laboratorios XYZ..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de servicio</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              >
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {serviceType === 'Otro' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Especifique el servicio</label>
                <input
                  type="text"
                  value={serviceTypeOther}
                  onChange={(e) => setServiceTypeOther(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Persona de contacto</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Nombre de quien atiende al Comité"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono
              </label>
              <input
                type="tel"
                value={phoneMobile}
                onChange={(e) => setPhoneMobile(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Zona o cobertura (opcional)</label>
            <input
              type="text"
              value={coverageArea}
              onChange={(e) => setCoverageArea(e.target.value)}
              placeholder="ej. Monterrey y área metropolitana, entrega a domicilio..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Hospital(es) relacionados (opcional)
            </label>
            <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
              {hospitals.map(h => (
                <label key={h.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedHospitalIds.includes(h.id)}
                    onChange={() => toggleHospitalSelection(h.id)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  {h.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condiciones, tiempos de respuesta, acuerdos previos..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
            {providerToEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Está seguro de eliminar "${providerToEdit.name}" de la base de datos?`)) {
                    deleteDoctor(providerToEdit.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors order-3 sm:order-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            ) : <div className="hidden sm:block" />}

            <div className="flex items-center gap-3 order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow"
              >
                <Save className="w-4 h-4" />
                Guardar Proveedor
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
