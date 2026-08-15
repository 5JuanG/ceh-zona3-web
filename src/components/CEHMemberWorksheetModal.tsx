import React from 'react';

interface CEHMemberWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId: string | null;
}

export const CEHMemberWorksheetModal: React.FC<CEHMemberWorksheetModalProps> = ({ isOpen, onClose, initialMemberId }) => {
  if (!isOpen) return null;

  const handleDescargarPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('hoja-trabajo-content');
    
    if (!element) {
      alert('Error: No se encontró el contenedor de la hoja de trabajo.');
      return;
    }

    const opt = {
      margin:       10,
      filename:     `Hoja_Trabajo_CEH_${initialMemberId || 'Miembro'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-slate-900 rounded-xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] border border-slate-800">
        
        {/* Encabezado con Botón Verde de Descarga */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl">
          <h3 className="font-bold text-slate-200">Hoja de Trabajo Individual</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDescargarPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
            >
              Descargar PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 px-2 text-sm">
              Cerrar
            </button>
          </div>
        </div>

        {/* Contenido Imprimible Formato Carta */}
        <div className="p-6 overflow-y-auto bg-slate-900 flex-1">
          <div id="hoja-trabajo-content" className="bg-white p-10 shadow-lg mx-auto max-w-[215mm] min-h-[279mm] text-slate-900 rounded-sm">
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <h2 className="text-xl font-bold uppercase tracking-wider">Comité de Enlace con Hospitales</h2>
              <p className="text-sm font-semibold text-slate-600">Zona 3 — Monterrey, N.L.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">ID del Miembro de Control:</h4>
                <p className="text-lg font-bold text-slate-900">{initialMemberId || 'General / Todo el Comité'}</p>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Asignaciones Hospitalarias Recientes:</h4>
                <p className="text-sm text-gray-500 italic">Reporte de visitas y médicos colaboradores validados por la sucursal.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
