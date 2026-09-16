import React from 'react';
import { Doctor, Hlc31Data } from '../types';
import { X, Printer, Download } from 'lucide-react';

interface Hlc31PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Partial<Doctor>;
}

export const Hlc31PrintModal: React.FC<Hlc31PrintModalProps> = ({
  isOpen,
  onClose,
  doctor
}) => {
  if (!isOpen) return null;

  const hlc: Hlc31Data = doctor.hlc31 || {};

  const handlePrint = () => {
    window.print();
  };

  // Helper to render checkbox box
  const CheckBox = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-start gap-1.5 leading-tight">
      <div className={`w-3.5 h-3.5 border border-slate-900 mt-0.5 shrink-0 flex items-center justify-center font-bold text-[10px] ${checked ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
        {checked ? '✓' : ''}
      </div>
      <span className="text-[10px] text-slate-950 font-normal">{label}</span>
    </div>
  );

  const contactTypes = hlc.contactTypes || [];
  const isPurposeNew = hlc.formPurpose === 'nuevo' || !hlc.formPurpose;
  const isPurposeUpdate = hlc.formPurpose === 'actualizar';

  const isColaborador = contactTypes.includes('medico_colaborador') || doctor.type === 'colaborador';
  const isConsultor = contactTypes.includes('medico_consultor') || doctor.type === 'consultor';
  const isTestigo = contactTypes.includes('testigo_jehova');
  const isMiembroCeh = contactTypes.includes('miembro_ceh');
  const isOtro = contactTypes.includes('otro');

  const acceptedPatients = hlc.acceptedPatientTypes || ['adulto'];
  const isAdulto = acceptedPatients.includes('adulto');
  const isNino = acceptedPatients.includes('nino');
  const isNeonato = acceptedPatients.includes('neonato');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden my-auto print:max-w-none print:shadow-none print:border-none print:m-0 print:w-full print:h-auto print:rounded-none">
        
        {/* Top Control Bar (Hidden when Printing) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-xs">
              HLC
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Vista Previa de Documento Oficial HLC-31-S
              </h3>
              <p className="text-[11px] text-slate-400">
                DATOS DE CONTACTO PARA EL COMITÉ DE ENLACE CON LOS HOSPITALES
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (Matching exact hlc-31-S layout) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-950 font-sans print:p-0 print:overflow-visible">
          
          <div className="max-w-[760px] mx-auto space-y-2 text-slate-950 leading-tight">
            
            {/* Title */}
            <h1 className="text-center font-black text-sm sm:text-base tracking-wide uppercase text-slate-950 pb-1">
              DATOS DE CONTACTO PARA EL COMITÉ DE ENLACE CON LOS HOSPITALES
            </h1>

            {/* SECCIÓN 1 */}
            <div className="border border-slate-900 text-[10px]">
              <div className="bg-slate-300 font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-900 text-slate-950 tracking-wider">
                SECCIÓN 1
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900 border-b border-slate-900">
                {/* Left col: Form purpose */}
                <div className="col-span-6 p-1.5 space-y-1.5">
                  <span className="font-semibold block text-slate-950">
                    Formulario utilizado para (marque una opción):
                  </span>
                  <div className="space-y-1 pl-1">
                    <CheckBox checked={isPurposeUpdate} label="Actualizar información sobre un contacto" />
                    <CheckBox checked={isPurposeNew} label="Introducir información sobre un contacto nuevo" />
                  </div>

                  <div className="pt-1.5 border-t border-slate-300">
                    <span className="font-semibold block text-slate-950 mb-0.5">Comentarios:</span>
                    <div className="min-h-[48px] text-[9.5px] whitespace-pre-wrap font-sans text-slate-900">
                      {hlc.sec1Comments || doctor.notes || ''}
                    </div>
                  </div>
                </div>

                {/* Right col: Contact type */}
                <div className="col-span-6 p-1.5 space-y-1">
                  <span className="font-semibold block text-slate-950">
                    Tipo de contacto (marque todo lo que corresponda):
                  </span>
                  <div className="space-y-1 pl-1">
                    <CheckBox checked={isColaborador} label="Médico colaborador (llene también la Sección 3)" />
                    <CheckBox checked={isConsultor} label="Médico consultor (llene también la Sección 3)" />
                    <CheckBox checked={isTestigo} label="Testigo de Jehová" />
                    <CheckBox checked={isMiembroCeh} label="Miembro del CEH, miembro del GVP u otro colaborador del CEH" />
                    <CheckBox checked={isOtro} label={`Otro (especifique en el apartado "Comentarios")${hlc.contactTypeOther ? `: ${hlc.contactTypeOther}` : ''}`} />
                  </div>
                </div>
              </div>

              {/* Bottom line: First contact date & place */}
              <div className="p-1.5 flex items-center gap-1">
                <span className="font-semibold text-slate-950 shrink-0">
                  Fecha y lugar del primer contacto con el miembro del CEH:
                </span>
                <span className="font-normal border-b border-dotted border-slate-800 flex-1 px-1">
                  {hlc.firstContactDateAndPlace || doctor.lastContactDate || ''}
                </span>
              </div>
            </div>

            {/* SECCIÓN 2 */}
            <div className="border border-slate-900 text-[10px]">
              <div className="bg-slate-300 font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-900 text-slate-950 tracking-wider">
                SECCIÓN 2
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900">
                {/* Left column (Personal Info) */}
                <div className="col-span-6 divide-y divide-slate-900">
                  <div className="p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Nombre:</span>
                    <span className="font-medium">{hlc.firstName || (doctor.name ? doctor.name.split(' ')[0] : '')}</span>
                  </div>
                  <div className="p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Apellidos:</span>
                    <span className="font-medium">{hlc.lastName || (doctor.name ? doctor.name.split(' ').slice(1).join(' ') : '')}</span>
                  </div>
                  <div className="p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Teléfono fijo:</span>
                    <span className="font-medium">{hlc.phoneFixed || doctor.phoneHospital || ''}</span>
                  </div>
                  <div className="p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Teléfono móvil:</span>
                    <span className="font-medium">{hlc.phoneMobile || doctor.phoneMobile || ''}</span>
                  </div>
                  <div className="p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Correo electrónico:</span>
                    <span className="font-medium">{hlc.email || doctor.email || ''}</span>
                  </div>
                  <div className="p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Género:</span>
                    <span className="font-medium">{hlc.gender || ''}</span>
                  </div>
                  <div className="p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Nombre y número de la congr. (si procede):</span>
                    <span className="font-medium">{hlc.congregationInfo || ''}</span>
                  </div>
                  <div className="p-1 min-h-[40px]">
                    <span className="font-semibold block">Comentarios:</span>
                    <span className="font-normal text-[9.5px] whitespace-pre-wrap">{hlc.sec2Comments || ''}</span>
                  </div>
                </div>

                {/* Right column (Address Info) */}
                <div className="col-span-6 divide-y divide-slate-900">
                  <div className="p-1 min-h-[32px]">
                    <span className="font-semibold shrink-0">Dirección:</span>
                    <span className="font-medium ml-1">{hlc.address || ''}</span>
                  </div>
                  <div className="p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Ciudad:</span>
                    <span className="font-medium">{hlc.city || ''}</span>
                  </div>
                  <div className="grid grid-cols-12 divide-x divide-slate-900">
                    <div className="col-span-7 p-1 flex items-center gap-1">
                      <span className="font-semibold shrink-0">Provincia o estado:</span>
                      <span className="font-medium">{hlc.stateProvince || ''}</span>
                    </div>
                    <div className="col-span-5 p-1 flex items-center gap-1">
                      <span className="font-semibold shrink-0">Zona o código:</span>
                      <span className="font-medium">{hlc.zipCode || ''}</span>
                    </div>
                  </div>
                  <div className="p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">País:</span>
                    <span className="font-medium">{hlc.country || 'México'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3 */}
            <div className="border border-slate-900 text-[10px]">
              <div className="bg-slate-300 font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-900 text-slate-950 tracking-wider">
                SECCIÓN 3
              </div>

              <div className="divide-y divide-slate-900">
                {/* Specialty 1 */}
                <div className="grid grid-cols-12 divide-x divide-slate-900 p-0">
                  <div className="col-span-6 p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Especialidad:</span>
                    <span className="font-medium">{hlc.specialty1 || doctor.specialty || ''}</span>
                  </div>
                  <div className="col-span-6 p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Subespecialidad:</span>
                    <span className="font-medium">{hlc.subSpecialty1 || doctor.subSpecialty || ''}</span>
                  </div>
                </div>

                {/* Specialty 2 */}
                <div className="grid grid-cols-12 divide-x divide-slate-900 p-0">
                  <div className="col-span-6 p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Especialidad:</span>
                    <span className="font-medium">{hlc.specialty2 || ''}</span>
                  </div>
                  <div className="col-span-6 p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Subespecialidad:</span>
                    <span className="font-medium">{hlc.subSpecialty2 || ''}</span>
                  </div>
                </div>

                {/* Specialty 3 */}
                <div className="grid grid-cols-12 divide-x divide-slate-900 p-0">
                  <div className="col-span-6 p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Especialidad:</span>
                    <span className="font-medium">{hlc.specialty3 || ''}</span>
                  </div>
                  <div className="col-span-6 p-1 flex items-center gap-1">
                    <span className="font-semibold shrink-0">Subespecialidad:</span>
                    <span className="font-medium">{hlc.subSpecialty3 || ''}</span>
                  </div>
                </div>

                {/* Patient types accepted */}
                <div className="p-1.5 space-y-1">
                  <span className="font-semibold block text-slate-950">
                    Tipos de pacientes aceptados por el médico (marque todo lo que corresponda):
                  </span>
                  <div className="flex items-center gap-6 pl-2">
                    <CheckBox checked={isAdulto} label="Adulto" />
                    <CheckBox checked={isNino} label="Niño" />
                    <CheckBox checked={isNeonato} label="Neonato" />
                  </div>
                </div>

                {/* Sec 3 Comments */}
                <div className="p-1.5 min-h-[48px]">
                  <span className="font-semibold block text-slate-950 mb-0.5">Comentarios:</span>
                  <span className="font-normal text-[9.5px] whitespace-pre-wrap">
                    {hlc.sec3Comments || (doctor.pbmTechniquesUsed ? `Técnicas PBM: ${doctor.pbmTechniquesUsed.join(', ')}` : '')}
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 4 */}
            <div className="border border-slate-900 text-[10px]">
              <div className="bg-slate-300 font-bold uppercase text-center text-[11px] py-0.5 border-b border-slate-900 text-slate-950 tracking-wider">
                SECCIÓN 4
              </div>

              <div className="p-2 space-y-3">
                <p className="text-[9.5px] leading-tight text-slate-900 text-justify font-sans">
                  Al llenar y enviar este formulario, confirmo que las personas mencionadas anteriormente han aceptado que el CEH almacene y procese su información personal, y entienden que la información incluida en este formulario pudiera ser enviada a países cuyas leyes proporcionan diferentes niveles de protección de datos, que no siempre equivalen al del país en el que se encuentran actualmente. También les informé que pueden ponerse en contacto con el CEH si cambian sus preferencias sobre cómo se almacenan sus datos personales.
                </p>

                <div className="space-y-2 pt-1 font-semibold text-slate-950">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">Nombre del CEH:</span>
                    <span className="border-b border-slate-900 flex-1 font-normal px-1">
                      {hlc.cehName || 'Comité de Enlace con los Hospitales'}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5 flex items-center gap-2">
                      <span className="shrink-0">Fecha:</span>
                      <span className="border-b border-slate-900 flex-1 font-normal px-1">
                        {hlc.formDate || new Date().toLocaleDateString('es-MX')}
                      </span>
                    </div>
                    <div className="col-span-7 flex items-center gap-2">
                      <span className="shrink-0">Miembro del CEH:</span>
                      <span className="border-b border-slate-900 flex-1 font-normal px-1">
                        {hlc.cehMemberName || ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Document Code */}
            <div className="pt-2 flex items-center justify-between text-[9px] text-slate-700 font-mono italic">
              <span>hlc-31-S 7/23</span>
              <span className="not-italic font-sans">Página 1 de 1</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
