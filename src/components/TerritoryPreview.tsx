import React from 'react';
import { CONGREGATION_BOUNDARIES } from '../data/congregationBoundaries';
import { Hospital } from '../types';

interface TerritoryPreviewProps {
  assignedCongregationIds: string[];
  hospitals: Hospital[];
  memberColor?: string;
}

const normalize = (v: any) => v.toString().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Dibuja el territorio asignado a un miembro como SVG puro (sin tiles de mapa
 * externos ni CSS transforms de Leaflet). Se usa dentro de la Hoja de Trabajo /
 * informe en PDF porque html2canvas no captura de forma confiable un mapa de
 * Leaflet en vivo (los tiles se posicionan con transform: translate3d y se
 * cargan de forma asíncrona, lo que hace que se vean encimados o cortados en
 * el PDF exportado). Este SVG es determinista y siempre se ve igual en pantalla
 * y en el PDF.
 */
export const TerritoryPreview: React.FC<TerritoryPreviewProps> = ({ assignedCongregationIds, hospitals, memberColor }) => {
  const assignedSet = new Set((assignedCongregationIds || []).map(normalize));

  const assignedPolygons = Object.entries(CONGREGATION_BOUNDARIES).filter(
    ([congNumber]) => assignedSet.has(normalize(congNumber))
  );

  if (assignedPolygons.length === 0) {
    return (
      <div className="bg-slate-100 h-80 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs italic">
        Este integrante todavía no tiene congregaciones asignadas.
      </div>
    );
  }

  // Bounding box en lat/lng de todas las congregaciones asignadas
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  assignedPolygons.forEach(([, coords]) => {
    coords.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
  });

  const VIEW_W = 600;
  const VIEW_H = 320;
  const PADDING = 24;

  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const lngSpan = Math.max(maxLng - minLng, 0.0001);
  const scaleX = (VIEW_W - PADDING * 2) / lngSpan;
  const scaleY = (VIEW_H - PADDING * 2) / latSpan;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = PADDING + ((VIEW_W - PADDING * 2) - lngSpan * scale) / 2;
  const offsetY = PADDING + ((VIEW_H - PADDING * 2) - latSpan * scale) / 2;

  const project = (lat: number, lng: number): [number, number] => {
    const x = offsetX + (lng - minLng) * scale;
    const y = offsetY + (maxLat - lat) * scale; // invertido: lat mayor = arriba
    return [x, y];
  };

  const color = memberColor || '#22c55e';

  const hospitalsInBounds = (hospitals || []).filter(
    h => h.coordinates && h.coordinates.lat >= minLat && h.coordinates.lat <= maxLat &&
         h.coordinates.lng >= minLng && h.coordinates.lng <= maxLng
  );

  return (
    <div className="bg-slate-100 h-80 rounded-lg border border-slate-200 overflow-hidden shadow-inner">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-full" role="img" aria-label="Territorio asignado">
        <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#f1f5f9" />
        {assignedPolygons.map(([congNumber, coords]) => {
          const points = coords.map(([lat, lng]) => project(lat, lng).join(',')).join(' ');
          return (
            <polygon
              key={congNumber}
              points={points}
              fill={color}
              fillOpacity={0.45}
              stroke={color}
              strokeWidth={1.5}
            />
          );
        })}
        {hospitalsInBounds.map(h => {
          const [x, y] = project(h.coordinates!.lat, h.coordinates!.lng);
          return (
            <g key={h.id}>
              <circle cx={x} cy={y} r={4} fill="#1e3a8a" stroke="white" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
