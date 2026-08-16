import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { InteractiveMap } from './InteractiveMap';

interface CEHMemberWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId: string | null;
}

export const CEHMemberWorksheetModal: React.FC<CEHMemberWorksheetModalProps> = ({ isOpen, onClose, initialMemberId }) => {
  const { cehMembers } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialMemberId) {
        setSelectedMemberId(initialMemberId);
      } else if (cehMembers && cehMembers.length > 0) {
        setSelectedMemberId(cehMembers[0].id || cehMembers[0].email || '');
      }
    }
  }, [isOpen, initialMemberId, cehMembers]);

  if (!isOpen) return null;

  // Buscar los datos del miembro seleccionado en el selector
  const currentMemberData = cehMembers.find(
    m => (m.id === selectedMemberId || m.email === selectedMemberId)
  );

  // Descarga síncrona instantánea libre de bucles o congelamientos
  const handleDescargarPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('hoja-trabajo-content');
    
    if (!element) {
      alert('Error: No se encontró el bloque del reporte.');
      return;
    }

    const opt = {
      margin:       10,
      filename:     `Hoja_Trabajo_${currentMemberData?.nombre || 'Miembro'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto backdrop-blur-xs">
      <div className="bg-slate-900 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] border border-slate-800">
        
        {/* Cabecera del modal */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-950 rounded-t-xl gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <h3 className="font-bold text-slate-200 text-sm whitespace-nowrap">Reporte de:</h3>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-slate-800 text-slate-100 text-sm font-medium rounded-lg block w-full sm:w-64 p-2 border border-slate-700"
            >
              {cehMembers && cehMembers.length > 0 ? (
                cehMembers.map((member, idx) => (
                  <option key={idx} value={member.id || member.email}>
                    {member.nombre || member.name || member.email}
                  </option>
                ))
              ) : (
                <option value="">No hay miembros registrados</option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={handleDescargarPDF} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
            >
              Descargar PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 px-3 py-2 text-sm border border-slate-800 rounded-lg hover:bg-slate-900">
              Cerrar
            </button>
          </div>
        </div>

        {/* Bloque Imprimible */}
        <div className="p-6 overflow-y-auto bg-slate-900 flex-1">
          <div id="hoja-trabajo-content" className="bg-white p-8 shadow-lg mx-auto max-w-[215mm] min-h-[279mm] text-slate-900 rounded-sm">
            
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Comité de Enlace con Hospitales</h2>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reporte Interno de Operación y Control Territorial</p>
            </div>
            
            <div className="flex justify-between items-start bg-slate-50 p-3 rounded border border-slate-200 mb-4 text-xs">
              <div>
                <h4 className="uppercase tracking-wider text-slate-400 font-bold mb-0.5">Integrante Responsable</h4>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-blue-600 rounded-full inline-block"></span>
                  {currentMemberData?.nombre || currentMemberData?.name}
                </p>
                <p className="text-slate-500 mt-0.5">{currentMemberData?.email || ''}</p>
              </div>
              <div className="text-right">
                <h4 className="uppercase tracking-wider text-slate-400 font-bold mb-0.5">Territorio Jurisdicción</h4>
                <span className="bg-slate-900 text-white font-black px-2 py-0.5 rounded text-xs inline-block">ZONA 3</span>
              </div>
            </div>

            {/* Renderizado directo y estable del mapa de Leaflet */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5">📍 Territorio Asignado y Delimitado</h4>
              <div className="bg-slate-100 h-80 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden relative shadow-inner">
                <div className="absolute inset-0 w-full h-full">
                  <InteractiveMap 
                    onOpenHospitalModal={() => {}} 
                    onFilterDoctorsByHospital={() => {}} 
                    readOnly={true}
                    filterByMemberEmail={currentMemberData?.email}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3 border border-slate-200 rounded">
                <h5 className="font-bold text-slate-800 border-b pb-1 mb-1">🏥 Hospitales y Clínicas</h5>
                <p className="text-slate-400 italic text-[11px]">No hay centros de salud asignados en territorio.</p>
              </div>
              <div className="p-3 border border-slate-200 rounded">
                <h5 className="font-bold text-slate-800 border-b pb-1 mb-1">⚠️ Médicos Entrevistados</h5>
                <p className="text-slate-400 italic text-[11px]">Sin médicos bajo evaluación activa.</p>
              </div>
              <div className="p-3 border border-slate-200 rounded">
                <h5 className="font-bold text-slate-800 border-b pb-1 mb-1">📲 Proveedores de Salud</h5>
                <p className="text-slate-400 italic text-[11px]">Sin proveedores vinculados en la zona.</p>
              </div>
              <div className="p-3 border border-slate-200 rounded">
                <h5 className="font-bold text-slate-800 border-b pb-1 mb-1">💼 Personal Administrativo</h5>
                <p className="text-slate-400 italic text-[11px]">Sin personal de salud reportado.</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
