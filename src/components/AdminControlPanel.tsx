import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CEHMember, CEHMemberPermissions } from '../types';
import { resetPasswordEmail } from '../lib/firebase';
import { 
  ShieldCheck, 
  Key, 
  UserCheck, 
  UserX, 
  MapPin, 
  UserPlus, 
  Lock, 
  Unlock, 
  Search, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Send, 
  Copy, 
  AlertTriangle,
  Users,
  Building2,
  FileText,
  Cloud,
  Mail
} from 'lucide-react';

interface AdminControlPanelProps {
  onOpenMemberWorksheetModal?: (memberId?: string) => void;
}

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({
  onOpenMemberWorksheetModal
}) => {
  const { 
    cehMembers, 
    updateCEHMember, 
    deleteCEHMember, 
    congregations, 
    assignCongregationToMember,
    isCloudSynced,
    syncAllToCloud
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberForPassword, setSelectedMemberForPassword] = useState<CEHMember | null>(null);
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<'administrador' | 'secretario'>('administrador');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  const filteredMembers = cehMembers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.role && m.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeMembersCount = cehMembers.filter(m => m.status !== 'inactivo').length;
  const inactiveMembersCount = cehMembers.filter(m => m.status === 'inactivo').length;

  const handleTogglePermission = (member: CEHMember, permKey: keyof CEHMemberPermissions) => {
    const currentPerms: CEHMemberPermissions = member.permissions || {
      canAssignTerritories: true,
      canManageMembers: true,
      canRemoveMembers: true,
      canManagePasswords: true,
      canEditHospitalsDoctors: true,
    };

    const updatedPermissions = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey]
    };

    updateCEHMember(member.id, {
      permissions: updatedPermissions
    });

    showNotification(`Permisos actualizados para ${member.name}`);
  };

  const handleSendResetEmail = async () => {
    if (!selectedMemberForPassword?.email) return;
    setResetStatus('sending');
    setResetErrorMsg(null);
    try {
      await resetPasswordEmail(selectedMemberForPassword.email);
      setResetStatus('sent');
    } catch (err: any) {
      setResetStatus('error');
      if (err?.code === 'auth/user-not-found') {
        setResetErrorMsg(
          'Este correo todavía no tiene una cuenta de acceso. Primero créala en Firebase Console → Authentication → Users → Agregar usuario, con este mismo correo.'
        );
      } else if (err?.code === 'auth/invalid-email') {
        setResetErrorMsg('El correo registrado para este integrante no es válido.');
      } else {
        setResetErrorMsg('No se pudo enviar el correo. Intenta de nuevo en unos minutos.');
      }
    }
  };

  const handleToggleMemberStatus = (member: CEHMember) => {
    const isCurrentlyInactive = member.status === 'inactivo';
    const newStatus = isCurrentlyInactive ? 'activo' : 'inactivo';

    // If deactivating, option to clear assigned territories
    if (!isCurrentlyInactive) {
      const assignedCongs = congregations.filter(c => c.assignedMemberId === member.id);
      if (assignedCongs.length > 0) {
        if (confirm(`El integrante ${member.name} tiene ${assignedCongs.length} territorios asignados. ¿Deseas liberar sus territorios al darlo de baja?`)) {
          assignedCongs.forEach(c => assignCongregationToMember(c.number, undefined));
        }
      }
    }

    updateCEHMember(member.id, {
      status: newStatus
    });

    showNotification(`Estatus de ${member.name} cambiado a ${newStatus === 'activo' ? '🟢 Activo' : '🔴 Inactivo'}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Toast Notification */}
      {noticeMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-sky-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
          <p className="text-xs font-bold">{noticeMessage}</p>
        </div>
      )}

      {/* Control Panel Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <ShieldCheck className="w-64 h-64 text-sky-300" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-600/90 text-white flex items-center justify-center font-bold shadow-lg border border-sky-400/30">
                <ShieldCheck className="w-7 h-7 text-sky-100" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-sky-900/80 text-sky-300 rounded-md border border-sky-700/50 mb-1">
                  Módulo de Seguridad y Control Acceso CEH
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Panel de Administrador
                </h2>
              </div>
            </div>

            {/* Role Active Switcher */}
            <div className="bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 flex items-center gap-1 shrink-0">
              <button
                onClick={() => setCurrentRole('administrador')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentRole === 'administrador'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👑 Administrador
              </button>
              <button
                onClick={() => setCurrentRole('secretario')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentRole === 'secretario'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📋 Secretario
              </button>
            </div>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
            Gestión centralizada para autorizar permisos, asignar territorios de congregaciones, agregar o dar de baja miembros del CEH, y gestionar contraseñas de acceso si algún miembro olvida cómo ingresar.
          </p>

          {/* Cloud Synchronization Status Banner */}
          <div className="bg-sky-900/40 border border-sky-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-300 shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sky-200">Sincronización en Tiempo Real (Firebase Nube)</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/30 text-sky-200 border border-sky-400/30">
                    {isCloudSynced ? 'Activa' : 'Conectando'}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Los miembros, médicos, hospitales y asignaciones están vinculados en la nube. Todo cambio realizado se refleja automáticamente en teléfonos móviles y otros dispositivos.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                syncAllToCloud().then(ok => {
                  if (ok) showNotification('¡Datos sincronizados a la Nube (Firestore) correctamente!');
                  else showNotification('Error al sincronizar con la nube');
                });
              }}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md border border-sky-400/40 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar Todo a la Nube
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-2xl">
              <span className="text-[11px] text-slate-400 font-medium block">Total Integrantes CEH</span>
              <span className="text-xl font-black text-sky-300 mt-0.5 block">{cehMembers.length}</span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-2xl">
              <span className="text-[11px] text-slate-400 font-medium block">Integrantes Activos</span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 block">{activeMembersCount}</span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-2xl">
              <span className="text-[11px] text-slate-400 font-medium block">Dados de Baja</span>
              <span className="text-xl font-black text-rose-400 mt-0.5 block">{inactiveMembersCount}</span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-2xl">
              <span className="text-[11px] text-slate-400 font-medium block">Territorios Asignados</span>
              <span className="text-xl font-black text-amber-300 mt-0.5 block">
                {congregations.filter(c => c.assignedMemberId).length} / {congregations.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table & Controls */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-5">
        
        {/* Search & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Key className="w-5 h-5 text-sky-600" />
              Gestión de Permisos y Recuperación de Contraseñas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Controla individualmente qué funciones puede realizar cada integrante del comité.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenMemberWorksheetModal && (
              <button
                onClick={() => onOpenMemberWorksheetModal()}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow text-xs transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Generar Hoja de Trabajo PDF</span>
              </button>
            )}

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, cargo o correo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Desktop Member Permissions Table (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Integrante / Privilegio</th>
                <th className="px-4 py-3.5 text-center">Estatus</th>
                <th className="px-4 py-3.5 text-center" title="Permiso para repartir territorios">
                  🗺️ Asignar Territorios
                </th>
                <th className="px-4 py-3.5 text-center" title="Permiso para dar de alta nuevos miembros">
                  👥 Agregar Miembros
                </th>
                <th className="px-4 py-3.5 text-center" title="Permiso para dar de baja integrantes">
                  🚫 Dar de Baja
                </th>
                <th className="px-4 py-3.5 text-center" title="Permiso para cambiar contraseñas de acceso">
                  🔑 Gest. Contraseñas
                </th>
                <th className="px-4 py-3.5 text-right">Contraseña / Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredMembers.map(member => {
                const perms = member.permissions || {
                  canAssignTerritories: true,
                  canManageMembers: true,
                  canRemoveMembers: true,
                  canManagePasswords: true,
                  canEditHospitalsDoctors: true,
                };
                const isInactive = member.status === 'inactivo';

                return (
                  <tr 
                    key={member.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isInactive ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    {/* Member Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border-2 shadow-xs shrink-0"
                            style={{ borderColor: member.color }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full text-white font-extrabold flex items-center justify-center shrink-0 shadow-xs text-xs"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                            {member.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                            <span className="font-semibold text-slate-700">{member.role || 'Anciano'}</span>
                            {member.email && <span>• {member.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleMemberStatus(member)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border transition-colors inline-flex items-center gap-1 ${
                          isInactive
                            ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        }`}
                        title="Haz clic para cambiar estatus (Activo / Baja)"
                      >
                        {isInactive ? '🔴 Baja (Inactivo)' : '🟢 Activo'}
                      </button>
                    </td>

                    {/* Toggle: Assign Territories */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleTogglePermission(member, 'canAssignTerritories')}
                        className={`p-1.5 rounded-lg border transition-all ${
                          perms.canAssignTerritories
                            ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title={perms.canAssignTerritories ? 'Permiso Activado' : 'Permiso Desactivado'}
                      >
                        {perms.canAssignTerritories ? <CheckCircle2 className="w-5 h-5 text-sky-600" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                      </button>
                    </td>

                    {/* Toggle: Add Members */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleTogglePermission(member, 'canManageMembers')}
                        className={`p-1.5 rounded-lg border transition-all ${
                          perms.canManageMembers
                            ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title={perms.canManageMembers ? 'Permiso Activado' : 'Permiso Desactivado'}
                      >
                        {perms.canManageMembers ? <CheckCircle2 className="w-5 h-5 text-sky-600" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                      </button>
                    </td>

                    {/* Toggle: Remove Members */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleTogglePermission(member, 'canRemoveMembers')}
                        className={`p-1.5 rounded-lg border transition-all ${
                          perms.canRemoveMembers
                            ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title={perms.canRemoveMembers ? 'Permiso Activado' : 'Permiso Desactivado'}
                      >
                        {perms.canRemoveMembers ? <CheckCircle2 className="w-5 h-5 text-sky-600" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                      </button>
                    </td>

                    {/* Toggle: Manage Passwords */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleTogglePermission(member, 'canManagePasswords')}
                        className={`p-1.5 rounded-lg border transition-all ${
                          perms.canManagePasswords
                            ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title={perms.canManagePasswords ? 'Permiso Activado' : 'Permiso Desactivado'}
                      >
                        {perms.canManagePasswords ? <CheckCircle2 className="w-5 h-5 text-sky-600" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                      </button>
                    </td>

                    {/* Password Recovery & Worksheet Buttons */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenMemberWorksheetModal && (
                          <button
                            onClick={() => onOpenMemberWorksheetModal(member.id)}
                            className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold rounded-xl text-[11px] transition-colors inline-flex items-center gap-1"
                            title="Generar Hoja de Trabajo en PDF para este miembro"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>Hoja Trabajo PDF</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedMemberForPassword(member);
                            setResetStatus('idle');
                            setResetErrorMsg(null);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[11px] shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>Contraseña</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No se encontraron integrantes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Member Cards View (Shown only on Mobile) */}
        <div className="md:hidden space-y-3.5">
          {filteredMembers.map(member => {
            const perms = member.permissions || {
              canAssignTerritories: true,
              canManageMembers: true,
              canRemoveMembers: true,
              canManagePasswords: true,
              canEditHospitalsDoctors: true,
            };
            const isInactive = member.status === 'inactivo';

            return (
              <div 
                key={member.id}
                className={`bg-white rounded-2xl p-4 border shadow-xs space-y-3 ${
                  isInactive ? 'bg-slate-50/70 border-slate-200 opacity-90' : 'border-slate-200'
                }`}
              >
                {/* Member Header */}
                <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-11 h-11 rounded-full object-cover border-2 shadow-xs shrink-0"
                        style={{ borderColor: member.color }}
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full text-white font-extrabold flex items-center justify-center shrink-0 shadow-xs text-xs"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
                        {member.name}
                      </h4>
                      <div className="text-xs font-semibold text-sky-700 mt-0.5">
                        {member.role || 'Anciano'}
                      </div>
                      {member.email && (
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleMemberStatus(member)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-colors shrink-0 ${
                      isInactive
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {isInactive ? '🔴 Baja' : '🟢 Activo'}
                  </button>
                </div>

                {/* Permissions Grid */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Permisos de Acceso:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      onClick={() => handleTogglePermission(member, 'canAssignTerritories')}
                      className={`p-2 rounded-xl border flex items-center justify-between text-left font-bold transition-all ${
                        perms.canAssignTerritories
                          ? 'bg-sky-50/90 text-sky-900 border-sky-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <span className="truncate pr-1">🗺️ Territorios</span>
                      {perms.canAssignTerritories ? <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />}
                    </button>

                    <button
                      onClick={() => handleTogglePermission(member, 'canManageMembers')}
                      className={`p-2 rounded-xl border flex items-center justify-between text-left font-bold transition-all ${
                        perms.canManageMembers
                          ? 'bg-sky-50/90 text-sky-900 border-sky-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <span className="truncate pr-1">👥 Agregar</span>
                      {perms.canManageMembers ? <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />}
                    </button>

                    <button
                      onClick={() => handleTogglePermission(member, 'canRemoveMembers')}
                      className={`p-2 rounded-xl border flex items-center justify-between text-left font-bold transition-all ${
                        perms.canRemoveMembers
                          ? 'bg-sky-50/90 text-sky-900 border-sky-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <span className="truncate pr-1">🚫 Dar Baja</span>
                      {perms.canRemoveMembers ? <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />}
                    </button>

                    <button
                      onClick={() => handleTogglePermission(member, 'canManagePasswords')}
                      className={`p-2 rounded-xl border flex items-center justify-between text-left font-bold transition-all ${
                        perms.canManagePasswords
                          ? 'bg-sky-50/90 text-sky-900 border-sky-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <span className="truncate pr-1">🔑 Claves</span>
                      {perms.canManagePasswords ? <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />}
                    </button>
                  </div>
                </div>

                {/* Password Recovery Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedMemberForPassword(member);
                      setResetStatus('idle');
                      setResetErrorMsg(null);
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restablecer Contraseña</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No se encontraron integrantes que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </div>

      {/* Password Recovery Modal ("Si a alguien se le olvida cómo accesar") */}
      {selectedMemberForPassword && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Restablecer Contraseña de Acceso
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedMemberForPassword.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMemberForPassword(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {!selectedMemberForPassword.email ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    Este integrante no tiene correo electrónico registrado. Agrégaselo primero editando su perfil, para poder enviarle el enlace de restablecimiento.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-700 text-xs flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <p>
                      Le enviaremos un correo a <strong>{selectedMemberForPassword.email}</strong> con un enlace de Firebase para que establezca su propia contraseña nueva. Nadie más, ni siquiera el Administrador, puede ver esa contraseña.
                    </p>
                  </div>

                  {resetStatus === 'error' && resetErrorMsg && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-rose-900 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p>{resetErrorMsg}</p>
                    </div>
                  )}

                  {resetStatus === 'sent' && (
                    <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-sky-900 text-xs flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <p>Correo enviado. Pídele a {selectedMemberForPassword.name} que revise su bandeja de entrada (y spam) y siga el enlace.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={resetStatus === 'sending' || resetStatus === 'sent'}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {resetStatus === 'sending' ? 'Enviando...' : resetStatus === 'sent' ? 'Correo enviado' : 'Enviar Enlace de Contraseña'}
                  </button>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForPassword(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
