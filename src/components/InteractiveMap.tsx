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
}

const DEFAULT_CONG_BOUNDARIES: Record<string, [number, number][]> = CONGREGATION_BOUNDARIES;

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onOpenHospitalModal,
  onFilterDoctorsByHospital,
  readOnly = false,
  filterByMemberEmail
}) => {
  const { hospitals, cehMembers } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayersRef = useRef<L.Polygon[]>([]);

  // 1. Inicialización única del mapa base (Garantiza que no haya fugas de memoria)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([25.2810, -100.0180], 9);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; CEH Zona 3'
    }).addTo(map);

    // Ajuste de tamaño inicial forzado
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Repintar exclusivamente los polígonos cuando cambia el correo del miembro (Sin bucles)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Limpiar polígonos de la consulta anterior
    polygonLayersRef.current.forEach(layer => layer.remove());
    polygonLayersRef.current = [];

    // Buscar las congregaciones asignadas al correo del integrante
    let assignedCongs: string[] = [];
    if (filterByMemberEmail) {
      const selectedMember = cehMembers.find(
        m => m.email?.toLowerCase().trim() === filterByMemberEmail.toLowerCase().trim()
      );
      if (selectedMember && selectedMember.congregaciones) {
        assignedCongs = selectedMember.congregaciones.map((c: any) => 
          c.toString().toLowerCase().trim()
        );
      }
    }

    const bounds = L.latLngBounds([]);

    // Dibujar cada uno de los 147 linderos de la Zona 3
    Object.entries(DEFAULT_CONG_BOUNDARIES).forEach(([congName, coords]) => {
      // Comparación limpia por texto directo en minúsculas
      const nameToCheck = congName.toLowerCase().trim();
      const isAssigned = assignedCongs.includes(nameToCheck);

      let fillOpacity = readOnly ? 0.01 : 0.12; 
      let strokeColor = readOnly ? '#cbd5e1' : '#3b82f6'; 
      let fillColor = readOnly ? '#f1f5f9' : '#60a5fa';

      // Si es el reporte del integrante y le pertenece la zona, la pintamos de verde brillante
      if (readOnly && filterByMemberEmail && isAssigned) {
        fillColor = '#22c55e';
        strokeColor = '#16a34a';
        fillOpacity = 0.55; 
      }

      if (coords && coords.length > 0) {
        const polygon = L.polygon(coords, {
          color: strokeColor,
          weight: isAssigned && readOnly ? 2.5 : 1,
          fillColor: fillColor,
          fillOpacity: fillOpacity
        }).addTo(map);

        polygonLayersRef.current.push(polygon);

        if (readOnly && isAssigned) {
          coords.forEach(c => bounds.extend(c));
        }
      }
    });

    // Auto-ajustar cámara sobre los polígonos verdes del miembro seleccionado
    if (readOnly && filterByMemberEmail && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [15, 15] });
    }
  }, [filterByMemberEmail, cehMembers, readOnly]);

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
