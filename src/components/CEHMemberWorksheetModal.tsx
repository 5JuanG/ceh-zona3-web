import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Doctor } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  Users, 
  Building2, 
  Phone, 
  Mail, 
  Check, 
  Copy, 
  Compass, 
  FileCheck,
  Stethoscope,
  HeartPulse,
  UserCog,
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

// Índice de secciones que se muestra en la portada, en el mismo orden en que
// aparecen las páginas del documento.
const COVER_INDEX = [
  { label: 'Congregaciones Asignadas' },
  { label: 'Mapa del Territorio' },
  { label: 'Hospitales y Clínicas' },
  { label: 'Médicos' },
  { label: 'Proveedores de la Salud' },
  { label: 'Personal de Apoyo' },
];

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

  // Médicos ligados a los hospitales de este miembro, agrupados por tipo
  const memberDoctors = doctors.filter(d => d.hospitalIds.some(hid => displayedHospitals.some(h => h.id === hid)));
  const medicosList = memberDoctors.filter(d => d.type === 'colaborador' || d.type === 'consultor');
  const proveedoresList = memberDoctors.filter(d => d.type === 'proveedor_salud');
  const personalApoyoList = memberDoctors.filter(d => d.type === 'contacto_administrativo');

  const hospitalNameFor = (hospitalIds: string[]) =>
    hospitalIds
      .map(hid => displayedHospitals.find(h => h.id === hid)?.shortName || displayedHospitals.find(h => h.id === hid)?.name)
      .filter(Boolean)
      .join(', ') || 'Sin hospital vinculado';

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
      zoomControl: false,
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
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background-color: ${memberColor};
              border: 3px solid #ffffff;
              box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            "></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
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

  // IDs de cada página del documento, en el orden en que deben aparecer.
  const PAGE_IDS = [
    'worksheet-cover',
    'worksheet-pg-congregaciones',
    'worksheet-pg-mapa',
    'worksheet-pg-hospitales',
    'worksheet-pg-medicos',
    'worksheet-pg-proveedores',
    'worksheet-pg-personal',
    'worksheet-pg-firma'
  ];

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      let isFirstPage = true;

      for (const pageId of PAGE_IDS) {
        const el = document.getElementById(pageId);
        if (!el) continue;

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Si el contenido de esta sección es más largo que una hoja A4
        // (por ejemplo, una lista larga de hospitales), continúa en tantas
        // páginas adicionales como haga falta antes de pasar a la siguiente
        // sección.
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
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
      });
    }

    text += `\nMÉDICOS (${medicosList.length}):\n`;
    medicosList.forEach(d => { text += `- ${d.title} ${d.name} (${d.specialty}) — ${hospitalNameFor(d.hospitalIds)}\n`; });

    text += `\nPROVEEDORES DE LA SALUD (${proveedoresList.length}):\n`;
    proveedoresList.forEach(d => { text += `- ${d.title} ${d.name} — ${hospitalNameFor(d.hospitalIds)}\n`; });

    text += `\nPERSONAL DE APOYO (${personalApoyoList.length}):\n`;
    personalApoyoList.forEach(d => { text += `- ${d.title} ${d.name} — ${hospitalNameFor(d.hospitalIds)}\n`; });

    text += `\nGenerado el: ${new Date().toLocaleDateString('es-ES')}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Encabezado reutilizable para cada página de contenido (todas menos la portada)
  const PageHeader: React.FC<{ icon: React.ReactNode; title: string; count?: number }> = ({ icon, title, count }) => (
    <div className="relative overflow-hidden rounded-xl mb-5" style={{ minHeight: '64px' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-sky-800"></div>
      <div className="relative flex items-center justify-between h-full px-5 py-3.5">
        <div className="flex items-center gap-2.5 text-white">
          {icon}
          <h3 className="font-black text-sm uppercase tracking-wide">{title}{typeof count === 'number' ? ` (${count})` : ''}</h3>
        </div>
        <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wide hidden sm:block">
          Comité de Enlace con Hospitales — Zona 3
        </span>
      </div>
    </div>
  );

  const DoctorCard: React.FC<{ doc: Doctor; accent: string }> = ({ doc, accent }) => (
    <div className="border-2 border-slate-200 rounded-xl p-3.5 bg-white space-y-1.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <span className="font-extrabold text-sm text-slate-900">{doc.title} {doc.name}</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase" style={{ backgroundColor: `${accent}20`, color: accent }}>
          {doc.status === 'disponible' ? 'Disponible' : doc.status === 'solo_urgencias' ? 'Solo Urgencias' : doc.status === 'en_consulta' ? 'En Consulta' : 'Inactivo'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
        <div><strong>Especialidad:</strong> {doc.specialty}{doc.subSpecialty ? ` (${doc.subSpecialty})` : ''}</div>
        <div><strong>Hospital(es):</strong> {hospitalNameFor(doc.hospitalIds)}</div>
        <div><strong>Teléfono:</strong> {doc.phoneMobile || 'N/A'}</div>
        <div><strong>Correo:</strong> {doc.email || 'N/A'}</div>
      </div>
      {doc.notes && (
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10.5px] text-slate-700 whitespace-pre-wrap">
          {doc.notes}
        </div>
      )}
    </div>
  );

  const EmptyState: React.FC<{ text: string }> = ({ text }) => (
    <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500 font-semibold italic">
      {text}
    </div>
  );

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
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <FileCheck className="w-5 h-5 text-sky-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Hoja de Trabajo Individual — Miembro del CEH
              </h3>
              <p className="text-xs text-slate-400">
                Informe con portada, territorio demarcado, congregaciones, hospitales y personal médico.
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
              <Users className="w-4 h-4 text-sky-600" />
              Seleccionar Miembro del CEH:
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 min-w-[220px]"
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
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
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

          {/* ================= PORTADA ================= */}
          <div id="worksheet-cover" className="relative overflow-hidden rounded-2xl bg-blue-950" style={{ height: '980px' }}>
            <div className="relative flex flex-col h-full text-white">

              {/* Barra superior: título + datos del informe */}
              <div className="px-8 pt-8 pb-6 flex flex-wrap items-start justify-between gap-4 border-b border-white/10">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight">
                    Comité de Enlace<br/>con Hospitales
                  </h1>
                  <p className="text-sm sm:text-base font-bold text-sky-300 mt-1 uppercase tracking-wide">
                    Zona 3 de Monterrey
                  </p>
                </div>
                <div className="text-xs space-y-2.5 min-w-[230px]">
                  <div>
                    <span className="font-bold text-sky-300 uppercase tracking-wide block mb-0.5">Miembro del CEH:</span>
                    <span className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg font-bold block">
                      {selectedMember?.name || 'Sin seleccionar'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-sky-300 uppercase tracking-wide block mb-0.5">Fecha del Informe:</span>
                    <span className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg font-bold block">
                      {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cuerpo: índice + panel visual */}
              <div className="flex-1 flex gap-7 px-8 py-7">
                <div className="w-[195px] shrink-0 space-y-6 pt-2">
                  {COVER_INDEX.map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-white shrink-0"></span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide leading-tight">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-800 to-blue-900 border border-white/10">
                  <div
                    className="absolute inset-0 opacity-[0.12]"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }}
                  ></div>
                  <div className="relative h-full flex flex-col items-center justify-center gap-4">
                    <Stethoscope className="w-36 h-36 text-white/20" strokeWidth={1} />
                    <div className="flex items-center gap-6 text-white/25">
                      <HeartPulse className="w-14 h-14" strokeWidth={1} />
                      <Building2 className="w-14 h-14" strokeWidth={1} />
                      <Users className="w-14 h-14" strokeWidth={1} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra inferior */}
              <div className="bg-sky-900/60 border-t border-white/10 px-8 py-5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-sky-300 uppercase tracking-wide">
                  Uso confidencial exclusivo para miembros del Comité
                </span>
                <span className="text-lg sm:text-xl font-black uppercase tracking-wide">
                  Informe de Trabajo
                </span>
              </div>
            </div>
          </div>

          {/* ================= CONGREGACIONES ASIGNADAS ================= */}
          <div id="worksheet-pg-congregaciones" className="page-break">
            <PageHeader icon={<Users className="w-5 h-5 text-sky-300" />} title="Congregaciones Asignadas" count={memberCongregations.length} />

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
                      <div><strong>Ciudad:</strong> {cong.city || 'N/A'}</div>
                      <div><strong>Publicadores:</strong> {cong.publishersCount || 0} | <strong>Ancianos:</strong> {cong.eldersCount || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="El integrante no tiene congregaciones asignadas directamente." />
            )}
          </div>

          {/* ================= MAPA DEL TERRITORIO ================= */}
          <div id="worksheet-pg-mapa" className="page-break" style={{ height: '980px' }}>
            <PageHeader icon={<Compass className="w-5 h-5 text-sky-300" />} title="Mapa del Territorio Asignado" />

            <div className="border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm relative bg-slate-100" style={{ height: '850px' }}>
              <div 
                ref={mapContainerRef} 
                className="w-full z-10 bg-slate-200"
                style={{ height: '810px' }}
              />
              <div className="bg-slate-900 text-white p-2.5 px-3 flex flex-wrap items-center justify-between text-[11px] font-semibold gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: selectedMember?.color || '#3b82f6' }}></span>
                    Territorio Asignado ({memberCongregations.length > 0 ? memberCongregations.length : mapCongregations.length} Cong.)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: selectedMember?.color || '#3b82f6' }}></span>
                    Hospitales ({displayedHospitals.length})
                  </span>
                </div>
                <span className="text-slate-400 text-[10px]">
                  * Los polígonos representan el área de cobertura territorial oficial.
                </span>
              </div>
            </div>
          </div>

          {/* ================= HOSPITALES Y CLÍNICAS ================= */}
          <div id="worksheet-pg-hospitales" className="page-break">
            <PageHeader icon={<Building2 className="w-5 h-5 text-sky-300" />} title="Hospitales y Clínicas" count={displayedHospitals.length} />

            {displayedHospitals.length > 0 ? (
              <div className="space-y-3">
                {displayedHospitals.map((hosp, idx) => (
                  <div key={hosp.id} className="border-2 border-slate-200 rounded-xl p-4 bg-white space-y-2 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">{idx + 1}. {hosp.name}</span>
                        {hosp.shortName && (
                          <span className="ml-2 font-bold text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            [{hosp.shortName}]
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Zona: {hosp.zone || 'Zona 3'} | Categoría: {hosp.type || 'Hospital Público'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                      <div><strong>Dirección:</strong> {hosp.address || 'No especificada'}</div>
                      <div><strong>Urgencias 24/7:</strong> <span className="font-bold text-rose-700">{hosp.phoneEmergency || 'N/A'}</span></div>
                      <div><strong>Conmutador:</strong> {hosp.phoneGeneral || 'N/A'}</div>
                    </div>

                    {hosp.notes && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                        <strong className="text-slate-900 block font-bold flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-sky-600" />
                          Datos Recabados / Protocolos Específicos:
                        </strong>
                        <p className="text-slate-800 whitespace-pre-wrap">{hosp.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No hay hospitales registrados bajo la responsabilidad directa de este miembro." />
            )}
          </div>

          {/* ================= MÉDICOS ================= */}
          <div id="worksheet-pg-medicos" className="page-break">
            <PageHeader icon={<Stethoscope className="w-5 h-5 text-sky-300" />} title="Médicos Colaboradores y Consultores" count={medicosList.length} />
            {medicosList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {medicosList.map(doc => <DoctorCard key={doc.id} doc={doc} accent="#0369a1" />)}
              </div>
            ) : (
              <EmptyState text="No hay médicos colaboradores o consultores registrados en los hospitales de este miembro." />
            )}
          </div>

          {/* ================= PROVEEDORES DE LA SALUD ================= */}
          <div id="worksheet-pg-proveedores" className="page-break">
            <PageHeader icon={<HeartPulse className="w-5 h-5 text-sky-300" />} title="Proveedores de la Salud" count={proveedoresList.length} />
            {proveedoresList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {proveedoresList.map(doc => <DoctorCard key={doc.id} doc={doc} accent="#0e7490" />)}
              </div>
            ) : (
              <EmptyState text="No hay proveedores de la salud registrados en los hospitales de este miembro." />
            )}
          </div>

          {/* ================= PERSONAL DE APOYO ================= */}
          <div id="worksheet-pg-personal" className="page-break">
            <PageHeader icon={<UserCog className="w-5 h-5 text-sky-300" />} title="Personal de Apoyo" count={personalApoyoList.length} />
            {personalApoyoList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {personalApoyoList.map(doc => <DoctorCard key={doc.id} doc={doc} accent="#334155" />)}
              </div>
            ) : (
              <EmptyState text="No hay personal de apoyo / contactos administrativos registrados en los hospitales de este miembro." />
            )}
          </div>

          {/* ================= FIRMAS ================= */}
          <div id="worksheet-pg-firma" className="page-break">
            <PageHeader icon={<FileCheck className="w-5 h-5 text-sky-300" />} title="Perfil del Integrante y Cierre del Informe" />

            {selectedMember && (
              <div className="bg-slate-50 border-2 rounded-2xl p-4 space-y-3 mb-6" style={{ borderColor: selectedMember.color || '#3b82f6' }}>
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
                        Función / Rol: <span className="text-sky-800">{selectedMember.role || 'Anciano'}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${
                    selectedMember.status === 'inactivo' 
                      ? 'bg-rose-100 text-rose-800 border-rose-300' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {selectedMember.status === 'inactivo' ? '🔴 Inactivo' : '🟢 Activo'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <Phone className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Teléfono Móvil</span>
                      <span className="font-bold text-slate-900">{selectedMember.phone || 'No especificado'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Correo Electrónico</span>
                      <span className="font-bold text-slate-900 truncate block max-w-[200px]">{selectedMember.email || 'No especificado'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <Compass className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Resumen General</span>
                      <span className="font-bold text-slate-900">{memberCongregations.length} Cong. | {displayedHospitals.length} Hosp. | {memberDoctors.length} Personal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
          </div>

        </div>

      </div>
    </div>
  );
};
