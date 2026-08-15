import React from 'react';

interface CEHMemberWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberData: any;
}

export const CEHMemberWorksheetModal: React.FC<CEHMemberWorksheetModalProps> = ({ isOpen, onClose, memberData }) => {
  if (!isOpen) return null;

  const handleDescargarPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('hoja-trabajo-content');
    
    if (!element) {
      alert('Error: No se encontró el contenido del reporte.');
      return;
    }

    const opt = {
      margin:       10,
      filename:     `Hoja_Trabajo_${memberData?.nombre || 'Miembro'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-slate-900 rounded-xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] border border-slate-800">
        
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl">
          <h3 className="font-bold text-slate-200">Visualización de Informe</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDescargarPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
            >
              Descargar PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 px-2">
              Cerrar
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-900 flex-1">
          <div id="hoja-trabajo-content" className="bg-white p-10 shadow-lg mx-auto max-w-[215mm] min-h-[279mm] text-slate-900 rounded-sm">
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <h2 className="text-xl font-bold uppercase tracking-wider">Comité de Enlace con Hospitales</h2>
              <p className="text-sm font-semibold text-slate-600">Zona 3 — Monterrey, N.L.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Asignado a:</h4>
                <p className="text-lg font-bold text-slate-900">{memberData?.nombre || 'Nombre del Integrante'}</p>
                <p className="text-sm text-slate-600">{memberData?.email || 'correo@ejemplo.com'}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
