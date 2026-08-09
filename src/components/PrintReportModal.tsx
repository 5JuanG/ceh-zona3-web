import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Specialty } from '../types';
import { X, Printer, Download, Copy, Check, Stethoscope, Building2 } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ isOpen, onClose }) => {
  const { doctors, hospitals } = useApp();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('todas');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const specialtiesList = Array.from(new Set(doctors.map(d => d.specialty))).sort();

  const filteredDoctors = doctors.filter(doc => {
    if (selectedSpecialty !== 'todas' && doc.specialty !== selectedSpecialty) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let reportText = `LISTADO DE MÉDICOS COLABORADORES Y CONSULTORES - COMITÉ DE ENLACE HOSPITALARIO\n`;
    reportText += `Fecha: ${new Date().toLocaleDateString()}\n`;
    reportText += `=========================================================================\n\n`;

    filteredDoctors.forEach((doc, idx) => {
      const hospitalNames = doc.hospitalIds
        .map(hId => hospitals.find(h => h.id === hId)?.name)
        .filter(Boolean)
        .join(', ');

      reportText += `${idx + 1}. ${doc.title} ${doc.name} - [${doc.type.toUpperCase()}]\n`;
      reportText += `   Especialidad: ${doc.specialty} ${doc.subSpecialty ? `(${doc.subSpecialty})` : ''}\n`;
      reportText += `   Hospitales: ${hospitalNames || 'Sin hospital asignado'}\n`;
      reportText += `   Teléfono Móvil: ${doc.phoneMobile || 'N/A'}\n`;
      reportText += `   Tel. Hospital/Ext: ${doc.phoneExtension || doc.phoneHospital || 'N/A'}\n`;
      reportText += `   Estado: ${doc.status} | Horario: ${doc.preferredContactHour || 'No especificado'}\n`;
      if (doc.notes) reportText += `   Notas: ${doc.notes}\n`;
      reportText += `-------------------------------------------------------------------------\n`;
    });

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto print:max-w-none print:shadow-none print:border-none print:m-0 print:w-full">
        
        {/* Header - Hidden on Print */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base">
              Generar Reporte Imprimible de Médicos
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls - Hidden on Print */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Filtrar Especialidad:</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg p-1.5 font-medium text-slate-800"
            >
              <option value="todas">Todas las Especialidades ({doctors.length})</option>
              {specialtiesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Copiado al portapapeles!' : 'Copiar Texto'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 text-xs">
          
          {/* Document Header */}
          <div className="text-center border-b border-slate-300 pb-4 space-y-1">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
              Comité de Enlace con Hospitales (CEH)
            </h2>
            <h3 className="text-sm font-semibold text-teal-800">
              Directorio Oficial de Médicos Colaboradores y Consultores
            </h3>
            <p className="text-[11px] text-slate-500">
              Generado el: {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Table / List View */}
          <div className="space-y-4">
            {filteredDoctors.map((doc, idx) => {
              const hospitalNames = doc.hospitalIds
                .map(hId => hospitals.find(h => h.id === hId)?.name)
                .filter(Boolean)
                .join(', ');

              return (
                <div key={doc.id} className="p-3 border border-slate-200 rounded-lg space-y-1 bg-slate-50/50 print:bg-white print:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {idx + 1}. {doc.title} {doc.name}
                    </span>
                    <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                      {doc.type === 'colaborador' ? 'Colaborador' : doc.type === 'consultor' ? 'Consultor' : 'Admin'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                    <div>
                      <strong>Especialidad:</strong> {doc.specialty} {doc.subSpecialty && `(${doc.subSpecialty})`}
                    </div>
                    <div>
                      <strong>Hospitales:</strong> {hospitalNames || 'Sin hospital asignado'}
                    </div>
                    <div>
                      <strong>Móvil / WhatsApp:</strong> {doc.phoneMobile || 'N/A'}
                    </div>
                    <div>
                      <strong>Extensión / Directo:</strong> {doc.phoneExtension || doc.phoneHospital || 'N/A'}
                    </div>
                  </div>

                  {doc.preferredContactHour && (
                    <div className="text-[10px] text-slate-500">
                      <strong>Horario preferido:</strong> {doc.preferredContactHour}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
