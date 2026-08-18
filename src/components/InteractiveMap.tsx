import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { Hospital } from '../types';
import { CONGREGATION_BOUNDARIES } from '../data/congregationBoundaries';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapProps {
  onOpenHospitalModal: (hosp?: Hospital) => void;
  onFilterDoctorsByHospital: (hospitalId: string) => void;
}

interface InteractiveMapPropsExtended extends InteractiveMapProps {
  readOnly?: boolean;
  filterByMemberEmail?: string;
  cehMembersCustom?: any[];
}

const DEFAULT_CONG_BOUNDARIES: Record<string, [number, number][]> = CONGREGATION_BOUNDARIES;

const COLOR_PALETTE = [
  '#22c55e', '#eab308', '#ec4899', '#a855f7', '#f97316', 
  '#06b6d4', '#14b8a6', '#f43f5e', '#65a30d', '#0284c7'
];

export const InteractiveMap: React.FC<InteractiveMapPropsExtended> = ({
  onOpenHospitalModal,
  onFilterDoctorsByHospital,
  readOnly = false,
  filterByMemberEmail,
  cehMembersCustom
}) => {
  const { hospitals, cehMembers: globalMembers, congregations: allCongregations } = useApp();
  const membersList = cehMembersCustom || globalMembers;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayersRef = useRef<L.Polygon[]>([]);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapCenter] = useState<[number, number]>([25.6866, -100.3161]);
  const [zoomLevel] = useState<number>(readOnly ? 11 : 11);

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
    polygonLayersRef.current = [];

    const congToColorMap: Record<string, string> = {};
    const congToMemberNameMap: Record<string, string> = {};

    // Función auxiliar para normalizar textos de forma idéntica en ambas colecciones
    const normalizarTexto = (txt: string) => {
      if (!txt) return '';
      return txt.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

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
    if (filterByMemberEmail && membersList) {
      const target = membersList.find(m => m.email?.toLowerCase().trim() === filterByMemberEmail.toLowerCase().trim());
      const targetCongs = target ? (target.assignedCongregationIds || []) : [];
      singleAssignedCongs = targetCongs.map((c: any) => normalizarTexto(c));
    }

    const bounds = L.latLngBounds([]);

    Object.entries(DEFAULT_CONG_BOUNDARIES).forEach(([congName, coords]) => {
      // CORRECCIÓN CRÍTICA: Normalizar simétricamente la clave del archivo estático
      const cleanCongName = normalizarTexto(congName);
      const isAssignedToCurrent = singleAssignedCongs.includes(cleanCongName);
      
      let fillOpacity = 0.3; 
      let strokeColor = '#475569'; 
      let fillColor = congToColorMap[cleanCongName] || '#cbd5e1';

      if (filterByMemberEmail) {
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
          weight: filterByMemberEmail ? 2 : 1,
          fillColor: fillColor,
          fillOpacity: fillOpacity
        }).addTo(map);

        const owner = congToMemberNameMap[cleanCongName] || "Sin asignar";
        const congDisplayName = allCongregations?.find(c => c.number === congName)?.name || congName;
        polygon.bindPopup(`<strong>Congregación:</strong> ${congDisplayName}<br/><strong>Asignado a:</strong> ${owner}`);
        polygonLayersRef.current.push(polygon);
      }
    });

    if (filterByMemberEmail && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [membersList, filterByMemberEmail]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (hospitals && hospitals.length > 0) {
      hospitals.forEach(h => {
        if (!h.lat || !h.lng) return;
        
        if (filterByMemberEmail && membersList) {
          const target = membersList.find(m => m.email?.toLowerCase().trim() === filterByMemberEmail.toLowerCase().trim());
          if (target && h.zone !== target.zone) return;
        }

        const marker = L.marker([h.lat, h.lng]);
        marker.bindPopup(`<strong>${h.name}</strong><br/>Urgencias: ${h.phoneEmergency || 'N/A'}`);
        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [hospitals, filterByMemberEmail, membersList]);

  // CORRECCIÓN DE ALTURA MÍNIMA: Forzar h-[500px] por defecto si hereda un padre colapsado en blanco
  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full min-h-[480px] sm:min-h-[550px] rounded-xl overflow-hidden isolate shadow-inner border border-slate-200 z-10"
      style={{ height: '100%', width: '100%', position: 'relative' }}
    />
  );
};
