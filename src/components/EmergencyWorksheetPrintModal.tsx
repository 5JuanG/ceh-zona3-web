import React from 'react';
import { EmergencyWorksheet } from '../types';
import { X, Printer, Download } from 'lucide-react';

interface EmergencyWorksheetPrintModalProps {
  worksheet: EmergencyWorksheet;
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyWorksheetPrintModal: React.FC<EmergencyWorksheetPrintModalProps> = ({
  worksheet,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-slate-900/80 backdrop-blur-sm overflow-y-auto overflow-x-hidden p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* Action Bar (hidden when printing) */}
      <div className="w-full max-w-4xl bg-slate-900 text-white rounded-t-xl p-4 flex items-center justify-between shadow-lg border-b border-slate-700 print:hidden sticky top-2 z-20">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded uppercase">hlc-7-S</span>
          <h3 className="font-bold text-sm sm:text-base text-white">
            Vista Previa de Impresión / PDF — Hoja de Trabajo para Emergencias Médicas
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar como PDF
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div id="printable-worksheet" className="w-full max-w-[800px] bg-white text-black p-6 sm:p-8 rounded-b-xl shadow-2xl border border-slate-300 font-sans text-[11px] leading-tight space-y-4 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:rounded-none">
        
        {/* CSS for print media */}
        <style>{`
          @media print {
            body { background: white !important; color: black !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print\\:hidden { display: none !important; }
            .page-break { page-break-before: always; }
            #printable-worksheet { width: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
          }
        `}</style>

        {/* ================= PAGE 1 ================= */}
        <div className="space-y-2 border border-slate-800 p-1 flex flex-col justify-between min-h-[950px]">
          <div className="space-y-2">
            
            {/* Top Header Title */}
            <div className="pb-1 pt-0.5 text-center">
              <h1 className="text-center text-sm sm:text-base font-black uppercase tracking-wider text-slate-950">
                HOJA DE TRABAJO PARA EMERGENCIAS MÉDICAS
              </h1>
            </div>

          {/* 1. NOTIFICACIÓN */}
          <div className="border border-slate-800">
            <div className="bg-[#cbd2a4] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              NOTIFICACIÓN
            </div>
            <div className="grid grid-cols-12 text-[10.5px]">
              <div className="col-span-4 p-1 border-r border-b border-slate-800">
                <span className="font-semibold">Fecha/Hora de la llamada:</span>
                <div className="font-medium text-slate-900 mt-0.5">{worksheet.callDateTime || '—'}</div>
              </div>
              <div className="col-span-4 p-1 border-r border-b border-slate-800">
                <span className="font-semibold">Persona que llamó:</span>
                <div className="font-medium text-slate-900 mt-0.5">{worksheet.callerName || '—'}</div>
              </div>
              <div className="col-span-4 p-1 border-b border-slate-800">
                <span className="font-semibold">Información de contacto de quien llamó:</span>
                <div className="font-medium text-slate-900 mt-0.5">{worksheet.callerContactInfo || '—'}</div>
              </div>

              <div className="col-span-6 p-1 border-r border-slate-800 flex items-center gap-1.5">
                <span className="font-bold border border-slate-800 w-3.5 h-3.5 inline-flex items-center justify-center text-[10px]">
                  {worksheet.patientRequestsHlcHelp ? '✓' : ''}
                </span>
                <span className="font-semibold">Paciente solicita ayuda del HLC / CEH</span>
              </div>
              <div className="col-span-6 p-1">
                <span className="font-semibold">Relación con el paciente:</span> {worksheet.relationshipToPatient || '—'}
              </div>
            </div>
          </div>

          {/* 2. INFORMACIÓN SOBRE EL PACIENTE/HOSPITAL */}
          <div className="border border-slate-800">
            <div className="bg-[#cbd2a4] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              INFORMACIÓN SOBRE EL PACIENTE/HOSPITAL
            </div>
            
            <div className="grid grid-cols-12 text-[10.5px]">
              {/* Left Patient Column */}
              <div className="col-span-6 border-r border-slate-800">
                <div className="p-1 border-b border-slate-800 flex justify-between">
                  <div><span className="font-semibold">Nombre del paciente:</span> <strong className="text-slate-900">{worksheet.patientName || '—'}</strong></div>
                  <div><span className="font-semibold">Sexo:</span> {worksheet.gender || '—'}</div>
                </div>

                <div className="p-1 border-b border-slate-800 grid grid-cols-2 gap-1">
                  <div><span className="font-semibold">Edad:</span> {worksheet.age || '—'}</div>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="border border-slate-800 w-3 h-3 inline-flex items-center justify-center font-bold">
                        {worksheet.isBaptized ? '✓' : ''}
                      </span>
                      <span>¿Bautizado?</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="border border-slate-800 w-3 h-3 inline-flex items-center justify-center font-bold">
                        {worksheet.hasGoodReputation ? '✓' : ''}
                      </span>
                      <span>¿Buena reputación?</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="border border-slate-800 w-3 h-3 inline-flex items-center justify-center font-bold">
                        {worksheet.hasDpaCompleted ? '✓' : ''}
                      </span>
                      <span>¿DPA completa?</span>
                    </div>
                  </div>
                </div>

                <div className="p-1 border-b border-slate-800 min-h-[30px]">
                  <span className="font-semibold">Comentarios:</span>
                  <div className="whitespace-pre-wrap text-[10px] text-slate-800">{worksheet.patientComments || '—'}</div>
                </div>
              </div>

              {/* Right Minor / Newborn Column */}
              <div className="col-span-6">
                <div className="bg-slate-200 text-[10px] font-semibold italic p-1 border-b border-slate-800 text-slate-800">
                  Si el paciente es un menor o recién nacido, llene también esta sección.
                </div>

                <div className="p-1 border-b border-slate-800 flex justify-between items-center text-[10px]">
                  <div><span className="font-semibold">Nombre del padre:</span> {worksheet.fatherName || '—'}</div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="border border-slate-800 w-3 h-3 inline-flex items-center justify-center font-bold">
                      {worksheet.fatherBaptized ? '✓' : ''}
                    </span>
                    <span>¿Bautizado?</span>
                  </div>
                </div>

                <div className="p-1 border-b border-slate-800 flex justify-between items-center text-[10px]">
                  <div><span className="font-semibold">Nombre de la madre:</span> {worksheet.motherName || '—'}</div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="border border-slate-800 w-3 h-3 inline-flex items-center justify-center font-bold">
                      {worksheet.motherBaptized ? '✓' : ''}
                    </span>
                    <span>¿Bautizada?</span>
                  </div>
                </div>

                <div className="p-1 min-h-[25px]">
                  <span className="font-semibold">Comentarios (situación familiar, reputación, etc.):</span>
                  <div className="whitespace-pre-wrap text-[10px] text-slate-800">{worksheet.familyComments || '—'}</div>
                </div>
              </div>

              {/* Hospital & Elder Info Row */}
              <div className="col-span-12 border-t border-slate-800 grid grid-cols-12">
                <div className="col-span-6 p-1 border-r border-b border-slate-800">
                  <span className="font-semibold">Nombre del hospital:</span> <strong className="text-slate-900">{worksheet.hospitalName || '—'}</strong>
                </div>
                <div className="col-span-6 p-1 border-b border-slate-800 bg-slate-100 font-bold text-center">
                  Recién nacidos
                </div>

                <div className="col-span-3 p-1 border-r border-b border-slate-800">
                  <span className="font-semibold">Habitación:</span> {worksheet.roomNumber || '—'}
                </div>
                <div className="col-span-3 p-1 border-r border-b border-slate-800">
                  <span className="font-semibold">Teléfono:</span> {worksheet.hospitalPhone || '—'}
                </div>
                <div className="col-span-3 p-1 border-r border-b border-slate-800">
                  <span className="font-semibold">Peso al nacer:</span> {worksheet.birthWeight || '—'}
                </div>
                <div className="col-span-3 p-1 border-b border-slate-800 bg-slate-50 font-semibold text-center text-[10px]">
                  Puntuación APGAR
                </div>

                <div className="col-span-6 p-1 border-r border-b border-slate-800">
                  <span className="font-semibold">Congregación:</span> {worksheet.congregationName || '—'}
                </div>
                <div className="col-span-3 p-1 border-r border-b border-slate-800">
                  <span className="font-semibold">Edad gestacional:</span> {worksheet.gestationalAgeWeeks ? `${worksheet.gestationalAgeWeeks} sem.` : '—'}
                </div>
                <div className="col-span-3 p-1 border-b border-slate-800">
                  <span className="font-semibold">En el nacimiento:</span> {worksheet.apgarBirth || '—'}
                </div>

                <div className="col-span-6 p-1 border-r border-slate-800">
                  <span className="font-semibold">Ancianos contactados:</span> {worksheet.contactedEldersNames || '—'}
                  {worksheet.contactedEldersPhones && <div className="text-[10px] text-slate-700">Tel: {worksheet.contactedEldersPhones}</div>}
                </div>
                <div className="col-span-3 p-1 border-r border-slate-800">
                  <span className="font-semibold">Fecha de nacimiento:</span> {worksheet.birthDate || '—'}
                </div>
                <div className="col-span-3 p-1">
                  <span className="font-semibold">A los 5 minutos:</span> {worksheet.apgar5Min || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. INFORMACIÓN SOBRE EL PROBLEMA MÉDICO */}
          <div className="border border-slate-800">
            <div className="bg-[#cbd2a4] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              INFORMACIÓN SOBRE EL PROBLEMA MÉDICO
            </div>
            <div className="p-1.5 space-y-1.5 text-[10.5px]">
              <div>
                <span className="font-semibold">Problema específico:</span> <span className="italic text-slate-600">(¿Cuál es el diagnóstico médico? ¿Por qué se plantea la cuestión de la sangre: hemorragia, prematuro, anemia, etc.?)</span>
                <div className="whitespace-pre-wrap text-[10.5px] font-medium text-slate-900 mt-0.5 bg-slate-50 p-1 border border-slate-300 rounded">
                  {worksheet.specificProblem || '—'}
                </div>
              </div>
              <div>
                <span className="font-semibold">Historial médico relevante:</span> <span className="italic text-slate-600">(¿A qué se debe la crisis actual?)</span>
                <div className="whitespace-pre-wrap text-[10.5px] font-medium text-slate-900 mt-0.5 bg-slate-50 p-1 border border-slate-300 rounded">
                  {worksheet.relevantMedicalHistory || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. RESULTADOS DE LOS ANÁLISIS DE LABORATORIO */}
          <div className="border border-slate-800">
            <div className="bg-[#f2a770] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              RESULTADOS DE LOS ANÁLISIS DE LABORATORIO
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 text-[10px]">

              {/* Lab entries list */}
              <div className="sm:col-span-7 print:col-span-7 p-1 sm:border-r print:border-r border-b sm:border-b-0 print:border-b-0 border-slate-800 space-y-1">
                {(!worksheet.labResults || worksheet.labResults.length === 0) ? (
                  <div className="text-slate-500 italic p-2 text-center">No hay registros de laboratorio cargados.</div>
                ) : (
                  worksheet.labResults.map((lab, i) => (
                    <div key={i} className="border border-slate-400 p-1 bg-slate-50 rounded">
                      <div className="font-bold text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
                        Fecha/Hora en que se realizó: {lab.dateTime || '—'}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px]">
                        <div><span className="font-semibold">Hemoglobina (Hb g/dl):</span> <strong>{lab.hemoglobin || '—'}</strong></div>
                        <div><span className="font-semibold">Hematocrito (Hto %):</span> <strong>{lab.hematocrit || '—'}</strong></div>
                        <div><span className="font-semibold">Plaquetas (Plts /μL):</span> <strong>{lab.platelets || '—'}</strong></div>
                        <div><span className="font-semibold">Otros:</span> {lab.others || '—'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Standard Reference Table */}
              <div className="sm:col-span-5 print:col-span-5 p-1 bg-slate-50">
                <div className="text-center font-bold text-[10px] text-slate-900">Valores normales de laboratorio</div>
                <div className="text-[8.5px] italic text-center text-slate-600 mb-1">Referencia: Blood (2.ª edición). El embarazo y la edad alteran estos valores.</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[9px] border-collapse border border-slate-800 text-center">
                    <thead>
                      <tr className="bg-slate-200 font-bold">
                        <th className="border border-slate-800 p-0.5 whitespace-nowrap">Grupo</th>
                        <th className="border border-slate-800 p-0.5 whitespace-nowrap">Hemoglobina (Hb)</th>
                        <th className="border border-slate-800 p-0.5 whitespace-nowrap">Hematocrito (Hto)</th>
                        <th className="border border-slate-800 p-0.5 whitespace-nowrap">Plaquetas (Plts)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-800 p-0.5 font-semibold bg-slate-100 whitespace-nowrap">Hombres</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">13.5-18 g/dl</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">42-52%</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">150.000-450.000/μL</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-0.5 font-semibold bg-slate-100 whitespace-nowrap">Mujeres</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">12-16 g/dl</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">38-46%</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">150.000-450.000/μL</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-0.5 font-semibold bg-slate-100 whitespace-nowrap">Niños</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">11-13 g/dl</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">30-40%</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">150.000-450.000/μL</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-0.5 font-semibold bg-slate-100 whitespace-nowrap">Bebés</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">15-24 g/dl</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">55-68%</td>
                        <td className="border border-slate-800 p-0.5 whitespace-nowrap">200.000-400.000/μL</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* 5. INFORMACIÓN SOBRE EL MÉDICO */}
          <div className="border border-slate-800">
            <div className="bg-[#cbd2a4] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              INFORMACIÓN SOBRE EL MÉDICO
            </div>
            <div className="grid grid-cols-12 text-[10.5px]">
              <div className="col-span-6 p-1 border-r border-b border-slate-800">
                <span className="font-semibold">Médico a cargo:</span> <strong>{worksheet.attendingDoctor || '—'}</strong>
              </div>
              <div className="col-span-6 p-1 border-b border-slate-800">
                <span className="font-semibold">Especialidad:</span> {worksheet.attendingDoctorSpecialty || '—'}
              </div>
              <div className="col-span-6 p-1 border-r border-slate-800">
                <span className="font-semibold">Otro médico:</span> {worksheet.otherDoctor || '—'}
              </div>
              <div className="col-span-6 p-1">
                <span className="font-semibold">Especialidad:</span> {worksheet.otherDoctorSpecialty || '—'}
              </div>
            </div>
          </div>

          {/* 6. PLAN DE TRATAMIENTO DEL MÉDICO */}
          <div className="border border-slate-800">
            <div className="bg-[#cbd2a4] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              PLAN DE TRATAMIENTO DEL MÉDICO
            </div>
            <div className="p-1.5 space-y-1.5 text-[10.5px]">
              <div className="italic text-slate-600 text-[10px]">(Análisis, procedimientos o tratamientos propuestos)</div>
              <div className="whitespace-pre-wrap text-[10.5px] font-medium text-slate-900 bg-slate-50 p-1 border border-slate-300 rounded min-h-[35px]">
                {worksheet.treatmentPlan || '—'}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-300">
                <span className="border border-slate-800 w-3.5 h-3.5 inline-flex items-center justify-center font-bold text-[10px]">
                  {worksheet.medicalStaffNotifiedHlcHelp ? '✓' : ''}
                </span>
                <span className="font-semibold">¿Se ha comunicado al personal médico que el paciente ha solicitado la ayuda del HLC?</span>
              </div>
            </div>
          </div>

          {/* Bottom Legal Notice */}
          <div className="p-1 border border-slate-800 bg-slate-100 text-[9.5px]">
            <span className="font-bold">NOTA: ¿Se ha mencionado la posibilidad de acciones legales?</span>{' '}
            <span>{worksheet.legalActionMentioned ? 'SÍ' : 'NO'}</span>{' '}
            <span className="italic text-slate-700">(En ese caso, PONERSE EN CONTACTO DE INMEDIATO con la Sección de Información sobre Hospitales de la sucursal).</span>
          </div>

          </div>

          {/* PAGE 1 FOOTER (PIE DE PÁGINA) */}
          <div className="flex justify-between items-center text-[10px] text-slate-900 px-2 pt-2 border-t-2 border-slate-800 font-mono font-bold mt-3">
            <span>hlc-7-S   1/12</span>
            <span className="uppercase text-[9px] tracking-wider text-slate-700">Comité de Enlace con Hospitales</span>
            <span>1 / 2</span>
          </div>

        </div>

        {/* ================= PAGE 2 ================= */}
        <div className="page-break space-y-3 border border-slate-800 p-1 pt-2 flex flex-col justify-between min-h-[950px]">
          <div className="space-y-3">
            <div className="border-b-2 border-slate-900 pb-1 text-center">
              <h2 className="text-center text-xs font-black uppercase tracking-wider text-slate-950">
                HOJA DE TRABAJO PARA EMERGENCIAS MÉDICAS — CONTINUACIÓN
              </h2>
            </div>

          {/* 7. ESTRATEGIAS / ALTERNATIVAS */}
          <div className="border border-slate-800">
            <div className="bg-[#8faed8] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              ESTRATEGIAS/ALTERNATIVAS
            </div>
            <div className="p-1.5 space-y-1 text-[10.5px]">
              <div className="italic text-slate-600 text-[10px]">(Especificar modalidades, protocolos o técnicas para proponer a los médicos)</div>
              <div className="whitespace-pre-wrap text-[10.5px] text-slate-900 bg-slate-50 p-1.5 border border-slate-300 rounded min-h-[60px]">
                {worksheet.strategiesAndAlternatives || '—'}
              </div>
            </div>
          </div>

          {/* 8. ARTÍCULOS MÉDICOS */}
          <div className="border border-slate-800">
            <div className="bg-[#8faed8] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              ARTÍCULOS MÉDICOS
            </div>
            <div className="p-1.5 space-y-1.5 text-[10.5px]">
              <div className="italic text-slate-600 text-[10px]">(Especificar artículos que puedan entregarse al personal médico como documentación de apoyo sobre las estrategias o alternativas sugeridas)</div>
              <div className="whitespace-pre-wrap text-[10.5px] text-slate-900 bg-slate-50 p-1.5 border border-slate-300 rounded min-h-[50px]">
                {worksheet.medicalArticles || '—'}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-300">
                <span className="border border-slate-800 w-3.5 h-3.5 inline-flex items-center justify-center font-bold text-[10px]">
                  {worksheet.doctorWillingToCollabAfterArticles ? '✓' : ''}
                </span>
                <span className="font-semibold">Tras revisar artículos de apoyo, ¿está el médico dispuesto a colaborar?</span>
              </div>
            </div>
          </div>

          {/* 9. CONSULTA ENTRE MÉDICOS */}
          <div className="border border-slate-800">
            <div className="bg-[#8faed8] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              CONSULTA ENTRE MÉDICOS
            </div>
            <div className="p-1 border-b border-slate-800 italic text-[10px] text-slate-700 bg-slate-100">
              (¿Está el médico a cargo dispuesto a consultar con un especialista de experiencia en el tratamiento sin sangre?)
            </div>
            <div className="grid grid-cols-12 text-[10.5px]">
              <div className="col-span-6 p-1 border-r border-b border-slate-800">
                <span className="font-semibold">Nombre del médico a consultar:</span> <strong>{worksheet.consultantDoctorName || '—'}</strong>
              </div>
              <div className="col-span-6 p-1 border-b border-slate-800">
                <span className="font-semibold">Método de contacto preferido por el médico a consultar:</span> {worksheet.consultantPreferredContact || '—'}
              </div>
              <div className="col-span-12 p-1 border-b border-slate-800">
                <span className="font-semibold">Especialidad:</span> {worksheet.consultantSpecialty || '—'}
              </div>
              <div className="col-span-12 p-1 min-h-[30px]">
                <span className="font-semibold">Información adicional:</span>
                <div className="whitespace-pre-wrap text-[10px] text-slate-800">{worksheet.consultantAdditionalInfo || '—'}</div>
              </div>
            </div>
          </div>

          {/* 10. SOLICITUD DE TRASLADO */}
          <div className="border border-slate-800">
            <div className="bg-[#8faed8] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              SOLICITUD DE TRASLADO
            </div>
            <div className="p-1 border-b border-slate-800 italic text-[10px] text-slate-700 bg-slate-100">
              (Deben decidirlo el paciente o su familia. Describa el método de traslado)
            </div>
            
            <div className="grid grid-cols-12 text-[10.5px]">
              <div className="col-span-6 p-1 border-r border-b border-slate-800 flex items-center gap-1.5">
                <span className="border border-slate-800 w-3.5 h-3.5 inline-flex items-center justify-center font-bold text-[10px]">
                  {worksheet.transferConfirmed ? '✓' : ''}
                </span>
                <span className="font-semibold">Planes de traslado confirmados</span>
              </div>
              <div className="col-span-6 p-1 border-b border-slate-800 flex items-center gap-1.5">
                <span className="border border-slate-800 w-3.5 h-3.5 inline-flex items-center justify-center font-bold text-[10px]">
                  {worksheet.hospitalInfoSectionContacted ? '✓' : ''}
                </span>
                <span className="font-semibold">Se contactó con la Sección de Información sobre Hospitales</span>
              </div>

              <div className="col-span-12 p-1 border-b border-slate-800">
                <span className="font-semibold">Hospital al que se traslada al paciente:</span> <strong>{worksheet.transferHospitalName || '—'}</strong>
              </div>
              <div className="col-span-12 p-1 border-b border-slate-800">
                <span className="font-semibold">Médico que lo atenderá en el hospital al que se le traslada:</span> {worksheet.transferAttendingDoctor || '—'}
              </div>
              <div className="col-span-12 p-1 border-b border-slate-800">
                <span className="font-semibold">Número de contacto del hospital al que se le traslada:</span> {worksheet.transferHospitalContactPhone || '—'}
              </div>
              <div className="col-span-12 p-1 min-h-[30px]">
                <span className="font-semibold">Información adicional:</span>
                <div className="whitespace-pre-wrap text-[10px] text-slate-800">{worksheet.transferAdditionalInfo || '—'}</div>
              </div>
            </div>
          </div>

          {/* 11. RESULTADOS/SEGUIMIENTO */}
          <div className="border border-slate-800">
            <div className="bg-[#f2a770] font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-800 text-slate-950">
              RESULTADOS/SEGUIMIENTO
            </div>
            <div className="p-1.5 space-y-1.5 text-[10.5px]">
              <div className="italic text-slate-600 text-[10px]">(Describa los resultados y detalles del seguimiento)</div>
              
              <div className="flex items-center gap-2">
                <span className="border border-slate-800 w-3.5 h-3.5 inline-flex items-center justify-center font-bold text-[10px]">
                  {worksheet.localEldersContactedFollowup ? '✓' : ''}
                </span>
                <span className="font-semibold">Ancianos locales contactados para seguimiento</span>
              </div>

              <div className="whitespace-pre-wrap text-[10.5px] text-slate-900 bg-slate-50 p-1.5 border border-slate-300 rounded min-h-[60px]">
                {worksheet.followupResultsAndDetails || '—'}
              </div>
            </div>
          </div>

          </div>

          {/* PAGE 2 FOOTER (PIE DE PÁGINA) */}
          <div className="flex justify-between items-center text-[10px] text-slate-900 px-2 pt-2 border-t-2 border-slate-800 font-mono font-bold mt-3">
            <span>hlc-7-S   1/12</span>
            <span className="uppercase text-[9px] tracking-wider text-slate-700">Comité de Enlace con Hospitales</span>
            <span>2 / 2</span>
          </div>

        </div>

      </div>

    </div>
  );
};
