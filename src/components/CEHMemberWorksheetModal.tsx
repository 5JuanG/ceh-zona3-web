import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { InteractiveMap } from './InteractiveMap';
import { Users, X } from 'lucide-react';

interface CEHMemberWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId: string | null;
}

export const CEHMemberWorksheetModal: React.FC<CEHMemberWorksheetModalProps> = ({ isOpen, onClose, initialMemberId }) => {
  const { doctors, hospitals, cehMembers, congregations } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId);

  useEffect(() => {
    if (isOpen) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId, isOpen]);

  if (!isOpen) return null;

  const miembroActivo = cehMembers ? cehMembers.find(m => m.id === selectedMemberId) : null;
  const zonaAsignadaRaw = miembroActivo?.zone || miembroActivo?.zona || "Zona 3";
  const zonaAsignadaClean = zonaAsignadaRaw.toLowerCase().replace(/\s+/g, '');
  const correoMiembro = miembroActivo?.email || "";
  const colorMiembro = miembroActivo?.color || "#22c55e";
  const listaCongregacionesIds = miembroActivo?.assignedCongregationIds || [];
  const listaCongregaciones = listaCongregacionesIds.map(num => {
    const cong = congregations?.find(c => c.number === num);
    return cong ? cong.name : num;
  });

  const hospitalesClinicas = hospitals ? hospitals.filter(h =>
    (h.zone || '').toLowerCase().replace(/\s+/g, '') === zonaAsignadaClean
  ) : [];

  const medicosEntrevistados = doctors ? doctors.filter(d =>
    (d.zone || '').toLowerCase().replace(/\s+/g, '') === zonaAsignadaClean &&
    (d.type === 'prospecto' || d.notes?.toLowerCase().includes('entrevista'))
  ) : [];

  const proveedoresSalud = hospitals ? hospitals.filter(h =>
    (h.zone || '').toLowerCase().replace(/\s+/g, '') === zonaAsignadaClean &&
    (h.name?.toLowerCase().includes('proveedor') || h.notes?.toLowerCase().includes('proveedor'))
  ) : [];

  const personalAdministrativo = cehMembers ? cehMembers.filter(m =>
    (m.zone || m.zona || '').toLowerCase().replace(/\s+/g, '') === zonaAsignadaClean &&
    (m.role?.toLowerCase().includes('admin') || m.role?.toLowerCase().includes('secretario'))
  ) : [];

  const handleDescargarPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('hoja-trabajo-content');
    if (!element) return alert('Error: No se encontró el contenedor de la hoja de trabajo.');

    const opt = {
      margin: 8,
      filename: `Hoja_Trabajo_${zonaAsignadaRaw.replace(/\s+/g, '_')}_${miembroActivo?.name?.replace(/\s+/g, '_') || 'Miembro'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="bg-slate-900 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col h-[94vh] border border-slate-800">

        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-300">Reporte de:</span>
            <select
              value={selectedMemberId || ''}
              onChange={(e) => setSelectedMemberId(e.target.value || null)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none font-semibold focus:ring-1 focus:ring-sky-500"
            >
              <option value="">-- Seleccionar Integrante --</option>
              {cehMembers && cehMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name || m.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDescargarPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all">Descargar PDF</button>
            <button onClick={onClose} className="text-slate-400 hover:text-white px-2 text-xs font-medium border border-slate-700 rounded-lg py-1.5 bg-slate-800 cursor-pointer">Cerrar</button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto bg-slate-950 flex-1 flex justify-center">
          <div
            id="hoja-trabajo-content"
            className="bg-white shadow-2xl w-full max-w-[215mm] text-slate-900 rounded-sm font-sans"
          >
            {/* ===================== PÁGINA 1: Encabezado + Mapa a toda la hoja ===================== */}
            <div className="p-8 flex flex-col" style={{ minHeight: '260mm' }}>
              <div className="text-center border-b-2 border-slate-900 pb-2">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Comité de Enlace con Hospitales</h2>
                <p className="text-xs font-bold text-slate-500 tracking-tight">Reporte Interno de Operación y Control Territorial</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs mt-4">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Integrante Responsable</span>
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: colorMiembro }} />
                    {miembroActivo?.name || miembroActivo?.nombre || 'Selecciona un miembro del CEH arriba'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Territorio Jurisdicción</span>
                  <span className="inline-block bg-slate-900 text-white font-extrabold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">{zonaAsignadaRaw}</span>
                </div>
              </div>

              <div className="space-y-1.5 mt-4 flex-1 flex flex-col">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">📍 Territorio Delimitado por Congregaciones</h4>
                <div className="w-full rounded-xl border border-gray-200 bg-white p-1 overflow-hidden isolate relative flex-1" style={{ minHeight: '190mm' }}>
                  {correoMiembro ? (
                    <div className="w-full h-full absolute inset-0 overflow-hidden">
                      <InteractiveMap
                        onOpenHospitalModal={() => {}}
                        onFilterDoctorsByHospital={() => {}}
                        readOnly={true}
                        filterByMemberEmail={correoMiembro}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic bg-slate-50">
                      Selecciona un miembro arriba para proyectar su mapa de linderos.
                    </div>
                  )}
                </div>
                {listaCongregaciones.length > 0 && (
                  <div className="text-[10px] text-slate-500 font-medium leading-tight max-h-16 overflow-y-auto">
                    <strong>Congregaciones Asignadas ({listaCongregaciones.length}):</strong> {listaCongregaciones.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Salto de página para la exportación a PDF (html2pdf detecta esta clase automáticamente) */}
            <div className="html2pdf__page-break" />

            {/* ===================== PÁGINA 2: Los 4 campos de control ===================== */}
            <div className="p-8 flex flex-col" style={{ minHeight: '260mm' }}>
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-4">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Detalle de Contactos y Personal</h2>
                <p className="text-xs font-bold text-slate-500 tracking-tight">{miembroActivo?.name || miembroActivo?.nombre || ''} — {zonaAsignadaRaw}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs flex-1">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col">
                  <h5 className="font-bold text-slate-900 border-b pb-1.5 mb-2 text-sm">🏢 Hospitales y Clínicas ({hospitalesClinicas.length})</h5>
                  <ul className="space-y-1.5 overflow-y-auto flex-1">
                    {hospitalesClinicas.length === 0 ? <li className="text-slate-400 italic text-[11px]">No hay centros de salud asignados en territorio.</li> :
                      hospitalesClinicas.map(h => <li key={h.id} className="bg-white px-2 py-1 rounded border border-slate-200 font-medium text-slate-800">{h.name}</li>)
                    }
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col">
                  <h5 className="font-bold text-amber-800 border-b pb-1.5 mb-2 text-sm">⚠️ Médicos Entrevistados ({medicosEntrevistados.length})</h5>
                  <ul className="space-y-1.5 overflow-y-auto flex-1">
                    {medicosEntrevistados.length === 0 ? <li className="text-slate-400 italic text-[11px]">Sin médicos bajo evaluación activa.</li> :
                      medicosEntrevistados.map(m => <li key={m.id} className="bg-amber-50/40 px-2 py-1 rounded border border-amber-200 text-slate-900"><span className="font-bold">{m.name || m.nombre}</span> — {m.specialty}</li>)
                    }
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col">
                  <h5 className="font-bold text-sky-800 border-b pb-1.5 mb-2 text-sm">🏥 Proveedores de Salud ({proveedoresSalud.length})</h5>
                  <ul className="space-y-1.5 overflow-y-auto flex-1">
                    {proveedoresSalud.length === 0 ? <li className="text-slate-400 italic text-[11px]">Sin proveedores de salud asignados en la zona.</li> :
                      proveedoresSalud.map(p => <li key={p.id} className="bg-sky-50/40 px-2 py-1 rounded border border-sky-200 text-slate-800">{p.name}</li>)
                    }
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col">
                  <h5 className="font-bold text-purple-800 border-b pb-1.5 mb-2 text-sm">💼 Personal Administrativo ({personalAdministrativo.length})</h5>
                  <ul className="space-y-1.5 overflow-y-auto flex-1">
                    {personalAdministrativo.length === 0 ? <li className="text-slate-400 italic text-[11px]">Sin personal de salud reportado.</li> :
                      personalAdministrativo.map(a => <li key={a.id} className="bg-purple-50/40 px-2 py-1 rounded border border-purple-200 text-slate-800"><span className="font-bold">{a.name || a.nombre}</span> — <span className="text-[10px] font-bold">{a.role || a.rol}</span></li>)
                    }
                  </ul>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 border-t pt-2 mt-4">
                Información de uso confidencial exclusivo para las actividades de control del CEH. Reporte de la Zona 3.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
