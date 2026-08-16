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
                const lng = parseFloat(c[0]);
                const lat = parseFloat(c[1]);
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
        const nameEl = pm.getElementsByTagName('name')[0];
        const pmName = nameEl?.textContent?.trim() || '';
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
                  const n1 = parseFloat(parts[0]);
                  const n2 = parseFloat(parts[1]);
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

  const [mapCenter] = useState<[number, number]>([25.2810, -100.0180]);
  const [zoomLevel] = useState<number>(9);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView(mapCenter, zoomLevel);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; CEH Zona 3'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    drawCongregationBoundaries(map);
    drawHospitalMarkers();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      drawCongregationBoundaries(mapInstanceRef.current);
    }
  }, [filterByMemberEmail, membersList]);

  const drawCongregationBoundaries = (map: L.Map) => {
    polygonLayersRef.current.forEach(layer => layer.remove());
    polygonLayersRef.current = [];

    let assignedCongs: string[] = [];
    if (filterByMemberEmail && membersList && membersList.length > 0) {
      const selectedMember = membersList.find(m => m.email?.toLowerCase().trim() === filterByMemberEmail.toLowerCase().trim());
      if (selectedMember && selectedMember.congregaciones) {
        assignedCongs = selectedMember.congregaciones.map((c: any) => 
          c.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        );
      }
    }

    const bounds = L.latLngBounds([]);

    Object.entries(DEFAULT_CONG_BOUNDARIES).forEach(([congName, coords]) => {
      const cleanCongName = congName.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const isAssigned = assignedCongs.includes(cleanCongName);

      let fillOpacity = 0.01; 
      let strokeColor = '#cbd5e1'; 
      let fillColor = '#f1f5f9';

      if (!readOnly) {
        fillOpacity = 0.12;
        strokeColor = '#3b82f6';
        fillColor = '#60a5fa';
      } else if (filterByMemberEmail && isAssigned) {
        fillColor = '#22c55e'; // Verde para su territorio asignado
        strokeColor = '#16a34a';
        fillOpacity = 0.6; 
      }

      if (coords && coords.length > 0) {
        const polygon = L.polygon(coords, {
          color: strokeColor,
          weight: isAssigned && readOnly ? 3 : 1,
          fillColor: fillColor,
          fillOpacity: fillOpacity
        }).addTo(map);

        polygon.bindPopup(`<b>Congregación:</b> ${congName}`);
        polygonLayersRef.current.push(polygon);

        if (readOnly && isAssigned) {
          coords.forEach(c => bounds.extend(c));
        }
      }
    });

    if (readOnly && filterByMemberEmail && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  const drawHospitalMarkers = () => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    hospitals.forEach(hosp => {
      const coords = sanitizeHospitalCoordinates(hosp.coordenadas);
      if (coords) {
        const marker = L.marker([coords.lat, coords.lng]).addTo(markersLayerRef.current!);
        marker.bindPopup(`<div style="font-family: sans-serif; font-size: 13px;"><b>${hosp.nombre}</b></div>`);
      }
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
      {!readOnly && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-slate-200">Mapa Interactivo de Trabajo</h3>
              <p className="text-xs text-slate-400">Jurisdicción Territorial Zona 3</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onOpenHospitalModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
              Agregar Hospital
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 relative w-full h-full min-h-[340px]">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ background: '#f8fafc' }} />
      </div>
    </div>
  );
};
