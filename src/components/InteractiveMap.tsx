import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { CONGREGATION_BOUNDARIES } from '../data/congregationBoundaries';
import { Compass } from 'lucide-react';

interface InteractiveMapProps {
  onOpenHospitalModal: (hosp?: any) => void;
  onFilterDoctorsByHospital: (hospitalId: string) => void;
  readOnly?: boolean;
  filterByMemberEmail?: string;
  cehMembersCustom?: any[];
}

const DEFAULT_CONG_BOUNDARIES: Record<string, [number, number][]> = CONGREGATION_BOUNDARIES;

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // LIMPIEZA DE MEMORIA: Si Leaflet ya tenía un mapa en este contenedor, lo destruimos antes de crear el nuevo
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([25.2810, -100.0180], 9);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; CEH Zona 3'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    drawCongregationBoundaries(map);
    drawHospitalMarkers();

    // Al cerrar el modal, destruir el mapa para liberar los contenedores
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [filterByMemberEmail, membersList]); // Se vuelve a construir de forma limpia si cambias de miembro

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

      // Si es el mapa del reporte, dejamos invisible el resto de la zona 3 y VERDE lo asignado
      let fillOpacity = readOnly ? 0.01 : 0.12; 
      let strokeColor = readOnly ? '#e2e8f0' : '#3b82f6'; 
      let fillColor = readOnly ? '#f8fafc' : '#60a5fa';

      if (readOnly && filterByMemberEmail && isAssigned) {
        fillColor = '#22c55e'; // Verde brillante para el reporte
        strokeColor = '#16a34a';
        fillOpacity = 0.65; 
      }

      if (coords && coords.length > 0) {
        const polygon = L.polygon(coords, {
          color: strokeColor,
          weight: isAssigned && readOnly ? 3 : 1,
          fillColor: fillColor,
          fillOpacity: fillOpacity
        }).addTo(map);

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
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    hospitals.forEach(hosp => {
      if (hosp.coordenadas) {
        // Marcador simple para evitar crasheos en modo lectura
        const marker = L.marker([25.2810, -100.0180]).addTo(markersLayerRef.current!);
        marker.bindPopup(`<b>${hosp.nombre}</b>`);
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
        </div>
      )}
      <div className="flex-1 relative w-full h-full min-h-[340px]">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ background: '#f8fafc' }} />
      </div>
    </div>
  );
};
