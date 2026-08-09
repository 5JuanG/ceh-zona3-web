import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { CEHMember, Congregation, Hospital, Doctor } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  Users, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Check, 
  Copy, 
  Compass, 
  FileText,
  FileCheck,
  Stethoscope,
  Info
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getCityFallbackCoordinates, sanitizeHospitalCoordinates, parseGoogleMapsUrl } from '../utils/googleMapsParser';
import { CONGREGATION_BOUNDARIES } from '../data/congregationBoundaries';

const STORAGE_KEY_CONG_BOUNDARIES = 'ceh_congregation_kml_boundaries_v3';

interface CEHMemberWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId?: string | null;
}

const normalizeStr = (str: string) => 
  (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const getTokens = (str: string) => 
  normalizeStr(str).split(/[\s,.-]+/).filter(t => t.length > 2);

export const CEHMemberWorksheetModal: React.FC<CEHMemberWorksheetModalProps> = ({
  isOpen,
  onClose,
  initialMemberId
}) => {
  const { cehMembers, congregations, hospitals, doctors } = useApp();

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize selected member ID when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialMemberId && cehMembers.some(m => m.id === initialMemberId)) {
        setSelectedMemberId(initialMemberId);
      } else if (cehMembers.length > 0) {
        const active = cehMembers.find(m => m.status !== 'inactivo') || cehMembers[0];
        setSelectedMemberId(active.id);
      }
    }
  }, [isOpen, initialMemberId, cehMembers]);

  const selectedMember = cehMembers.find(m => m.id === selectedMemberId);

  // Robust Congregation Matching for selected member
  const memberCongregations = selectedMember 
    ? congregations.filter(c => {
        if (!c) return false;

        // 1. Direct ID match
        if (c.assignedMemberId && c.assignedMemberId === selectedMember.id) return true;

        // 2. Direct Name or partial Name match
        if (c.assignedMemberName) {
          const cName = normalizeStr(c.assignedMemberName);
          const mName = normalizeStr(selectedMember.name);
          if (cName === mName || mName.includes(cName) || cName.includes(mName)) return true;

          const cTokens = getTokens(c.assignedMemberName);
          const mTokens = getTokens(selectedMember.name);
          if (cTokens.length > 0 && cTokens.every(t => mTokens.includes(t))) return true;
          if (mTokens.length > 0 && mTokens.every(t => cTokens.includes(t))) return true;
        }

        // 3. Array match in selectedMember.assignedCongregationIds
        if (selectedMember.assignedCongregationIds && selectedMember.assignedCongregationIds.length > 0) {
          return selectedMember.assignedCongregationIds.some(assigned => {
            const a = normalizeStr(String(assigned));
            return a === normalizeStr(c.number) || a === normalizeStr(c.name) || (c.id && a === normalizeStr(c.id));
          });
        }

        return false;
      })
    : [];

  // Robust Hospital Matching for selected member
  const memberHospitals = selectedMember
    ? hospitals.filter(h => {
        if (!h) return false;

        // 1. Direct assigned member ID or name
        if (h.assignedCEHMemberId && h.assignedCEHMemberId === selectedMember.id) return true;
        
        const hAssignedName = (h as any).assignedCEHMemberName || (h as any).assignedMemberName;
        if (hAssignedName) {
          const hName = normalizeStr(hAssignedName);
          const mName = normalizeStr(selectedMember.name);
          if (hName === mName || mName.includes(hName) || hName.includes(mName)) return true;

          const hTokens = getTokens(hAssignedName);
          const mTokens = getTokens(selectedMember.name);
          if (hTokens.length > 0 && hTokens.every(t => mTokens.includes(t))) return true;
        }

        // 2. Assigned congregation number match
        if (h.congregationNumber && memberCongregations.some(c => c.number === h.congregationNumber)) return true;

        // 3. Member name in hospital notes
        if (h.notes) {
          const hNotes = normalizeStr(h.notes);
          const nameTokens = getTokens(selectedMember.name);
          if (nameTokens.length > 0 && nameTokens.some(part => hNotes.includes(part))) return true;
        }

        return false;
      })
    : [];

  // If no hospital is assigned directly to this member, match by congregation cities or fallback to all hospitals
  const territoryHospitals = (selectedMember && memberHospitals.length === 0 && memberCongregations.length > 0)
    ? hospitals.filter(h => {
        const hCity = normalizeStr(h.address || h.city || '');
        return memberCongregations.some(c => hCity.includes(normalizeStr(c.city || '')) || hCity.includes(normalizeStr(c.name.split('-')[0])));
      })
    : [];

  const displayedHospitals = memberHospitals.length > 0 
    ? memberHospitals 
    : (territoryHospitals.length > 0 ? territoryHospitals : hospitals);

  // Congregations to plot on map (member's congregations or all if member has 0 directly assigned)
  const mapCongregations = memberCongregations.length > 0 ? memberCongregations : congregations;

  // Initialize or update Leaflet map for member territory
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current || !selectedMember) return;

    // Destroy previous map instance cleanly & purge container
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Error removing map instance', e);
      }
      mapInstanceRef.current = null;
    }

    if (mapContainerRef.current) {
      (mapContainerRef.current as any)._leaflet_id = null;
      mapContainerRef.current.innerHTML = '';
    }

    // Límites de congregación: empieza con los 147 polígonos incluidos en la
    // app (src/data/congregationBoundaries.ts) y les aplica encima cualquier
    // ajuste guardado localmente (por ejemplo, un KML actualizado subido
    // desde el Mapa Interactivo).
    let kmlBoundaries: Record<string, [number, number][]> = { ...CONGREGATION_BOUNDARIES };
    try {
      const savedKml = localStorage.getItem(STORAGE_KEY_CONG_BOUNDARIES) || localStorage.getItem('ceh_congregation_kml_boundaries_v2');
      if (savedKml) kmlBoundaries = { ...kmlBoundaries, ...JSON.parse(savedKml) };
    } catch (e) {
      console.warn('Error reading KML boundaries', e);
    }

    // Default center (Guadalupe / Monterrey / Zona 3)
    const defaultCenter: [number, number] = [25.6780, -100.2570];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Tile Layer with crossOrigin for canvas export
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      crossOrigin: 'anonymous'
    }).addTo(map);

    const bounds = L.latLngBounds([]);
    const allPoints: [number, number][] = [];
    const memberColor = selectedMember.color || '#3b82f6';

    // 1. Draw Congregations and their polygons
    mapCongregations.forEach((cong, idx) => {
      // Find KML Polygon
      let kmlPoints = kmlBoundaries[cong.name] || kmlBoundaries[cong.number];
      if (!kmlPoints || kmlPoints.length < 3) {
        const foundEntry = Object.entries(kmlBoundaries).find(([key, pts]) => {
          if (!pts || pts.length < 3) return false;
          const kLower = normalizeStr(key);
          const cNameClean = normalizeStr(cong.name);
          return kLower === normalizeStr(cong.number) || kLower === cNameClean || kLower.includes(cNameClean) || cNameClean.includes(kLower);
        });
        if (foundEntry) kmlPoints = foundEntry[1];
      }

      // Draw KML Polygon if available
      if (kmlPoints && kmlPoints.length >= 3) {
        try {
          L.polygon(kmlPoints, {
            color: memberColor,
            fillColor: memberColor,
            fillOpacity: 0.25,
            weight: 3,
            dashArray: '4, 4'
          }).addTo(map);

          kmlPoints.forEach(p => {
            bounds.extend(p);
            allPoints.push(p);
          });
        } catch (err) {
          console.warn('Error rendering KML polygon', err);
        }
      }

      // Resolve Congregation Pin Point
      let congPoint: [number, number] | undefined = undefined;
      if (cong.coordinates?.lat && cong.coordinates?.lng) {
        congPoint = [cong.coordinates.lat, cong.coordinates.lng];
      } else if (kmlPoints && kmlPoints.length >= 3) {
        const avgLat = kmlPoints.reduce((sum, p) => sum + p[0], 0) / kmlPoints.length;
        const avgLng = kmlPoints.reduce((sum, p) => sum + p[1], 0) / kmlPoints.length;
        congPoint = [avgLat, avgLng];
      } else {
        const fallback = getCityFallbackCoordinates(cong.city || cong.name);
        const latOffset = (idx % 3 - 1) * 0.008;
        const lngOffset = (Math.floor(idx / 3) % 3 - 1) * 0.008;
        congPoint = [fallback.lat + latOffset, fallback.lng + lngOffset];
      }

      if (congPoint) {
        bounds.extend(congPoint);
        allPoints.push(congPoint);

        if (!kmlPoints || kmlPoints.length < 3) {
          L.circle(congPoint, {
            color: memberColor,
            fillColor: memberColor,
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '5, 5',
            radius: 2200
          }).addTo(map);
        }
      }
    });

    // 2. Draw Hospitals
    displayedHospitals.forEach((hosp, hIdx) => {
      let hospPoint: [number, number] | undefined = undefined;

      const sanitized = sanitizeHospitalCoordinates(hosp.coordinates);
      if (sanitized) {
        hospPoint = [sanitized.lat, sanitized.lng];
      } else if (hosp.googleMapsUrl) {
        const parsed = parseGoogleMapsUrl(hosp.googleMapsUrl);
        if (parsed.coordinates) hospPoint = [parsed.coordinates.lat, parsed.coordinates.lng];
      }

      if (!hospPoint) {
        const fallback = getCityFallbackCoordinates(hosp.address || hosp.city || hosp.zone || hosp.name);
        const latOffset = (hIdx % 4 - 1.5) * 0.006;
        const lngOffset = (Math.floor(hIdx / 4) % 3 - 1) * 0.006;
        hospPoint = [fallback.lat + latOffset, fallback.lng + lngOffset];
      }

      if (hospPoint) {
        bounds.extend(hospPoint);
        allPoints.push(hospPoint);

        const hospIcon = L.divIcon({
          className: 'custom-leaflet-div-icon',
          html: `
            <div style="
              background-color: #0f172a;
              color: #38bdf8;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 800;
              border: 2px solid #38bdf8;
              box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span>🏥</span>
              <span>${hosp.shortName || hosp.name}</span>
            </div>
          `,
          iconSize: [140, 28],
          iconAnchor: [70, 14]
        });

        L.marker(hospPoint, { icon: hospIcon })
          .addTo(map)
          .bindPopup(`<b>${hosp.name}</b><br/>Zona: ${hosp.zone || 'Zona 3'}`);
      }
    });

    // Fit map bounds cleanly
    if (bounds.isValid() && allPoints.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (err) {
        map.setView(defaultCenter, 11);
      }
    } else {
      map.setView(defaultCenter, 11);
    }

    // Force multiple invalidateSize calls to handle modal layout transitions & container size calculation
    const timers = [50, 150, 300, 600, 1200].map(delay => 
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          if (bounds.isValid() && allPoints.length > 0) {
            try {
              mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            } catch (e) {}
          }
        }
      }, delay)
    );

    // Attach ResizeObserver to container
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, selectedMemberId, mapCongregations, displayedHospitals]);

  if (!isOpen) return null;

  const handlePrintNative = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('worksheet-printable-area');
    if (!element) return;

    setGeneratingPdf(true);
    try {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Hoja_de_Trabajo_CEH_${selectedMember ? selectedMember.name.replace(/\s+/g, '_') : 'Miembro'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Se produjo un error al generar el PDF. Puedes usar el botón "Imprimir / Guardar PDF" como alternativa.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleCopyTextSummary = () => {
    if (!selectedMember) return;

    let text = `HOJA DE TRABAJO INDIVIDUAL - MIEMBRO DEL CEH\n`;
    text += `====================================================\n`;
    text += `Miembro del CEH: ${selectedMember.name}\n`;
    text += `Función / Rol: ${selectedMember.role || 'Anciano'}\n`;
    text += `Teléfono: ${selectedMember.phone || 'No especificado'}\n`;
    text += `Correo: ${selectedMember.email || 'No especificado'}\n`;
    text += `Estado: ${selectedMember.status === 'inactivo' ? 'Inactivo' : 'Activo'}\n\n`;

    text += `CONGREGACIONES ASIGNADAS (${memberCongregations.length}):\n`;
    text += `----------------------------------------------------\n`;
    if (memberCongregations.length === 0) {
      text += `Sin congregaciones asignadas actualmente.\n`;
    } else {
      memberCongregations.forEach((c, idx) => {
        text += `${idx + 1}. Cong. N° ${c.number}: ${c.name}\n`;
        text += `   Circuito: ${c.circuitSection || 'N/A'} | Ciudad: ${c.city || 'N/A'}\n`;
        if (c.notes) {
          text += `   Notas: ${c.notes}\n`;
        }
      });
    }

    text += `\nHOSPITALES REGISTRADOS Y DATOS RECABADOS (${displayedHospitals.length}):\n`;
    text += `----------------------------------------------------\n`;
    if (displayedHospitals.length === 0) {
      text += `Sin hospitales asignados directamente a este miembro.\n`;
    } else {
      displayedHospitals.forEach((h, idx) => {
        text += `${idx + 1}. ${h.name} (${h.shortName || 'Sin sigla'})\n`;
        text += `   Dirección: ${h.address || 'No especificada'}\n`;
        text += `   Tel. Emergencia 24/7: ${h.phoneEmergency || 'N/A'} | Conmutador: ${h.phoneGeneral || 'N/A'}\n`;
        if (h.notes) text += `   Datos Recabados / Notas: ${h.notes}\n`;

        const linkedDocs = doctors.filter(d => d.hospitalIds.includes(h.id));
        if (linkedDocs.length > 0) {
          text += `   Médicos Colaboradores (${linkedDocs.length}): ${linkedDocs.map(d => `${d.title} ${d.name} (${d.specialty})`).join(', ')}\n`;
        }
      });
    }

    text += `\nGenerado el: ${new Date().toLocaleDateString('es-ES')}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:static print:p-0 print:bg-white cursor-pointer"
      onClick={onClose}
    >
      
      {/* Global Style Override for Leaflet DivIcons & Print layout */}
      <style>{`
        .custom-leaflet-div-icon, .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        @media print {
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          #worksheet-printable-area { width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .leaflet-container { width: 100% !important; height: 380px !important; display: block !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto cursor-default print:max-w-none print:shadow-none print:border-none print:m-0 print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header - Hidden on Print */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <FileCheck className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Hoja de Trabajo Individual — Miembro del CEH
              </h3>
              <p className="text-xs text-slate-400">
                Generación de informe oficial con territorio demarcado, congregaciones y hospitales recabados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Member Selector Bar - Hidden on Print */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600" />
              Seleccionar Miembro del CEH:
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 min-w-[220px]"
            >
              {cehMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role || 'Anciano'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyTextSummary}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Resumen'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{generatingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            <button
              onClick={handlePrintNative}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Cerrar documento"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Printable Area Content */}
        <div id="worksheet-printable-area" className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto text-slate-900 text-xs font-sans print:p-0 print:overflow-visible">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white rounded">
                DOCUMENTO OFICIAL CEH
              </span>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                HOJA DE TRABAJO INDIVIDUAL — MIEMBRO DEL CEH
              </h1>
              <h2 className="text-sm font-bold text-teal-800">
                Comité de Enlace con Hospitales (CEH) — Zona 3
              </h2>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-medium">
              <div><strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div><strong>Código Formato:</strong> CEH-HTM-2026</div>
            </div>
          </div>

          {/* Member Profile Box */}
          {selectedMember ? (
            <div className="bg-slate-50 border-2 rounded-2xl p-4 space-y-3" style={{ borderColor: selectedMember.color || '#3b82f6' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl text-white font-extrabold flex items-center justify-center text-lg shadow-md shrink-0"
                    style={{ backgroundColor: selectedMember.color || '#3b82f6' }}
                  >
                    {selectedMember.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">{selectedMember.name}</h2>
                    <p className="text-xs text-slate-600 font-bold">
                      Función / Rol: <span className="text-teal-800">{selectedMember.role || 'Anciano'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${
                    selectedMember.status === 'inactivo' 
                      ? 'bg-rose-100 text-rose-800 border-rose-300' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {selectedMember.status === 'inactivo' ? '🔴 Inactivo' : '🟢 Activo'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                  <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Teléfono Móvil</span>
                    <span className="font-bold text-slate-900">{selectedMember.phone || 'No especificado'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                  <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Correo Electrónico</span>
                    <span className="font-bold text-slate-900 truncate block max-w-[200px]">{selectedMember.email || 'No especificado'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                  <Compass className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Congregaciones / Hospitales</span>
                    <span className="font-bold text-slate-900">{memberCongregations.length} Cong. | {displayedHospitals.length} Hosp.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-300 text-center font-bold">
              Selecciona un integrante del CEH para visualizar su hoja de trabajo.
            </div>
          )}

          {/* Territorial Map Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-600" />
                Mapa Interactivo del Territorio y Delimitación Asignada
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">
                Delimitación clara con radio de cobertura y pines de hospitales
              </span>
            </div>

            <div className="border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm relative bg-slate-100">
              <div 
                ref={mapContainerRef} 
                className="w-full h-80 sm:h-96 z-10 bg-slate-200"
              />
              <div className="bg-slate-900 text-white p-2.5 px-3 flex flex-wrap items-center justify-between text-[11px] font-semibold gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: selectedMember?.color || '#3b82f6' }}></span>
                    Territorio Asignado ({memberCongregations.length > 0 ? memberCongregations.length : mapCongregations.length} Cong.)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-slate-900 border-2 border-sky-400 flex items-center justify-center text-[8px]">🏥</span>
                    Hospitales ({displayedHospitals.length})
                  </span>
                </div>
                <span className="text-slate-400 text-[10px]">
                  * Los polígonos y radios representan el área de cobertura geográfica oficial.
                </span>
              </div>
            </div>
          </div>

          {/* Congregations Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                Congregaciones Asignadas ({memberCongregations.length})
              </h3>
            </div>

            {memberCongregations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {memberCongregations.map(cong => (
                  <div key={cong.number} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-extrabold text-sm text-slate-900">
                        Congregación N° {cong.number} — {cong.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">
                        {cong.circuitSection || 'Circuito N/A'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <div>
                        <strong>Ciudad:</strong> {cong.city || 'N/A'}
                      </div>
                      <div>
                        <strong>Publicadores:</strong> {cong.publishersCount || 0} | <strong>Ancianos:</strong> {cong.eldersCount || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-100 rounded-xl text-center text-slate-500 font-semibold italic">
                El integrante no tiene congregaciones asignadas directamente.
              </div>
            )}
          </div>

          {/* Hospitals & Gathered Data Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Hospitales Registrados y Datos Recabados ({displayedHospitals.length})
              </h3>
            </div>

            {displayedHospitals.length > 0 ? (
              <div className="space-y-3">
                {displayedHospitals.map((hosp, idx) => {
                  const linkedDoctors = doctors.filter(d => d.hospitalIds.includes(hosp.id));

                  return (
                    <div key={hosp.id} className="border-2 border-slate-200 rounded-xl p-4 bg-white space-y-2 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div>
                          <span className="font-extrabold text-sm text-slate-900">
                            {idx + 1}. {hosp.name}
                          </span>
                          {hosp.shortName && (
                            <span className="ml-2 font-bold text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              [{hosp.shortName}]
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Zona: {hosp.zone || 'Zona 3'} | Categoría: {hosp.type || 'Hospital Público'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                        <div>
                          <strong>Dirección:</strong> {hosp.address || 'No especificada'}
                        </div>
                        <div>
                          <strong>Urgencias 24/7:</strong> <span className="font-bold text-rose-700">{hosp.phoneEmergency || 'N/A'}</span>
                        </div>
                        <div>
                          <strong>Conmutador:</strong> {hosp.phoneGeneral || 'N/A'}
                        </div>
                      </div>

                      {/* Gathered Information / Notes */}
                      {hosp.notes && (
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                          <strong className="text-slate-900 block font-bold flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-teal-600" />
                            Datos Recabados / Protocolos Específicos:
                          </strong>
                          <p className="text-slate-800 whitespace-pre-wrap">{hosp.notes}</p>
                        </div>
                      )}

                      {/* Linked Doctors */}
                      {linkedDoctors.length > 0 && (
                        <div className="p-2 bg-teal-50/50 rounded-lg border border-teal-200/60 text-[11px] space-y-1">
                          <strong className="text-teal-900 block font-bold flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                            Médicos Colaboradores / Consultores en este Hospital ({linkedDoctors.length}):
                          </strong>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {linkedDoctors.map(doc => (
                              <span key={doc.id} className="bg-white border border-teal-300 text-teal-950 px-2 py-0.5 rounded font-medium text-[10.5px]">
                                {doc.title} {doc.name} — <span className="font-bold">{doc.specialty}</span> ({doc.type})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-slate-100 rounded-xl text-center text-slate-500 font-semibold italic">
                No hay hospitales registrados bajo la responsabilidad directa de este miembro.
              </div>
            )}
          </div>

          {/* Footer Signature Box */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[11px]">
            <div className="space-y-8">
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p className="font-bold text-slate-800">
                Firma del Miembro del CEH<br/>
                <span className="text-slate-500 font-normal">{selectedMember?.name}</span>
              </p>
            </div>
            <div className="space-y-8">
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p className="font-bold text-slate-800">
                Coordinador del CEH / COL<br/>
                <span className="text-slate-500 font-normal">Comité de Enlace con Hospitales</span>
              </p>
            </div>
          </div>

          {/* Bottom Action Bar on screen */}
          <div className="pt-4 flex justify-end print:hidden border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Cerrar Hoja de Trabajo</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
