import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import JSZip from 'jszip';
import { useApp } from '../context/AppContext';
import { Hospital, CEHMember, Congregation } from '../types';
import { parseGoogleMapsUrl, getCityFallbackCoordinates, sanitizeHospitalCoordinates } from '../utils/googleMapsParser';
import { CONGREGATION_BOUNDARIES } from '../data/congregationBoundaries';
import { 
  MapPin, Building2, Upload, Layers, ShieldCheck, Phone, UserCheck, PlusCircle, 
  Info, CheckCircle2, RefreshCw, FileCode, Globe, Navigation, Compass, Users, 
  Filter, Sparkles, ExternalLink, Search, Target, Eye, Trash2, Code, Clipboard, FileText
} from 'lucide-react';

interface InteractiveMapProps {
  onOpenHospitalModal: (hosp?: Hospital) => void;
  onFilterDoctorsByHospital: (hospitalId: string) => void;
}

interface InteractiveMapPropsExtended extends InteractiveMapProps {
  readOnly?: boolean;
  filterByMemberEmail?: string;
  cehMembersCustom?: any[];
}

interface ZonePolygonData {
  name: string;
  coordinates: [number, number][];
}

const STORAGE_KEY_MAP_ZONE = 'clh_app_map_zone_3_v1';
const STORAGE_KEY_CONG_BOUNDARIES = 'ceh_congregation_kml_boundaries_v3';
const DEFAULT_CONG_BOUNDARIES: Record<string, [number, number][]> = CONGREGATION_BOUNDARIES;

// Paleta de colores distintivos para diferenciar los territorios de los miembros del comité
const COLOR_PALETTE = [
  '#22c55e', '#eab308', '#ec4899', '#a855f7', '#f97316', 
  '#06b6d4', '#14b8a6', '#f43f5e', '#65a30d', '#0284c7'
];

const parseRawKmlOrTextContent = (text: string) => {
  let parsedCoordinates: [number, number][] = [];
  let pointsExtracted: { name: string; lat: number; lng: number }[] = [];
  let detectedName = '';

  if (!text || !text.trim()) return { parsedCoordinates, pointsExtracted, detectedName };
  const trimmed = text.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json = JSON.parse(trimmed);
      if (json.polygons && Array.isArray(json.polygons)) {
        json.polygons.forEach((poly: any) => {
          if (poly.coordinates && Array.isArray(poly.coordinates)) {
            poly.coordinates.forEach((c: any) => {
              if (Array.isArray(c) && c.length >= 2) {
                const lng = parseFloat(c);
                const lat = parseFloat(c);
                if (!isNaN(lat) && !isNaN(lng)) parsedCoordinates.push([lat, lng]);
              }
            });
          }
        });
      }
    } catch (e) {}
  }

  if (parsedCoordinates.length === 0) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(trimmed, 'text/xml');
      const placemarks = xmlDoc.getElementsByTagName('Placemark');
      for (let i = 0; i < placemarks.length; i++) {
        const pm = placemarks[i];
        const nameEl = pm.getElementsByTagName('name');
        const pmName = nameEl ? nameEl.textContent?.trim() : '';
        const polygons = pm.getElementsByTagName('Polygon');
        for (let p = 0; p < polygons.length; p++) {
          if (!detectedName && pmName) detectedName = pmName;
          const coordNodes = polygons[p].getElementsByTagName('coordinates');
          for (let j = 0; j < coordNodes.length; j++) {
            const raw = coordNodes[j].textContent?.trim();
            if (raw) {
              const tokens = raw.split(/\s+/);
              tokens.forEach(tok => {
                const parts = tok.split(',');
                if (parts.length >= 2) {
                  const n1 = parseFloat(parts);
                  const n2 = parseFloat(parts);
                  if (!isNaN(n1) && !isNaN(n2)) {
                    if (Math.abs(n1) > Math.abs(n2)) {
                      parsedCoordinates.push([n2, n1]);
                    } else {
                      parsedCoordinates.push([n1, n2]);
                    }
                  }
                }
              });
            }
          }
        }
      }
    } catch (e) {}
  }
  return { parsedCoordinates, pointsExtracted, detectedName };
};

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Guadalupe': { lat: 25.6780, lng: -100.2570 },
  'Juárez': { lat: 25.6470, lng: -100.0960 },
  'Cadereyta Jiménez': { lat: 25.5880, lng: -99.9920 },
  'Allende': { lat: 25.2810, lng: -100.0180 },
  'Montemorelos': { lat: 25.1880, lng: -99.8270 },
  'Linares': { lat: 24.8620, lng: -99.5670 }
};
export const InteractiveMap: React.FC<InteractiveMapPropsExtended> = ({
  onOpenHospitalModal,
  onFilterDoctorsByHospital,
  readOnly = false,
  filterByMemberEmail,
  cehMembersCustom
}) => {
  const { hospitals, cehMembers: globalMembers } = useApp();
  const membersList = cehMembersCustom || globalMembers;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayersRef = useRef<L.Polygon[]>([]);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapCenter] = useState<[number, number]>([25.6470, -100.0960]);
  const [zoomLevel] = useState<number>(10);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView(mapCenter, zoomLevel);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; CEH Zona 3'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 400);

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
    polygonLayersRef.current = [];

    const congToColorMap: Record<string, string> = {};
    const congToMemberNameMap: Record<string, string> = {};

    if (membersList && membersList.length > 0) {
      membersList.forEach((member, index) => {
        if (member.congregaciones && Array.isArray(member.congregaciones)) {
          const memberColor = COLOR_PALETTE[index % COLOR_PALETTE.length];
          member.congregaciones.forEach((c: any) => {
            const cleanName = c.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            congToColorMap[cleanName] = memberColor;
            congToMemberNameMap[cleanName] = member.nombre || member.name;
          });
        }
      });
    }

    let singleAssignedCongs: string[] = [];
    if (filterByMemberEmail && membersList) {
      const target = membersList.find(m => m.email?.toLowerCase().trim() === filterByMemberEmail.toLowerCase().trim());
      if (target && target.congregaciones) {
        singleAssignedCongs = target.congregaciones.map((c: any) => 
          c.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        );
      }
    }

    const bounds = L.latLngBounds([]);

    Object.entries(DEFAULT_CONG_BOUNDARIES).forEach(([congName, coords]) => {
      const cleanCongName = congName.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const isAssignedToCurrent = singleAssignedCongs.includes(cleanCongName);
      
      let fillOpacity = 0.2; 
      let strokeColor = '#475569'; 
      let fillColor = congToColorMap[cleanCongName] || '#94a3b8';
      const memberOwnerName = congToMemberNameMap[cleanCongName];

      if (readOnly && filterByMemberEmail) {
        if (isAssignedToCurrent) {
          fillColor = '#22c55e'; // Verde para el reporte individual
          strokeColor = '#16a34a';
          fillOpacity = 0.55;
          coords.forEach(c => bounds.extend(c));
        } else {
          fillOpacity = 0.01;
          strokeColor = '#f1f5f9';
          fillColor = '#f8fafc';
        }
      }

      if (coords && coords.length > 0) {
        const polygon = L.polygon(coords, {
          color: strokeColor,
          weight: readOnly ? 2 : 1,
          fillColor: fillColor,
          fillOpacity: fillOpacity
        }).addTo(map);

        const popupText = memberOwnerName 
          ? `<b>Congregación:</b> ${congName}<br/><span style="color:#2563eb;"><b>Asignado a:</b> ${memberOwnerName}</span>`
          : `<b>Congregación:</b> ${congName}<br/><span style="color:#64748b;">Sin asignar</span>`;

        polygon.bindPopup(popupText);
        polygonLayersRef.current.push(polygon);
      }
    });

    // CORRECCIÓN SINTÁCTICA DEL ERROR DE MÁRGENES: Añadimos un array de márgenes válido [20, 20]
    if (readOnly && filterByMemberEmail && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [filterByMemberEmail, membersList, readOnly]);

  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    if (hospitals && hospitals.length > 0) {
      hospitals.forEach(hosp => {
        if (hosp.coordenadas?.lat && hosp.coordenadas?.lng) {
          const marker = L.marker([hosp.coordenadas.lat, hosp.coordenadas.lng]).addTo(markersLayerRef.current!);
          marker.bindPopup(`<b>${hosp.nombre}</b>`);
        }
      });
    }
  }, [hospitals]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
      {!readOnly && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-slate-200">Mapa Interactivo de Trabajo</h3>
              <p className="text-xs text-slate-400">Jurisdicción Territorial Zona 3 coloreada por miembros</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onOpenHospitalModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Agregar Hospital
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 relative w-full h-full min-h-[200px] bg-slate-950">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};
