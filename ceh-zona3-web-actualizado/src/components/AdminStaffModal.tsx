import React, { useState, useEffect } from 'react';
import { Doctor } from '../types';
import { useApp } from '../context/AppContext';
import { X, Save, Briefcase, Phone, Mail, Clock, Trash2 } from 'lucide-react';

interface AdminStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: Doctor | null;
}

export const AdminStaffModal: React.FC<AdminStaffModalProps> = ({ isOpen, onClose, staffToEdit }) => {
  const { hospitals, addDoctor, updateDoctor, deleteDoctor } = useApp();

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [phoneMobile, setPhoneMobile] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContactHour, setPreferredContactHour] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name || '');
      setPosition(staffToEdit.department || '');
      setHospitalId(staffToEdit.hospitalIds?.[0] || '');
      setPhoneMobile(staffToEdit.phoneMobile || '');
      setEmail(staffToEdit.email || '');
      setPreferredContactHour(staffToEdit.preferredContactHour || '');
      setNotes(staffToEdit.notes || '');
    } else {
      setName('');
      setPosition('');
      setHospitalId('');
      setPhoneMobile('');
      setEmail('');
      setPreferredContactHour('');
      setNotes('');
    }
  }, [staffToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingrese el nombre de la persona.');
      return;
    }

    const compiled: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      title: '',
      type: 'contacto_administrativo',
      specialty: 'Otra',
      hospitalIds: hospitalId ? [hospitalId] : [],
      department: position,
      phoneMobile,
      email,
      status: 'disponible',
      approvalStatus: 'autorizado',
      bloodlessExperience: 'por_contactar',
      preferredContactHour,
      notes,
    };

    if (staffToEdit) {
      updateDoctor(staffToEdit.id, compiled as Doctor);
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
            <Briefcase className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">
              {staffToEdit ? 'Editar Personal Administrativo' : 'Registrar Personal Administrativo'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Puesto / cargo</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="ej. Trabajo Social, Admisión, Dirección..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital o institución</label>
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              >
                <option value="">— Ninguno / independiente —</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Horario de contacto preferido
            </label>
            <input
              type="text"
              value={preferredContactHour}
              onChange={(e) => setPreferredContactHour(e.target.value)}
              placeholder="ej. Lunes a viernes, 9am - 2pm"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Trámites que apoya, observaciones..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
            {staffToEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Está seguro de eliminar "${staffToEdit.name}" de la base de datos?`)) {
                    deleteDoctor(staffToEdit.id);
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
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
