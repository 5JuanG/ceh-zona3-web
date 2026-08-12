import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CEHMember } from '../types';
import { Users, X, UserPlus, Phone, Briefcase, Palette, Trash2, AlertCircle } from 'lucide-react';

interface CEHMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: CEHMember | null;
}

const COLOR_PRESETS = [
  '#3b82f6', // Azul
  '#10b981', // Esmeralda
  '#f59e0b', // Ámbar
  '#ef4444', // Rojo
  '#8b5cf6', // Violeta
  '#ec4899', // Rosa
  '#06b6d4', // Cian
  '#84cc16', // Lima
  '#f97316', // Naranja
  '#d946ef', // Magenta
  '#14b8a6', // Teal
  '#0284c7', // Sky
  '#059669', // Verde oscuro
  '#b45309', // Marrón
  '#6366f1', // Índigo
];

export const CEHMemberModal: React.FC<CEHMemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit
}) => {
  const { addCEHMember, updateCEHMember, deleteCEHMember, congregations, hospitals } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Anciano');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setPhone(memberToEdit.phone || '');
      setEmail(memberToEdit.email || '');
      setRole(memberToEdit.role || 'Anciano');
      setColor(memberToEdit.color || COLOR_PRESETS[0]);
      setPhotoUrl(memberToEdit.photoUrl || '');
      setStatus(memberToEdit.status || 'activo');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setRole('Anciano');
      setColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
      setPhotoUrl('');
      setStatus('activo');
    }
    setConfirmDelete(false);
  }, [memberToEdit, isOpen]);

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setPhotoUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (memberToEdit) {
      updateCEHMember(memberToEdit.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        role: role.trim() || 'Anciano',
        color,
        photoUrl: photoUrl.trim() || undefined,
        status
      });
    } else {
      addCEHMember({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        role: role.trim() || 'Anciano',
        color,
        assignedCongregationIds: [],
        photoUrl: photoUrl.trim() || undefined,
        status,
        permissions: {
          canAssignTerritories: true,
          canManageMembers: true,
          canRemoveMembers: true,
          canManagePasswords: true,
          canEditHospitalsDoctors: true
        }
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (!memberToEdit) return;
    deleteCEHMember(memberToEdit.id);
    onClose();
  };

  const assignedCongsCount = memberToEdit 
    ? congregations.filter(c => c.assignedMemberId === memberToEdit.id).length
    : 0;

  const assignedHospitalsCount = memberToEdit
    ? hospitals.filter(h => h.assignedCEHMemberId === memberToEdit.id).length
    : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md font-bold text-white text-lg"
              style={{ backgroundColor: color }}
            >
              {memberToEdit ? '✏️' : <UserPlus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">
                {memberToEdit ? 'Editar Integrante del CEH' : 'Registrar Nuevo Integrante del CEH'}
              </h3>
              <p className="text-xs text-slate-400">
                Comité de Enlace con Hospitales • Gestión de Miembros
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Photo Section */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="relative shrink-0">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={name || 'Avatar'} 
                  className="w-16 h-16 rounded-full object-cover border-2 shadow-sm"
                  style={{ borderColor: color }}
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full text-white font-black text-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {name ? name.substring(0, 2).toUpperCase() : 'CEH'}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="block font-bold text-slate-800">
                Foto de Perfil del Integrante
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] shadow transition-colors inline-flex items-center gap-1">
                  📷 Cargar Foto desde archivo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoFileUpload} 
                    className="hidden" 
                  />
                </label>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-semibold"
                  >
                    Quitar foto
                  </button>
                )}
              </div>
              <input
                type="url"
                placeholder="O pegar URL de imagen (https://...)"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 font-normal text-slate-700 text-[11px]"
              />
            </div>
          </div>

          {/* Member Name & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                Nombre Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ej. Juan Pérez G."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-semibold text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Estatus
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'activo' | 'inactivo')}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900 text-xs"
              >
                <option value="activo">🟢 Activo</option>
                <option value="inactivo">🔴 Inactivo / Baja</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="ej. miembro@comite-ceh.org"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
            />
            <p className="mt-1 text-[10.5px] text-slate-400">
              Usa el mismo correo con el que este integrante inicia sesión en el sistema (cuenta creada por el Administrador en Firebase).
            </p>
          </div>

          {/* Privilegio & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                Privilegio
              </label>
              <input
                type="text"
                placeholder="ej. Anciano, Siervo Ministerial..."
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                placeholder="ej. 81 1234 5678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                Color Distintivo en Mapas y Reportes
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-500" style={{ color }}>
                {color}
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {COLOR_PRESETS.map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setColor(preset)}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    color === preset ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                />
              ))}

              <div className="flex items-center gap-1.5 ml-auto pl-2 border-l border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold">Personalizado:</span>
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Assigned Stats Info (if editing) */}
          {memberToEdit && (assignedCongsCount > 0 || assignedHospitalsCount > 0) && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Asignaciones actuales:</p>
                <p className="mt-0.5">
                  Tiene <strong>{assignedCongsCount}</strong> congregaciones asignadas y <strong>{assignedHospitalsCount}</strong> hospitales registrados a su cargo.
                </p>
              </div>
            </div>
          )}

          {/* Confirm Delete Section */}
          {confirmDelete && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
              <p className="font-bold text-rose-950 text-xs">
                ¿Estás seguro de dar de baja a este integrante?
              </p>
              <p className="text-[11px] text-rose-800">
                Se desasignarán sus congregaciones y referencias en la plataforma. Esta acción no se puede deshacer.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
                >
                  Sí, Eliminar Integrante
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {memberToEdit && !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {memberToEdit ? 'Guardar Cambios' : 'Registrar Integrante'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
