import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface CEHMemberWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId: string | null;
}

export const CEHMemberWorksheetModal: React.FC<CEHMemberWorksheetModalProps> = ({ isOpen, onClose, initialMemberId }) => {
  const { doctors, hospitals, cehMembers, congregations } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId, isOpen]);

  useEffect(() => {
    if (isOpen && selectedMemberId) {
      const timer = setTimeout(() => setMapReady(true), 500);
      return () => clearTimeout(timer);
    } else {
      setMapReady(false);
    }
  }, [isOpen, selectedMemberId]);

  if (!isOpen) return null;

  const miembroActivo = cehMembers ? cehMembers.find(m => m.id === selectedMemberId) : null;
  
  // Normalizar la Zona eliminando espacios y pasando a minúsculas para evitar fallos de coincidencia
  const zonaAsignadaRaw = miembroActivo?.zone || "Zona 3";
  const zonaAsignadaClean = zonaAsignadaRaw.toLowerCase().replace(/\s+/g, '');
  
  const colorMiembro = miembroActivo?.color || "#3b82f6"; 
  const nombresCongregacionesAsignadas = miembroActivo?.congregations || [];
  
  // Normalizar los nombres de las congregaciones asignadas al miembro
  const congsAsignadasClean = nombresCongregacionesAsignadas.map(c => c.toLowerCase().trim());

  // FILTROS BLINDADOS: Comparación tolerante a errores de escritura en la Base de Datos
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
    (m.zone || '').toLowerCase().replace(/\s+/g, '') === zonaAsignadaClean && 
    (m.role?.toLowerCase().includes('admin') || m.role?.toLowerCase().includes('secretario'))
  ) : [];

  // Filtrar congregaciones cuyos nombres coincidan con la cartilla del miembro
  const congregacionesConPoligonos = congregations ? congregations.filter(c => {
    const nombreCong = (c.name || c.nombre || '').toLowerCase().trim();
    return congsAsignadasClean.includes(nombreCong);
  }) : [];

  const centroBaseMapa: [number, number] = [25.6866, -100.3161];

  const handleDescargarPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('hoja-trabajo-content');
    if (!element) return alert('Error: No se encontró el contenedor de la hoja de trabajo.');

    const opt = {
      margin: 8,
      filename: `Hoja_Trabajo_${zonaAsignadaRaw.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="bg-slate-900 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col h-[94vh] border border-slate-800">
        
        {/* Encabezado del Modal */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300">Hoja de Trabajo Operativa Individual</span>
            <div className="w-px h-4 bg-slate-700" />
            <p className="text-xs text-slate-400">Territorio y control de infraestructura médica.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDescargarPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all">📥 Descargar Reporte PDF</button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 px-2 text-xs font-medium border border-slate-700 rounded-lg py-1.5 bg-slate-800">Cerrar</button>
          </div>
        </div>

        {/* El Documento Imprimible con scroll independiente */}
        <div className="p-4 overflow-y-auto bg-slate-950 flex-1 flex justify-center">
          <div 
            id="hoja-trabajo-content" 
            className="bg-white p-8 shadow-2xl w-full max-w-[215mm] text-slate-900 rounded-sm font-sans flex flex-col space-y-4"
            style={{ minHeight: '279mm' }}
          >
            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Comité de Enlace con Hospitales</h2>
              <p className="text-xs font-bold text-slate-500 tracking-tight">Reporte Interno de Operación y Control Territorial</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400">Integrante Responsable</span>
                <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: colorMiembro }} />
                  {miembroActivo?.name || 'Juan Manuel Gonzalez Ornelas'}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] uppercase font-bold text-slate-400">Territorio Jurisdicción</span>
                <span className="inline-block bg-slate-900 text-white font-extrabold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">{zonaAsignadaRaw}</span>
              </div>
            </div>

            {/* Renderizado de Mapa */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">📍 Territorio Delimitado por Congregaciones</h4>
              <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner relative z-10">
                {mapReady ? (
                  <MapContainer center={centroBaseMapa} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {congregacionesConPoligonos.map((cong, i) => (
                      <Polygon 
                        key={cong.id || i}
                        positions={cong.coordinates || cong.coordenadas || []} 
                        pathOptions={{ color: colorMiembro, fillColor: colorMiembro, fillOpacity: 0.25 }}
                      />
                    ))}
                    {hospitalesClinicas.map(h => (
                      <Marker key={h.id} position={[h.lat || 25.682, h.lng || -100.301]}>
                        <Popup><span className="font-bold text-xs">{h.name}</span></Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="h-full w-full bg-slate-100 flex items-center justify-center text-xs text-slate-400 italic">Cargando linderos geográficos...</div>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">
                <strong>Linderos Asignados ({nombresCongregacionesAsignadas.length} Cong.):</strong> {nombresCongregacionesAsignadas.join(', ') || 'Ninguna congregación registrada.'}
              </div>
            </div>

            {/* SECCIONES COMPLETA DE 4 COLUMNAS EN FORMATO RECUADRO COMPACTO */}
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              
              <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50 flex flex-col">
                <h5 className="font-bold text-slate-900 border-b pb-1 mb-1 flex items-center justify-between">
                  <span>🏢 Hospitales y Clínicas ({hospitalesClinicas.length})</span>
                </h5>
                <ul className="space-y-1 max-h-20 overflow-y-auto">
                  {hospitalesClinicas.length === 0 ? <li className="text-slate-400 italic text-[10px]">No hay centros de salud en la zona.</li> :
                    hospitalesClinicas.map(h => <li key={h.id} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium text-slate-800">{h.name}</li>)
                  }
                </ul>
              </div>

              <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50 flex flex-col">
                <h5 className="font-bold text-amber-800 border-b pb-1 mb-1">⚠️ Médicos Entrevistados ({medicosEntrevistados.length})</h5>
                <ul className="space-y-1 max-h-20 overflow-y-auto">
                  {medicosEntrevistados.length === 0 ? <li className="text-slate-400 italic text-[10px]">Sin médicos bajo evaluación.</li> :
                    medicosEntrevistados.map(m => <li key={m.id} className="bg-amber-50/40 px-1.5 py-0.5 rounded border border-amber-200 text-slate-900"><span className="font-bold">{m.name}</span> — {m.specialty}</li>)
                  }
                </ul>
              </div>

              <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50 flex flex-col">
                <h5 className="font-bold text-sky-800 border-b pb-1 mb-1">🏥 Proveedores de Salud ({proveedoresSalud.length})</h5>
                <ul className="space-y-1 max-h-20 overflow-y-auto">
                  {proveedoresSalud.length === 0 ? <li className="text-slate-400 italic text-[10px]">Sin proveedores vinculados en territorio.</li> :
                    proveedoresSalud.map(p => <li key={p.id} className="bg-sky-50/40 px-1.5 py-0.5 rounded border border-sky-200 text-slate-800">{p.name}</li>)
                  }
                </ul>
              </div>

              <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50 flex flex-col">
                <h5 className="font-bold text-purple-800 border-b pb-1 mb-1">💼 Personal Administrativo ({personalAdministrativo.length})</h5>
                <ul className="space-y-1 max-h-20 overflow-y-auto">
                  {personalAdministrativo.length === 0 ? <li className="text-slate-400 italic text-[10px]">Sin personal administrativo reportado.</li> :
                    personalAdministrativo.map(a => <li key={a.id} className="bg-purple-50/40 px-1.5 py-0.5 rounded border border-purple-200 text-slate-800"><span className="font-bold">{a.name}</span> — <span className="text-[9px] font-bold">{a.role}</span></li>)
                  }
                </ul>
              </div>

            </div>

            <div className="text-center text-[9px] text-slate-400 border-t pt-2 mt-auto">
              Información confidencial de uso exclusivo para las actividades de control del CEH. Zona 3.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
