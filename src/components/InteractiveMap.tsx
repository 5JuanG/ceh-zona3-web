import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { Hospital } from '../types';
import { CONGREGATION_BOUNDARIES } from '../data/congregationBoundaries';
import { Search, Users, MapPin, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapProps {
  onOpenHospitalModal: (hosp?: Hospital) => void;
  onFilterDoctorsByHospital: (hospitalId: string) => void;
}

interface InteractiveMapPropsExtended extends InteractiveMapProps {
  readOnly?: boolean;
  filterByMemberEmail?: string;
  cehMembersCustom?: any[];
  /** Cuando es true (uso en la pestaña principal del mapa), se muestran los
   * filtros de búsqueda y el contenedor ocupa mucho más espacio vertical. */
  expanded?: boolean;
}

const DEFAULT_CONG_BOUNDARIES: Record<string, [number, number][]> = CONGREGATION_BOUNDARIES;

const COLOR_PALETTE = [
  '#22c55e', '#eab308', '#ec4899', '#a855f7', '#f97316',
  '#06b6d4', '#14b8a6', '#f43f5e', '#65a30d', '#0284c7'
];

const normalizarTexto = (txt: string) => {
  if (!txt) return '';
  return txt.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export const InteractiveMap: React.FC<InteractiveMapPropsExtended> = ({
  onOpenHospitalModal,
  onFilterDoctorsByHospital,
  readOnly = false,
  filterByMemberEmail,
  cehMembersCustom,
  expanded = false
}) => {
  const { hospitals, cehMembers: globalMembers, congregations: allCongregations } = useApp();
  const membersList = cehMembersCustom || globalMembers;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayersRef = useRef<Map<string, L.Polygon>>(new Map());
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapCenter] = useState<[number, number]>([25.6866, -100.3161]);
  const [zoomLevel] = useState<number>(11);

  // --- Filtros de búsqueda (solo se muestran en modo `expanded`, es decir,
  // en la pestaña principal del Mapa Interactivo — no en las vistas de solo
  // lectura embebidas en la Hoja de Trabajo). ---
  const [memberFilterId, setMemberFilterId] = useState<string>('');
  const [congSearchTerm, setCongSearchTerm] = useState('');
  const [congSuggestionsOpen, setCongSuggestionsOpen] = useState(false);
  const [selectedCongNumber, setSelectedCongNumber] = useState<string>('');

  // Filtro de miembro efectivo: el prop `filterByMemberEmail` (usado en modo
  // solo-lectura desde la Hoja de Trabajo) siempre tiene prioridad sobre el
  // filtro interno seleccionado por el usuario en la pestaña del mapa.
  const memberFilterFromDropdown = useMemo(() => {
    if (!memberFilterId || !membersList) return undefined;
    return membersList.find(m => m.id === memberFilterId)?.email;
  }, [memberFilterId, membersList]);

  const effectiveFilterEmail = filterByMemberEmail || memberFilterFromDropdown;

  const congSuggestions = useMemo(() => {
    if (!expanded || !congSearchTerm.trim() || !allCongregations) return [];
    const term = normalizarTexto(congSearchTerm);
    return allCongregations
      .filter(c => normalizarTexto(c.name).includes(term) || c.number.includes(congSearchTerm.trim()))
      .filter(c => !!DEFAULT_CONG_BOUNDARIES[c.number])
      .slice(0, 8);
  }, [congSearchTerm, allCongregations, expanded]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: !readOnly,
      scrollWheelZoom: !readOnly
    }).setView(mapCenter, zoomLevel);

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© CEH Zona 3'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 450);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    polygonLayersRef.current.forEach(layer => layer.remove());
    polygonLayersRef.current.clear();

    const congToColorMap: Record<string, string> = {};
    const congToMemberNameMap: Record<string, string> = {};

    if (membersList && membersList.length > 0) {
      membersList.forEach((member, index) => {
        const listaCongs = member.assignedCongregationIds || [];

        if (Array.isArray(listaCongs)) {
          const memberColor = member.color || COLOR_PALETTE[index % COLOR_PALETTE.length];

          listaCongs.forEach((c: any) => {
            if (!c) return;
            const cleanName = normalizarTexto(c);
            congToColorMap[cleanName] = memberColor;
            congToMemberNameMap[cleanName] = member.name || member.nombre;
          });
        }
      });
    }

    let singleAssignedCongs: string[] = [];
    if (effectiveFilterEmail && membersList) {
      const target = membersList.find(m => m.email?.toLowerCase().trim() === effectiveFilterEmail.toLowerCase().trim());
      const targetCongs = target ? (target.assignedCongregationIds || []) : [];
      singleAssignedCongs = targetCongs.map((c: any) => normalizarTexto(c));
    }

    const bounds = L.latLngBounds([]);

    Object.entries(DEFAULT_CONG_BOUNDARIES).forEach(([congName, coords]) => {
      const cleanCongName = normalizarTexto(congName);
      const isAssignedToCurrent = singleAssignedCongs.includes(cleanCongName);

      let fillOpacity = 0.3;
      let strokeColor = '#475569';
      let fillColor = congToColorMap[cleanCongName] || '#cbd5e1';

      if (effectiveFilterEmail) {
        if (isAssignedToCurrent) {
          fillColor = congToColorMap[cleanCongName] || '#22c55e';
          strokeColor = fillColor;
          fillOpacity = 0.5;
          coords.forEach(c => bounds.extend(c));
        } else {
          fillOpacity = 0.0;
          strokeColor = 'transparent';
          fillColor = 'transparent';
        }
      }

      if (coords && coords.length > 0) {
        const polygon = L.polygon(coords, {
          color: strokeColor,
          weight: effectiveFilterEmail ? 2 : 1,
          fillColor: fillColor,
          fillOpacity: fillOpacity
        }).addTo(map);

        const owner = congToMemberNameMap[cleanCongName] || "Sin asignar";
        const congDisplayName = allCongregations?.find(c => c.number === congName)?.name || congName;
        polygon.bindPopup(`<strong>Congregación:</strong> ${congDisplayName}<br/><strong>Asignado a:</strong> ${owner}`);
        polygonLayersRef.current.set(congName, polygon);
      }
    });

    if (effectiveFilterEmail && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [membersList, effectiveFilterEmail]);

  // Resalta y centra la congregación seleccionada desde el buscador
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCongNumber) return;

    const layer = polygonLayersRef.current.get(selectedCongNumber);
    if (!layer) return;

    layer.setStyle({ color: '#0f172a', weight: 4, fillOpacity: 0.6 });
    map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 15 });
    layer.openPopup();
  }, [selectedCongNumber]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (hospitals && hospitals.length > 0) {
      hospitals.forEach(h => {
        if (!h.lat || !h.lng) return;

        if (effectiveFilterEmail && membersList) {
          const target = membersList.find(m => m.email?.toLowerCase().trim() === effectiveFilterEmail.toLowerCase().trim());
          if (target && h.zone !== target.zone) return;
        }

        const marker = L.marker([h.lat, h.lng]);
        marker.bindPopup(`<strong>${h.name}</strong><br/>Urgencias: ${h.phoneEmergency || 'N/A'}`);
        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [hospitals, effectiveFilterEmail, membersList]);

  const handleSelectCongregation = (number: string) => {
    setSelectedCongNumber(number);
    setCongSearchTerm('');
    setCongSuggestionsOpen(false);
  };

  const handleClearFilters = () => {
    setMemberFilterId('');
    setSelectedCongNumber('');
    setCongSearchTerm('');
  };

  const heightClass = expanded
    ? 'h-[calc(100vh-260px)] min-h-[620px]'
    : 'h-full min-h-[480px] sm:min-h-[550px]';

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {expanded && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={memberFilterId}
              onChange={(e) => setMemberFilterId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 outline-none font-semibold focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Todos los integrantes</option>
              {membersList && membersList.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name || m.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={congSearchTerm}
              onChange={(e) => { setCongSearchTerm(e.target.value); setCongSuggestionsOpen(true); }}
              onFocus={() => setCongSuggestionsOpen(true)}
              placeholder="Buscar congregación por nombre o número..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 outline-none font-semibold focus:ring-1 focus:ring-sky-500"
            />
            {congSuggestionsOpen && congSuggestions.length > 0 && (
              <div className="absolute top-full left-6 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[1000] max-h-56 overflow-y-auto">
                {congSuggestions.map(c => (
                  <button
                    key={c.number}
                    onClick={() => handleSelectCongregation(c.number)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 flex items-center gap-2 border-b border-slate-100 last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">#{c.number}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {(memberFilterId || selectedCongNumber || congSearchTerm) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
      )}

      <div
        ref={mapContainerRef}
        className={`w-full ${heightClass} rounded-xl overflow-hidden isolate shadow-inner border border-slate-200 z-10`}
        style={{ width: '100%', position: 'relative' }}
      />
    </div>
  );
};
