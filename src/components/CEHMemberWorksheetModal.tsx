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
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialMemberId) {
        setSelectedMemberId(initialMemberId);
      } else if (cehMembers && cehMembers.length > 0) {
        setSelectedMemberId(cehMembers[0].id || cehMembers[0].email || '');
      }
    }
  }, [isOpen, initialMemberId, cehMembers]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setMapLoaded(true);
        window.dispatchEvent(new Event('resize'));
      }, 600); // Tiempo óptimo para asegurar que Leaflet tome las dimensiones correctas dentro de la tarjeta
      return () => clearTimeout(timer);
    } else {
      setMapLoaded(false);
    }
  }, [isOpen, selectedMemberId]);

  if (!isOpen) return null;

  // Encontrar el miembro seleccionado actualmente
  const currentMemberData = cehMembers.find(
    m => (m.id === selectedMemberId || m.email === selectedMemberId)
  );

  const handleDescargarPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('hoja-trabajo-content');
    
    if (!element) {
      alert('Error: No se encontró el contenido del reporte.');
      return;
    }

    const opt = {
      margin:       10,
      filename:     `Hoja_Trabajo_${currentMemberData?.nombre || 'Miembro'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto backdrop-blur-xs">
      <div className="bg-slate-900 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] border border-slate-800">
        
        {/* Barra superior de control */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-950 rounded-t-xl gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <h3 className="font-bold text-slate-200 text-sm whitespace-nowrap">Reporte de:</h3>
            
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-slate-800 text-slate-100 text-sm font-medium rounded-lg block w-full sm:w-64 p-2 border border-slate-700 focus:ring-blue-500"
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
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 px-3 py-2 text-sm border border-slate-800 rounded-lg hover:bg-slate-900 transition">
              Cerrar
            </button>
          </div>
        </div>

        {/* Hoja de Trabajo Imprimible */}
        <div className="p-6 overflow-y-auto bg-slate-900 flex-1">
          <div id="hoja-trabajo-content" className="bg-white p-8 shadow-lg mx-auto max-w-[215mm] min-h-[279mm] text-slate-900 rounded-sm">
            
            {/* Encabezado Membretado */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Comité de Enlace con Hospitales</h2>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reporte Interno de Operación y Control Territorial</p>
            </div>
            
            {/* Datos del Miembro de Control */}
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
                <span className="bg-slate-900 text-white font-black px-2 py-0.5 rounded text-xs inline-block">
                  ZONA 3
                </span>
              </div>
            </div>

            {/* Espacio del Mapa Filtrado por Miembro */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                📍 Territorio Asignado y Delimitado
              </h4>
              <div className="bg-slate-100 h-80 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden relative shadow-inner">
                {mapLoaded ? (
                  <div className="absolute inset-0 w-full h-full modal-map-clean-view">
                    {/* 
                      Enviamos propiedades de control: 
                      1. readOnly evita que aparezcan botones de carga o edición.
                      2. filterByMemberEmail obliga al mapa a pintar solo los linderos de este miembro.
                    */}
                    <InteractiveMap 
                      onOpenHospitalModal={() => {}} 
                      onFilterDoctorsByHospital={() => {}} 
                      readOnly={true}
                      filterByMemberEmail={currentMemberData?.email}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
                    <p className="text-xs text-slate-400 font-medium">Renderizando mapa del territorio...</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Linderos Asignados: Congregaciones correspondientes al sector del integrante responsable.</p>
            </div>

            {/* Cuadrícula de Indicadores Operativos */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3 border border-slate-200 rounded">
                <h5 className="font-bold text-slate-800 border-b pb-1 mb-1 flex items-center gap-1">🏥 Hospitales y Clínicas</h5>
                <p className="text-slate-400 italic text-[11px]">No hay centros de salud asignados en territorio.</p>
              </div>
              <div className="p-3 border border-slate-200 rounded">
                <h5 className="font-bold text-slate-800 border-b pb-1 mb-1 flex items-center gap-1">⚠️ Médicos Entrevistados</h5>
                <p className="text-slate-400 italic text-[11px]">Sin médicos bajo evaluación activa.</p>
              </div>
              <div className="p-3 border border-slate-200 rounded">
                <h5 className="font-bold text-slate-800 border-b pb-1 mb-1 flex items-center gap-1">📲 Proveedores de Salud</h5>
                <p className="text-slate-400 italic text-[11px]">Sin proveedores vinculados en la zona.</p>
              </div>
              <div className="p-3 border border-slate-200 rounded">
                <h5 className="font-bold text-slate-800 border-b pb-1 mb-1 flex items-center gap-1">💼 Personal Administrativo</h5>
                <p className="text-slate-400 italic text-[11px]">Sin personal de salud reportado.</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
