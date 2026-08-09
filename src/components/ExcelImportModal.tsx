import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { Doctor, Specialty, DoctorType, DoctorStatus } from '../types';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  Check, 
  AlertCircle, 
  Download, 
  UserCheck,
  CheckCircle2,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedDoctorPreview {
  rawRow: Record<string, any>;
  mappedDoc: Doctor;
  hasWarnings: boolean;
  warnings: string[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { hospitals, addDoctorsBulk } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);

  const [previews, setPreviews] = useState<ParsedDoctorPreview[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Standard specialties for auto-matching
  const VALID_SPECIALTIES: Specialty[] = [
    'Cirugía General',
    'Anestesiología',
    'Hematología',
    'Ginecología y Obstetricia',
    'Traumatología y Ortopedia',
    'Pediatría y Neonatología',
    'Cuidados Intensivos (UCI)',
    'Cardiología / Cirugía Cardiovascular',
    'Gastroenterología',
    'Nefrología',
    'Oncología',
    'Bioética',
    'Dirección Médica',
    'Otra'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        parseSheetData(wb, firstSheet);
      } catch (err: any) {
        console.error('Error procesando archivo Excel', err);
        setErrorMessage('No se pudo leer el archivo. Asegúrese de que sea un archivo Excel (.xlsx, .xls) o CSV válido.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      parseSheetData(workbook, sheetName);
    }
  };

  const parseSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName];
    if (!worksheet) return;

    // Convert sheet to json array of objects
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (rawRows.length === 0) {
      setErrorMessage('La hoja seleccionada no contiene datos o está vacía.');
      setPreviews([]);
      return;
    }

    const parsedPreviews: ParsedDoctorPreview[] = rawRows.map((row, idx) => {
      const warnings: string[] = [];

      // Find value by checking key variations
      const getVal = (...keys: string[]) => {
        for (const k of Object.keys(row)) {
          const cleanK = k.trim().toLowerCase();
          for (const targetKey of keys) {
            if (cleanK.includes(targetKey.toLowerCase())) {
              return String(row[k]).trim();
            }
          }
        }
        return '';
      };

      // 1. Name & Title
      let rawName = getVal('nombre', 'medico', 'médico', 'doctor', 'dr', 'name', 'contacto', 'profesional');
      let title = getVal('titulo', 'título', 'tratamiento', 'dr/dra');
      
      if (!rawName) {
        // Fallback: search for any non-empty column value
        const values = Object.values(row).map(v => String(v).trim()).filter(Boolean);
        if (values.length > 0) {
          rawName = values[0];
        } else {
          rawName = `Médico Sin Nombre #${idx + 1}`;
          warnings.push('Nombre no especificado');
        }
      }

      // Auto-extract Dr. / Dra. from name if missing title
      if (!title) {
        if (/^dra\.?\s/i.test(rawName)) {
          title = 'Dra.';
          rawName = rawName.replace(/^dra\.?\s+/i, '');
        } else if (/^dr\.?\s/i.test(rawName)) {
          title = 'Dr.';
          rawName = rawName.replace(/^dr\.?\s+/i, '');
        } else {
          title = 'Dr.';
        }
      }

      // 2. Specialty
      const rawSpec = getVal('especialidad', 'rama', 'specialty', 'área', 'area');
      let mappedSpecialty: Specialty = 'Otra';

      if (rawSpec) {
        const foundSpec = VALID_SPECIALTIES.find(s => 
          s.toLowerCase() === rawSpec.toLowerCase() ||
          rawSpec.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(rawSpec.toLowerCase())
        );
        if (foundSpec) {
          mappedSpecialty = foundSpec;
        } else {
          mappedSpecialty = 'Cirugía General'; // default sensible
          warnings.push(`Especialidad "${rawSpec}" no estándar registrada.`);
        }
      } else {
        mappedSpecialty = 'Cirugía General';
      }

      // 3. Subspecialty
      const subSpecialty = getVal('subespecialidad', 'sub-especialidad', 'sub especialidad');

      // 4. Role / Doctor Type
      const rawType = getVal('tipo', 'rol', 'categoria', 'categoría', 'colaborador', 'consultor');
      let type: DoctorType = 'colaborador';
      if (/consultor/i.test(rawType)) {
        type = 'consultor';
      } else if (/admin|contacto/i.test(rawType)) {
        type = 'contacto_administrativo';
      } else {
        type = 'colaborador';
      }

      // 5. Phone numbers & Email
      const phoneMobile = getVal('celular', 'móvil', 'movil', 'whatsapp', 'teléfono', 'telefono', 'phone', 'móvil/whatsapp');
      const phoneHospital = getVal('hospital tel', 'tel hospital', 'directo', 'oficina');
      const phoneExtension = getVal('extensión', 'extension', 'ext');
      const email = getVal('email', 'correo', 'e-mail');

      // 6. Hospital affiliation
      const rawHospitalStr = getVal('hospital', 'hospitales', 'centro', 'clínica', 'clinica', 'lugar');
      const matchedHospitalIds: string[] = [];

      if (rawHospitalStr) {
        // split by commas or slashes if multiple
        const parts = rawHospitalStr.split(/[,;/]/).map(p => p.trim());
        parts.forEach(part => {
          if (!part) return;
          const matched = hospitals.find(h => 
            h.name.toLowerCase().includes(part.toLowerCase()) ||
            (h.shortName && h.shortName.toLowerCase().includes(part.toLowerCase()))
          );
          if (matched && !matchedHospitalIds.includes(matched.id)) {
            matchedHospitalIds.push(matched.id);
          }
        });
      }

      // If no match found, assign to first default hospital or leave empty
      if (matchedHospitalIds.length === 0 && hospitals.length > 0) {
        matchedHospitalIds.push(hospitals[0].id);
      }

      // 7. Department
      const department = getVal('departamento', 'servicio', 'unidad', 'área');

      // 8. PBM techniques
      const rawPBM = getVal('pbm', 'estrategias', 'técnicas', 'tecnicas', 'alternativas', 'cell saver');
      const pbmTechniquesUsed: string[] = rawPBM 
        ? rawPBM.split(/[,;/]/).map(s => s.trim()).filter(Boolean)
        : ['Cell Saver / Recuperación Intraoperatoria', 'Eritropoyetina (EPO)'];

      // 9. Notes
      const notes = getVal('notas', 'observaciones', 'comentarios', 'observacion');

      const today = new Date().toISOString().split('T')[0];

      const mappedDoc: Doctor = {
        id: `doc-excel-${idx}-${Date.now()}`,
        name: rawName,
        title: title || 'Dr.',
        type,
        specialty: mappedSpecialty,
        subSpecialty: subSpecialty || (rawSpec && mappedSpecialty === 'Otra' ? rawSpec : undefined),
        hospitalIds: matchedHospitalIds,
        department: department || 'Cirugía / Sala',
        phoneMobile: phoneMobile || '',
        phoneHospital: phoneHospital || '',
        phoneExtension: phoneExtension || '',
        email: email || '',
        status: 'disponible',
        bloodlessExperience: type === 'consultor' ? 'alto' : 'medio',
        pbmTechniquesUsed,
        notes: notes ? `${notes} (Importado de Excel)` : 'Importado vía planilla Excel.',
        createdAt: today,
        updatedAt: today
      };

      return {
        rawRow: row,
        mappedDoc,
        hasWarnings: warnings.length > 0,
        warnings
      };
    });

    setPreviews(parsedPreviews);
  };

  const handleExecuteImport = () => {
    if (previews.length === 0) return;

    const docsToImport = previews.map(p => p.mappedDoc);
    addDoctorsBulk(docsToImport, importMode);

    setSuccessMessage(`¡Se han importado exitosamente ${docsToImport.length} médicos al directorio del Comité!`);
    setTimeout(() => {
      onClose();
      // reset local modal state
      setPreviews([]);
      setFileName('');
      setSuccessMessage(null);
    }, 1800);
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        "Nombre Completo": "Carlos Eduardo Mendoza",
        "Tratamiento": "Dr.",
        "Rol": "Médico Colaborador",
        "Especialidad": "Cirugía General",
        "Subespecialidad": "Cirugía Laparoscópica",
        "Hospital": "Hospital Metropolitano, Clínica San José",
        "Servicio": "Cirugía y Urgencias",
        "Celular / WhatsApp": "+52 55 9876 5432",
        "Email": "dr.mendoza@ejemplo.com",
        "Técnicas PBM": "Cell Saver, Ácido Tranexámico, Electrocausterio",
        "Notas": "Cooperador constante en casos del Comité"
      },
      {
        "Nombre Completo": "María Fernanda Torres",
        "Tratamiento": "Dra.",
        "Rol": "Médico Consultor",
        "Especialidad": "Anestesiología",
        "Subespecialidad": "Anestesia Cardiovascular",
        "Hospital": "Centro Médico Nacional",
        "Servicio": "Anestesiología",
        "Celular / WhatsApp": "+52 55 1234 5678",
        "Email": "dra.torres@ejemplo.com",
        "Técnicas PBM": "Normovolemia Dilucional, Manejo de Temperatura",
        "Notas": "Experta en volúmenes y conservación de hemoglobina"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicos_Colaboradores");
    XLSX.writeFile(wb, "Plantilla_Medicos_Colaboradores_CEH.xlsx");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Importar Lista de Médicos desde Excel / CSV
              </h3>
              <p className="text-xs text-slate-400">
                Cargue archivos de Excel (.xlsx, .xls) o CSV con el listado de médicos colaboradores y consultores.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800">
          
          {/* File Upload Zone */}
          {previews.length === 0 ? (
            <div className="space-y-4">
              
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Arrastre su archivo Excel (.xlsx, .xls) o CSV aquí
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    o haga clic para examinar los archivos de su equipo
                  </p>
                </div>
                <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg text-[11px]">
                  Soporta Microsoft Excel, Google Sheets Export (.xlsx) y CSV
                </span>
              </div>

              {/* Sample Template & Instructions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900">¿Desea usar una plantilla en blanco?</h4>
                    <p className="text-slate-500 text-[11px]">
                      Descargue nuestra plantilla pre-diseñada con las columnas recomendadas para médicos del Comité.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm transition-colors shrink-0 text-xs"
                >
                  <Download className="w-4 h-4" />
                  Descargar Plantilla Excel
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-5">
              
              {/* File details & sheet select toolbar */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{fileName}</span>
                    <p className="text-slate-600 text-[11px]">
                      Se detectaron <strong>{previews.length} médicos</strong> listos para procesar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sheetNames.length > 1 && (
                    <div className="flex items-center gap-1">
                      <label className="font-medium text-slate-700">Hoja:</label>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg p-1 font-semibold text-slate-800 text-xs"
                      >
                        {sheetNames.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setPreviews([]);
                      setFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Cambiar Archivo
                  </button>
                </div>
              </div>

              {/* Import options */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">Modo de Importación:</span>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span><strong>Unir con la lista actual</strong> (Agrega nuevos y actualiza existentes por nombre)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-900"><strong>Reemplazar directorio</strong> (Sustituye toda la lista de médicos)</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    Vista Previa de Datos Mapeados ({previews.length}):
                  </span>
                  <span className="text-[11px] text-slate-500 italic">
                    Revise cómo se guardarán los datos en el directorio antes de confirmar.
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-800 border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Nombre del Médico</th>
                        <th className="p-2.5">Rol</th>
                        <th className="p-2.5">Especialidad</th>
                        <th className="p-2.5">Celular / Teléfono</th>
                        <th className="p-2.5">Hospital Asignado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previews.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {item.mappedDoc.title} {item.mappedDoc.name}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.mappedDoc.type === 'consultor' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                            }`}>
                              {item.mappedDoc.type === 'consultor' ? 'Consultor' : 'Colaborador'}
                            </span>
                          </td>
                          <td className="p-2.5 text-teal-800 font-medium">
                            {item.mappedDoc.specialty}
                            {item.mappedDoc.subSpecialty && <span className="text-slate-500 font-normal"> ({item.mappedDoc.subSpecialty})</span>}
                          </td>
                          <td className="p-2.5 font-mono text-[11px]">
                            {item.mappedDoc.phoneMobile || item.mappedDoc.phoneHospital || <span className="text-slate-400 italic">Sin teléfono</span>}
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {item.mappedDoc.hospitalIds.length > 0 
                              ? hospitals.find(h => h.id === item.mappedDoc.hospitalIds[0])?.shortName || 'Hospital asignado'
                              : 'Red de Hospitales'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors text-xs"
          >
            Cancelar
          </button>

          {previews.length > 0 && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md transition-all text-xs"
            >
              <UserCheck className="w-4 h-4" />
              Confirmar e Importar {previews.length} Médicos
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
