import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  MapPin, 
  Sparkles, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Building, 
  RotateCcw, 
  ChevronRight, 
  Phone, 
  Briefcase, 
  Layers,
  Map as MapIcon,
  HelpCircle,
  FileSpreadsheet,
  UserPlus,
  Plus,
  Cloud,
  Trash2
} from 'lucide-react';
import { CEHMember, Congregation } from '../types';
import { CEHMemberModal } from './CEHMemberModal';
import { FileText } from 'lucide-react';

interface CongregationManagerProps {
  onOpenMemberWorksheetModal?: (memberId?: string) => void;
}

export const CongregationManager: React.FC<CongregationManagerProps> = ({
  onOpenMemberWorksheetModal
}) => {
  const { 
    cehMembers, 
    congregations, 
    updateCEHMember, 
    deleteCongregation,
    assignCongregationToMember, 
    toggleCongregationExclusion, 
    autoDistributeCongregations, 
    resetCongregationAssignments,
    setActiveTab,
    stats,
    syncAllToCloud
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'congregations' | 'members'>('congregations');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'sin_asignar' | 'asignadas' | 'excluidas'>('todas');
  const [memberFilter, setMemberFilter] = useState<string>('todos');
  const [circuitFilter, setCircuitFilter] = useState<string>('todos');

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<CEHMember | null>(null);

  // Get unique cities
  const cities = Array.from(new Set(congregations.map(c => c.city))).sort();

  // Get unique circuit sections
  const circuits = Array.from(new Set(congregations.map(c => c.circuitSection))).sort();

  // Filter congregations
  const filteredCongregations = congregations.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.number.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = cityFilter === 'todas' || c.city === cityFilter;
    const matchesCircuit = circuitFilter === 'todos' || c.circuitSection === circuitFilter;

    let matchesStatus = true;
    if (statusFilter === 'excluidas') matchesStatus = c.isExcludedFromTerritory;
    else if (statusFilter === 'sin_asignar') matchesStatus = !c.isExcludedFromTerritory && !c.assignedMemberId;
    else if (statusFilter === 'asignadas') matchesStatus = !c.isExcludedFromTerritory && !!c.assignedMemberId;

    let matchesMember = true;
    if (memberFilter !== 'todos') {
      matchesMember = c.assignedMemberId === memberFilter;
    }

    return matchesSearch && matchesCity && matchesCircuit && matchesStatus && matchesMember;
  });

  const handleOpenMemberModal = (member?: CEHMember) => {
    setMemberToEdit(member || null);
    setMemberModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold mb-3">
              <Users className="w-3.5 h-3.5" />
              CEH Zona 3 • 16 Miembros del Comité
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Reparto de Territorios por Congregación
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Asigna y distribuye equitativamente las {stats.validTerritoryCongregations} congregaciones de la Zona 3 entre los 16 integrantes para la localización y contacto con clínicas y hospitales en sus territorios asignados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => {
                syncAllToCloud().then(res => {
                  if (res.ok) alert('¡Éxito! Los 16 miembros e información del Comité han sido sincronizados a la Nube (Firestore).');
                  else alert(`Error al sincronizar con la Nube:\n${res.error || 'Verifica tu conexión.'}`);
                });
              }}
              className="flex-1 md:flex-initial px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg border border-sky-400/50 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer whitespace-nowrap"
            >
              <Cloud className="w-4 h-4 text-sky-200 animate-pulse shrink-0" />
              <span>Sincronizar Nube</span>
            </button>

            <button
              onClick={autoDistributeCongregations}
              className="flex-1 md:flex-initial px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 text-xs whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
              <span>Reparto Automático</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 text-xs whitespace-nowrap"
            >
              <MapIcon className="w-4 h-4 shrink-0" />
              <span>Ver Mapa</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block">Total Congregaciones</span>
            <span className="text-lg font-bold text-white">{stats.totalCongregations}</span>
          </div>

          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/40">
            <span className="text-emerald-400 block">Territorios Válidos</span>
            <span className="text-lg font-bold text-emerald-200">{stats.validTerritoryCongregations}</span>
          </div>

          <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-800/40">
            <span className="text-amber-400 block">Excluidas (Idiomas/Señas)</span>
            <span className="text-lg font-bold text-amber-200">{stats.excludedCongregations}</span>
          </div>

          <div className="bg-sky-950/40 p-3 rounded-xl border border-sky-800/40">
            <span className="text-sky-400 block">Asignadas a Integrantes</span>
            <span className="text-lg font-bold text-sky-200">{stats.assignedCongregations}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 col-span-2 sm:col-span-1">
            <span className="text-slate-400 block">Promedio p/ Miembro</span>
            <span className="text-lg font-bold text-amber-400">
              ~{Math.ceil(stats.validTerritoryCongregations / (cehMembers.length || 1))} congs.
            </span>
          </div>
        </div>
      </div>

      {/* Exclusion Warning Box for the 4 Language Congregations */}
      <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 text-xs text-amber-950 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-950 text-sm">
              Exclusión Automática de Congregaciones de Idioma Especial o Señas
            </h4>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Las congregaciones <strong>(232207) Náhuatl</strong>, <strong>(238188) Inglés</strong>, <strong>(127878) LSM Señas</strong> y <strong>(271924) Chino Mandarín</strong> han sido excluidas automáticamente del reparto territorial porque sus zonas se superponen con múltiples territorios comunitarios.
            </p>
          </div>
        </div>

        <button
          onClick={() => setStatusFilter('excluidas')}
          className="px-3.5 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-xl border border-amber-400 shrink-0 transition-colors text-xs flex items-center gap-1.5 whitespace-nowrap"
        >
          Ver las 4 Excluidas
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-Tabs & Action Controls Bar */}
      <div className="bg-slate-900/90 sm:bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-700 sm:border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
        {/* Main View Tabs (2-column grid on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 bg-slate-800 sm:bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('congregations')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap text-xs font-bold ${
              activeSubTab === 'congregations'
                ? 'bg-amber-500 sm:bg-slate-900 text-slate-950 sm:text-white shadow-sm'
                : 'text-slate-300 sm:text-slate-600 hover:text-white sm:hover:text-slate-900 hover:bg-slate-700/50 sm:hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Congregaciones <span className="font-mono text-[11px] opacity-90">({filteredCongregations.length})</span></span>
          </button>

          <button
            onClick={() => setActiveSubTab('members')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap text-xs font-bold ${
              activeSubTab === 'members'
                ? 'bg-amber-500 sm:bg-slate-900 text-slate-950 sm:text-white shadow-sm'
                : 'text-slate-300 sm:text-slate-600 hover:text-white sm:hover:text-slate-900 hover:bg-slate-700/50 sm:hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Integrantes CEH <span className="font-mono text-[11px] opacity-90">({cehMembers.length})</span></span>
          </button>
        </div>

        {/* Action Buttons (Registrar, Hoja Trabajo & Limpiar) */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {onOpenMemberWorksheetModal && (
            <button
              onClick={() => onOpenMemberWorksheetModal()}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-sky-300 font-bold rounded-xl border border-sky-500/40 shadow transition-colors flex items-center justify-center gap-1.5 text-xs whitespace-nowrap cursor-pointer"
            >
              <FileText className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Hoja de Trabajo PDF</span>
            </button>
          )}

          <button
            onClick={() => handleOpenMemberModal()}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 text-xs whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Registrar Integrante</span>
          </button>

          <button
            onClick={resetCongregationAssignments}
            className="px-3 py-2.5 text-slate-300 sm:text-slate-600 hover:text-red-400 sm:hover:text-red-600 hover:bg-red-950/40 sm:hover:bg-red-50 bg-slate-800 sm:bg-slate-100 border border-slate-700 sm:border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs whitespace-nowrap"
            title="Reiniciar todas las asignaciones de territorios"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Limpiar Asignaciones</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CONGREGATIONS LIST & ASSIGNMENT */}
      {activeSubTab === 'congregations' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar congregación por nombre, número o ciudad..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Ciudad:</span>
              <select
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
              >
                <option value="todas">Todas las ciudades</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Estado:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
              >
                <option value="todas">Todos los estados</option>
                <option value="sin_asignar">Sin Asignar ({stats.unassignedCongregations})</option>
                <option value="asignadas">Asignadas ({stats.assignedCongregations})</option>
                <option value="excluidas">Excluidas ({stats.excludedCongregations})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Miembro Asignado:</span>
              <select
                value={memberFilter}
                onChange={e => setMemberFilter(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium max-w-[180px]"
              >
                <option value="todos">Todos los miembros</option>
                {cehMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.assignedCongregationIds.length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table of Congregations */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Número</th>
                    <th className="px-4 py-3.5">Nombre de la Congregación</th>
                    <th className="px-4 py-3.5">Ciudad</th>
                    <th className="px-4 py-3.5">Idioma / Circuito</th>
                    <th className="px-4 py-3.5">Datos</th>
                    <th className="px-4 py-3.5">Miembro Responsable CEH</th>
                    <th className="px-4 py-3.5 text-right">Estatus Territorio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredCongregations.map(cong => {
                    const assignedMember = cehMembers.find(m => m.id === cong.assignedMemberId);

                    return (
                      <tr 
                        key={cong.number} 
                        className={`hover:bg-slate-50 transition-colors ${
                          cong.isExcludedFromTerritory ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          #{cong.number}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {cong.name}
                          {cong.isExcludedFromTerritory && (
                            <span className="block text-[10px] text-amber-700 font-normal mt-0.5">
                              ⚠️ {cong.exclusionReason || 'Excluida de reparto territorial'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {cong.city}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold mr-1">
                            {cong.circuitSection}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {cong.language}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {cong.publishersCount} pub | {cong.eldersCount} anc | {cong.pioneersCount} prec
                        </td>
                        <td className="px-4 py-3.5">
                          {cong.isExcludedFromTerritory ? (
                            <span className="text-slate-400 italic text-[11px]">
                              No requiere asignación
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {assignedMember && (
                                <span 
                                  className="w-3 h-3 rounded-full shrink-0 border border-black/10" 
                                  style={{ backgroundColor: assignedMember.color }} 
                                />
                              )}
                              <select
                                value={cong.assignedMemberId || ''}
                                onChange={e => assignCongregationToMember(cong.number, e.target.value || undefined)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                                  assignedMember 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                                    : 'bg-slate-50 border-slate-300 text-slate-500'
                                }`}
                              >
                                <option value="">-- Sin Asignar --</option>
                                {cehMembers.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.assignedCongregationIds.length} congs)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleCongregationExclusion(cong.number)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                cong.isExcludedFromTerritory
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Haz clic para activar o desactivar exclusión"
                            >
                              {cong.isExcludedFromTerritory ? 'Excluida (Activar)' : 'Excluir'}
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de que deseas eliminar la congregación "${cong.name}" (#${cong.number})?`)) {
                                  deleteCongregation(cong.number);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                              title="Eliminar congregación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCongregations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        No se encontraron congregaciones con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CEH MEMBERS CARDS PANEL */}
      {activeSubTab === 'members' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                Directorio e Integrantes del Comité de Enlace ({cehMembers.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Puedes registrar nuevos miembros o editar/dar de baja integrantes existentes cuando ocurran cambios.
              </p>
            </div>
            
            <button
              onClick={() => handleOpenMemberModal()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow transition-all flex items-center gap-2 text-xs shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              + Registrar Nuevo Integrante
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cehMembers.map((member, index) => {
              const memberCongs = congregations.filter(c => c.assignedMemberId === member.id);
              const isInactive = member.status === 'inactivo';
              
              // Clean phone digits for WhatsApp URL
              const phoneDigits = member.phone ? member.phone.replace(/\D/g, '') : '';
              // Add country code 52 (Mexico) if 10 digits
              const waNumber = phoneDigits.length === 10 ? `52${phoneDigits}` : phoneDigits;

              return (
                <div 
                  key={member.id} 
                  className={`bg-white rounded-2xl p-5 shadow-sm border flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden ${
                    isInactive ? 'opacity-70 border-slate-300 bg-slate-50' : 'border-slate-200'
                  }`}
                >
                  {/* Top Member Color Header Stripe */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-2" 
                    style={{ backgroundColor: isInactive ? '#94a3b8' : member.color }}
                  />

                  <div>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <div className="flex items-center gap-3">
                        {/* Member Photo Avatar */}
                        <div className="relative shrink-0">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover border-2 shadow-sm"
                              style={{ borderColor: member.color }}
                            />
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-full text-white font-extrabold flex items-center justify-center shrink-0 shadow-sm text-sm"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}

                          <span 
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              isInactive ? 'bg-slate-400' : 'bg-emerald-500'
                            }`}
                            title={isInactive ? 'Inactivo' : 'Activo'}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                              {member.name}
                            </h3>
                            {isInactive && (
                              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                                Baja
                              </span>
                            )}
                          </div>

                          <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5 font-medium">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            {member.role || 'Enlace Hospitalario'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenMemberModal(member)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Editar datos, foto o permisos de este integrante"
                      >
                        ✏️
                      </button>
                    </div>

                    {/* Email and Phone Contact Block */}
                    <div className="mt-3 space-y-1.5">
                      {member.phone && (
                        <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200 font-medium">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {member.phone}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Call Button */}
                            <a
                              href={`tel:${member.phone.replace(/\s+/g, '')}`}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1 text-[11px] font-bold"
                              title={`Llamar a ${member.name}`}
                            >
                              📞 <span className="hidden sm:inline">Llamar</span>
                            </a>

                            {/* WhatsApp Button */}
                            {phoneDigits && (
                              <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1 text-[11px] font-bold"
                                title={`Enviar mensaje de WhatsApp a ${member.name}`}
                              >
                                💬 <span className="hidden sm:inline">WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {member.email && (
                        <p className="text-[11px] text-slate-500 px-2 truncate">
                          ✉️ {member.email}
                        </p>
                      )}
                    </div>

                    {/* Assigned Congregations List */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-700">
                          Territorios Asignados ({memberCongs.length})
                        </span>
                        <span className="text-[11px] text-sky-600 font-semibold">
                          Zona 3
                        </span>
                      </div>

                      {memberCongs.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {memberCongs.map(c => (
                            <div 
                              key={c.number}
                              className="bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200/60 flex items-center justify-between gap-2 text-xs transition-colors"
                            >
                              <div className="truncate">
                                <span className="font-bold text-slate-900 mr-1.5">#{c.number}</span>
                                <span className="text-slate-700 font-medium truncate">{c.name}</span>
                              </div>

                              <button
                                onClick={() => assignCongregationToMember(c.number, undefined)}
                                className="text-slate-400 hover:text-red-500 text-xs shrink-0 px-1"
                                title="Desasignar de este integrante"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          Sin congregaciones asignadas aún.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Estatus del Integrante</span>
                    <span className="font-bold" style={{ color: isInactive ? '#64748b' : member.color }}>
                      {isInactive ? 'Dado de Baja' : `${memberCongs.length} Zonas de Búsqueda`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CEH Member Register/Edit Modal */}
      <CEHMemberModal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        memberToEdit={memberToEdit}
      />
    </div>
  );
};
