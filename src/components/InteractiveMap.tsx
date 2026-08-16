import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { CONGREGATION_BOUNDARIES } from '../data/congregationBoundaries';
import { Compass, PlusCircle, Layers } from 'lucide-react';

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
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Inicialización limpia del mapa base centrado en la Zona 3
    const map = L.map(mapContainerRef.current).setView([25.4000, -100.0000], 9);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; CEH Zona 3'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    // Renderizado inicial forzado
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Repintar los polígonos de forma reactiva y estable
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    polygonLayersRef.current.forEach(layer => layer.remove());
    polygonLayersRef.current = [];

    // Extraer congregaciones del miembro si estamos en modo reporte
    let assignedCongs: string[] = [];
    if (filterByMemberEmail && cehMembers) {
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

    // Dibujar linderos con la coloración correcta según el entorno (Dashboard vs Reporte PDF)
    Object.entries(DEFAULT_CONG_BOUNDARIES).forEach(([congName, coords]) => {
      const nameToCheck = congName.toLowerCase().trim();
      const isAssigned = assignedCongs.includes(nameToCheck);

      // VALORES DE COLORACIÓN INTEGRADOS:
      let fillOpacity = 0.12; 
      let strokeColor = '#3b82f6'; // Azul nítido de control
      let fillColor = '#60a5fa';

      if (readOnly) {
        // Si es el reporte del PDF, opacamos las zonas ajenas y pintamos de verde la del miembro
        if (filterByMemberEmail && isAssigned) {
          fillColor = '#22c55e'; // Verde brillante
          strokeColor = '#16a34a';
          fillOpacity = 0.55;
        } else {
          fillOpacity = 0.01; // Zonas secundarias semi-invisibles
          strokeColor = '#e2e8f0';
          fillColor = '#f8fafc';
        }
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

    // Auto-ajuste de cámara exclusivo para el PDF
    if (readOnly && filterByMemberEmail && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [filterByMemberEmail, cehMembers, readOnly]);

  // Dibujar marcadores de hospitales
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    if (hospitals && hospitals.length > 0) {
      hospitals.forEach(hosp => {
        // Si el hospital tiene coordenadas válidas, se mapea en su lugar real
        if (hosp.coordenadas?.lat && hosp.coordenadas?.lng) {
          const marker = L.marker([hosp.coordenadas.lat, hosp.coordenadas.lng]).addTo(markersLayerRef.current!);
          marker.bindPopup(`<b>${hosp.nombre}</b>`);
        }
      });
    }
  }, [hospitals]);

  return (
    <div className="w-full flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" /> Agregar Hospital
            </button>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
              <Layers className="h-3.5 w-3.5 text-blue-500" />
              <span>147 Congregaciones</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 
        CORRECCIÓN DEL EMPALME: 
        Cambiamos 'absolute' por 'relative' y definimos una altura responsiva fija 
        para obligar al mapa a respetar el flujo del formulario en el modal.
      */}
      <div className="relative w-full h-[380px] sm:h-[420px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
