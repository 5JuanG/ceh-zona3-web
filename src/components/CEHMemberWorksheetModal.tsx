import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StaticTerritoryMap } from './StaticTerritoryMap';
import { Users, X } from 'lucide-react';

interface CEHMemberWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId: string | null;
}

export const CEHMemberWorksheetModal: React.FC<CEHMemberWorksheetModalProps> = ({ isOpen, onClose, initialMemberId }) => {
  const { doctors, hospitals, cehMembers, congregations } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId, isOpen]);

  if (!isOpen) return null;

  const miembroActivo = cehMembers ? cehMembers.find(m => m.id === selectedMemberId) : null;
  const zonaAsignadaRaw = miembroActivo?.zone || miembroActivo?.zona || "Zona 3";
  const zonaAsignadaClean = zonaAsignadaRaw.toLowerCase().replace(/\s+/g, '');
  const colorMiembro = miembroActivo?.color || "#22c55e";
  const listaCongregacionesIds = miembroActivo?.assignedCongregationIds || [];
  const listaCongregaciones = listaCongregacionesIds.map(num => {
    const cong = congregations?.find(c => c.number === num);
    return cong ? cong.name : num;
  });

  // Un hospital/contacto pertenece a este integrante si:
  // 1) fue asignado explícitamente a él (assignedCEHMemberId), o
  // 2) está ubicado en una de sus congregaciones asignadas, o
  // 3) (compatibilidad con datos antiguos) su "zona" de texto coincide.
  const perteneceAMiembro = (registro: { assignedCEHMemberId?: string; congregationNumber?: string; zone?: string }) => {
    if (!selectedMemberId) return false;
    if (registro.assignedCEHMemberId) return registro.assignedCEHMemberId === selectedMemberId;
    if (registro.congregationNumber) return listaCongregacionesIds.includes(registro.congregationNumber);
    return (registro.zone || '').toLowerCase().replace(/\s+/g, '') === zonaAsignadaClean;
  };

  const hospitalesClinicas = hospitals ? hospitals.filter(perteneceAMiembro) : [];

  const idsHospitalesDelMiembro = new Set(hospitalesClinicas.map(h => h.id));

  // Un médico/contacto pertenece a este integrante si fue asignado directamente
  // a él, o si está vinculado a alguno de los hospitales que sí le pertenecen.
  const perteneceDoctorAMiembro = (d: { assignedCEHMemberId?: string; hospitalIds?: string[] }) => {
    if (!selectedMemberId) return false;
    if (d.assignedCEHMemberId) return d.assignedCEHMemberId === selectedMemberId;
    return (d.hospitalIds || []).some(hid => idsHospitalesDelMiembro.has(hid));
  };

  const medicosColaboradores = doctors ? doctors.filter(d =>
    perteneceDoctorAMiembro(d) && (d.type === 'colaborador' || d.type === 'consultor' || !d.type)
  ) : [];

  const proveedoresSalud = doctors ? doctors.filter(d =>
    perteneceDoctorAMiembro(d) && d.type === 'proveedor_salud'
  ) : [];

  const personalAdministrativoDoctores = doctors ? doctors.filter(d =>
    perteneceDoctorAMiembro(d) && d.type === 'contacto_administrativo'
  ) : [];

  const personalAdministrativoCEH = cehMembers ? cehMembers.filter(m =>
    m.id !== selectedMemberId &&
    (m.role?.toLowerCase().includes('admin') || m.role?.toLowerCase().includes('secretario')) &&
    (m.assignedCongregationIds || []).some(id => listaCongregacionesIds.includes(id))
  ) : [];

  const handleDescargarPDF = async () => {
    if (generandoPDF) return;
    const pagina1 = document.getElementById('hoja-trabajo-pagina-1');
    const pagina2 = document.getElementById('hoja-trabajo-pagina-2');
    if (!pagina1 || !pagina2) return alert('Error: No se encontró el contenedor de la hoja de trabajo.');

    setGenerandoPDF(true);
    try {
      // Usamos html2canvas-pro (no el html2canvas clásico que trae html2pdf.js)
      // porque Tailwind v4 genera colores en formato oklch(), y la versión
      // clásica de html2canvas no sabe interpretarlos: eso es lo que
      // provocaba el error y el congelamiento al generar el PDF.
      const { default: html2canvas } = await import('html2canvas-pro');
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const agregarPaginaAlPDF = async (elemento: HTMLElement, esPrimera: boolean) => {
        const canvas = await html2canvas(elemento, {
          scale: 1.5,
          backgroundColor: '#ffffff',
          useCORS: false,
          logging: false
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgHeightMM = (canvas.height * pageWidth) / canvas.width;

        if (!esPrimera) pdf.addPage();

        if (imgHeightMM <= pageHeight) {
          pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeightMM);
        } else {
          // Si el contenido resultó más alto que una hoja carta, lo
          // escalamos para que quepa completo en una sola página.
          const factor = pageHeight / imgHeightMM;
          pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth * factor, pageHeight);
        }
      };

      await agregarPaginaAlPDF(pagina1, true);
      await agregarPaginaAlPDF(pagina2, false);

      const filename = `Hoja_Trabajo_${zonaAsignadaRaw.replace(/\s+/g, '_')}_${miembroActivo?.name?.replace(/\s+/g, '_') || 'Miembro'}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Error generando el PDF de la Hoja de Trabajo:', err);
      alert('Ocurrió un error al generar el PDF. Intenta de nuevo; si el problema persiste, recarga la página.');
    } finally {
      setGenerandoPDF(false);
    }
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
            <button
              onClick={handleDescargarPDF}
              disabled={generandoPDF}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
            >
              {generandoPDF ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white px-2 text-xs font-medium border border-slate-700 rounded-lg py-1.5 bg-slate-800 cursor-pointer">Cerrar</button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto bg-slate-950 flex-1 flex justify-center">
          <div
            id="hoja-trabajo-content"
            className="bg-white shadow-2xl w-full max-w-[215mm] text-slate-900 rounded-sm font-sans"
          >
            {/* ===================== PÁGINA 1: Encabezado + Mapa a toda la hoja ===================== */}
            <div id="hoja-trabajo-pagina-1" className="p-8 flex flex-col" style={{ minHeight: '260mm' }}>
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

              <div className="space-y-1.5 mt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">📍 Territorio Delimitado por Congregaciones</h4>
                <div className="w-full rounded-xl border border-gray-200 bg-white p-1 overflow-hidden isolate relative" style={{ height: '480px' }}>
                  {selectedMemberId ? (
                    <StaticTerritoryMap
                      congregationIds={listaCongregacionesIds}
                      color={colorMiembro}
                      allCongregations={congregations}
                    />
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

            {/* Salto de página para la exportación a PDF */}

            {/* ===================== PÁGINA 2: Los 4 campos de control ===================== */}
            <div id="hoja-trabajo-pagina-2" className="p-8 flex flex-col" style={{ minHeight: '260mm' }}>
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-4">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Detalle de Contactos y Personal</h2>
                <p className="text-xs font-bold text-slate-500 tracking-tight">{miembroActivo?.name || miembroActivo?.nombre || ''} — {zonaAsignadaRaw}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs flex-1">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col">
                  <h5 className="font-bold text-slate-900 border-b pb-1.5 mb-2 text-sm">🏢 Hospitales y Clínicas ({hospitalesClinicas.length})</h5>
                  <ul className="space-y-2 overflow-y-auto flex-1">
                    {hospitalesClinicas.length === 0 ? <li className="text-slate-400 italic text-[11px]">No hay centros de salud asignados en territorio.</li> :
                      hospitalesClinicas.map(h => (
                        <li key={h.id} className="bg-white px-2.5 py-1.5 rounded border border-slate-200">
                          <span className="font-bold text-slate-800">{h.name}</span>
                          <p className="text-[10.5px] text-slate-600 leading-snug mt-0.5">
                            {h.notes && h.notes.trim() ? h.notes : <span className="italic text-slate-400">Sin reseña registrada aún.</span>}
                          </p>
                        </li>
                      ))
                    }
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col">
                  <h5 className="font-bold text-amber-800 border-b pb-1.5 mb-2 text-sm">⚕️ Médicos Colaboradores / Consultores ({medicosColaboradores.length})</h5>
                  <ul className="space-y-2 overflow-y-auto flex-1">
                    {medicosColaboradores.length === 0 ? <li className="text-slate-400 italic text-[11px]">Sin médicos colaboradores o consultores en territorio.</li> :
                      medicosColaboradores.map(m => (
                        <li key={m.id} className="bg-amber-50/40 px-2.5 py-1.5 rounded border border-amber-200">
                          <span className="font-bold text-slate-900">{m.name || m.nombre}</span> <span className="text-[10px] font-semibold text-amber-700">— {m.specialty}</span>
                          <p className="text-[10.5px] text-slate-600 leading-snug mt-0.5">
                            {m.notes && m.notes.trim() ? m.notes : <span className="italic text-slate-400">Sin reseña registrada aún.</span>}
                          </p>
                        </li>
                      ))
                    }
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col">
                  <h5 className="font-bold text-sky-800 border-b pb-1.5 mb-2 text-sm">🏥 Proveedores de Salud ({proveedoresSalud.length})</h5>
                  <ul className="space-y-2 overflow-y-auto flex-1">
                    {proveedoresSalud.length === 0 ? <li className="text-slate-400 italic text-[11px]">Sin proveedores de salud de interés registrados en la zona.</li> :
                      proveedoresSalud.map(p => (
                        <li key={p.id} className="bg-sky-50/40 px-2.5 py-1.5 rounded border border-sky-200">
                          <span className="font-bold text-slate-800">{p.name || p.nombre}</span> <span className="text-[10px] font-semibold text-sky-700">— {p.specialty}</span>
                          <p className="text-[10.5px] text-slate-600 leading-snug mt-0.5">
                            {p.notes && p.notes.trim() ? p.notes : <span className="italic text-slate-400">Sin reseña registrada aún.</span>}
                          </p>
                        </li>
                      ))
                    }
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col">
                  <h5 className="font-bold text-purple-800 border-b pb-1.5 mb-2 text-sm">💼 Personal Administrativo ({personalAdministrativoDoctores.length + personalAdministrativoCEH.length})</h5>
                  <ul className="space-y-2 overflow-y-auto flex-1">
                    {(personalAdministrativoDoctores.length + personalAdministrativoCEH.length) === 0 ? <li className="text-slate-400 italic text-[11px]">Sin personal administrativo reportado.</li> : <>
                      {personalAdministrativoDoctores.map(a => (
                        <li key={a.id} className="bg-purple-50/40 px-2.5 py-1.5 rounded border border-purple-200">
                          <span className="font-bold text-slate-800">{a.name || a.nombre}</span>
                          <p className="text-[10.5px] text-slate-600 leading-snug mt-0.5">
                            {a.notes && a.notes.trim() ? a.notes : <span className="italic text-slate-400">Sin reseña registrada aún.</span>}
                          </p>
                        </li>
                      ))}
                      {personalAdministrativoCEH.map(a => (
                        <li key={a.id} className="bg-purple-50/40 px-2.5 py-1.5 rounded border border-purple-200">
                          <span className="font-bold text-slate-800">{a.name || a.nombre}</span> <span className="text-[10px] font-bold text-purple-700">— {a.role || a.rol}</span>
                        </li>
                      ))}
                    </>}
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
