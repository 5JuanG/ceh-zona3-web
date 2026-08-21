import React from 'react';
import { CONGREGATION_BOUNDARIES } from '../data/congregationBoundaries';
import { Congregation } from '../types';

interface StaticTerritoryMapProps {
  congregationIds: string[];
  color?: string;
  allCongregations?: Congregation[];
}

/**
 * Mapa de territorio dibujado en SVG puro (sin tiles de mapa externos, sin
 * Leaflet). Se usa exclusivamente dentro del contenido exportable a PDF de
 * la Hoja de Trabajo: el mapa interactivo real (Leaflet + tiles de
 * OpenStreetMap) se congelaba/colgaba la app al intentar rasterizarlo con
 * html2canvas (imágenes cross-origin + cientos de nodos SVG). Este
 * componente solo dibuja los polígonos de las congregaciones asignadas
 * usando las coordenadas ya disponibles localmente, así que no depende de
 * red ni de imágenes externas.
 */
export const StaticTerritoryMap: React.FC<StaticTerritoryMapProps> = ({
  congregationIds,
  color = '#22c55e',
  allCongregations
}) => {
  const polygons = (congregationIds || [])
    .map(id => ({ id, coords: CONGREGATION_BOUNDARIES[id] }))
    .filter(p => p.coords && p.coords.length > 0);

  if (polygons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic bg-slate-50 p-4 text-center">
        Sin límites de territorio disponibles para las congregaciones asignadas a este integrante.
      </div>
    );
  }

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  polygons.forEach(p => {
    p.coords.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
  });

  const width = 800;
  const height = 600;
  const pad = 24;

  const latRange = Math.max(maxLat - minLat, 0.0005);
  const lngRange = Math.max(maxLng - minLng, 0.0005);

  // La longitud se comprime según el coseno de la latitud media para que
  // el territorio no se vea distorsionado (aproximación equirectangular).
  const midLatRad = ((minLat + maxLat) / 2) * Math.PI / 180;
  const lngScaleFactor = Math.max(Math.cos(midLatRad), 0.1);

  const effectiveLngRange = lngRange * lngScaleFactor;
  const scale = Math.min((width - pad * 2) / effectiveLngRange, (height - pad * 2) / latRange);

  const drawnWidth = effectiveLngRange * scale;
  const drawnHeight = latRange * scale;
  const offsetX = pad + (width - pad * 2 - drawnWidth) / 2;
  const offsetY = pad + (height - pad * 2 - drawnHeight) / 2;

  const project = ([lat, lng]: [number, number]): [number, number] => {
    const x = offsetX + (lng - minLng) * lngScaleFactor * scale;
    const y = offsetY + (maxLat - lat) * scale; // norte hacia arriba
    return [x, y];
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full bg-slate-50">
      {polygons.map(p => {
        const points = p.coords.map(c => project(c).join(',')).join(' ');
        const cong = allCongregations?.find(c => c.number === p.id);
        return (
          <polygon
            key={p.id}
            points={points}
            fill={color}
            fillOpacity={0.35}
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
          >
            <title>{cong?.name || p.id}</title>
          </polygon>
        );
      })}
    </svg>
  );
};
