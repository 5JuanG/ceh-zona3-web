import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import JSZip from 'jszip';
import { useApp } from '../context/AppContext';
import { Hospital, CEHMember, Congregation } from '../types';
import { parseGoogleMapsUrl, getCityFallbackCoordinates, sanitizeHospitalCoordinates } from '../utils/googleMapsParser';
import { CONGREGATION_BOUNDARIES } from '../data/congregationBoundaries';
import { 
  MapPin, 
  Building2, 
  Upload, 
  Layers, 
  ShieldCheck, 
  Phone, 
  UserCheck, 
  PlusCircle, 
  Info, 
  CheckCircle2, 
  RefreshCw,
  FileCode,
  Globe,
  Navigation,
  Compass,
  Users,
  Filter,
  Sparkles,
  ExternalLink,
  Search,
  Target,
  Eye,
  Trash2,
  Code,
  Clipboard,
  FileText
} from 'lucide-react';

interface InteractiveMapProps {
  onOpenHospitalModal: (hosp?: Hospital) => void;
  onFilterDoctorsByHospital: (hospitalId: string) => void;
}

interface ZonePolygonData {
  name: string;
  coordinates: [number, number][]; // [lat, lng]
}

const STORAGE_KEY_MAP_ZONE = 'clh_app_map_zone_3_v1';
const STORAGE_KEY_CONG_BOUNDARIES = 'ceh_congregation_kml_boundaries_v3';

// Los límites de las 147 congregaciones de la Zona 3 ahora vienen incluidos
// en el propio código (src/data/congregationBoundaries.ts, extraído del
// CEHzona3.kmz), así que siempre están disponibles sin depender de que
// alguien los suba de nuevo al navegador. Si en el futuro se sube un KML
// nuevo desde esta pantalla, esa versión (guardada en localStorage) tiene
// prioridad sobre estos valores por defecto.
const DEFAULT_CONG_BOUNDARIES: Record<string, [number, number][]> = CONGREGATION_BOUNDARIES;

// Helper to parse raw KML text, GeoJSON, or plain coordinate lists
const parseRawKmlOrTextContent = (text: string) => {
  let parsedCoordinates: [number, number][] = [];
  let pointsExtracted: { name: string; lat: number; lng: number }[] = [];
  let detectedName = '';

  if (!text || !text.trim()) return { parsedCoordinates, pointsExtracted, detectedName };

  const trimmed = text.trim();

  // 1. JSON / GeoJSON
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
      if (json.type === 'FeatureCollection' && json.features) {
        json.features.forEach((feat: any) => {
          if (feat.properties?.name) detectedName = feat.properties.name;
          if (feat.geometry?.type === 'Polygon' && Array.isArray(feat.geometry.coordinates)) {
            const ring = feat.geometry.coordinates[0];
            ring.forEach((c: any) => {
              const lng = parseFloat(c[0]);
              const lat = parseFloat(c[1]);
              if (!isNaN(lat) && !isNaN(lng)) parsedCoordinates.push([lat, lng]);
            });
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. KML XML Parsing
  if (parsedCoordinates.length === 0) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(trimmed, 'text/xml');

      const placemarks = xmlDoc.getElementsByTagName('Placemark');
      for (let i = 0; i < placemarks.length; i++) {
        const pm = placemarks[i];
        const nameEl = pm.getElementsByTagName('name')[0];
        const pmName = nameEl?.textContent?.trim() || '';

        // Extract Polygon coordinates
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

        // Extract Point coordinates separately for GPS points/hospitals
        const pointCoords = pm.getElementsByTagName('Point')[0]?.getElementsByTagName('coordinates')[0];
        if (pointCoords && pointCoords.textContent) {
          const parts = pointCoords.textContent.trim().split(',');
          if (parts.length >= 2) {
            const n1 = parseFloat(parts[0]);
            const n2 = parseFloat(parts[1]);
            if (!isNaN(n1) && !isNaN(n2)) {
              const lat = Math.abs(n1) > Math.abs(n2) ? n2 : n1;
              const lng = Math.abs(n1) > Math.abs(n2) ? n1 : n2;
              pointsExtracted.push({ name: pmName || detectedName || 'Punto GPS', lat, lng });
            }
          }
        }
      }

      if (parsedCoordinates.length === 0) {
        const allCoords = xmlDoc.getElementsByTagName('coordinates');
        for (let i = 0; i < allCoords.length; i++) {
          const raw = allCoords[i].textContent?.trim();
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
    } catch (e) {
      // ignore
    }
  }

  // 3. Fallback Regex for raw coordinate text
  if (parsedCoordinates.length === 0) {
    const coordMatch = trimmed.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
    const textToScan = coordMatch ? coordMatch[1] : trimmed;
    const tokens = textToScan.split(/[\r\n\s]+/);

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

  return { parsedCoordinates, pointsExtracted, detectedName };
};

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Guadalupe': { lat: 25.6780, lng: -100.2570 },
  'Ciudad Benito Juárez': { lat: 25.6470, lng: -100.0960 },
  'Juárez': { lat: 25.6470, lng: -100.0960 },
  'Cadereyta Jiménez': { lat: 25.5880, lng: -99.9920 },
  'San Juan': { lat: 25.6100, lng: -99.9200 },
  'Allende': { lat: 25.2810, lng: -100.0180 },
  'Montemorelos': { lat: 25.1880, lng: -99.8270 },
  'General Terán': { lat: 25.2600, lng: -99.6800 },
  'Hualahuises': { lat: 24.8810, lng: -99.6730 },
  'Linares': { lat: 24.8620, lng: -99.5670 },
  'El Guajolote': { lat: 24.8900, lng: -99.5200 },
  'Rayones': { lat: 25.0180, lng: -100.0560 },
  'Iturbide': { lat: 24.7230, lng: -99.9020 },
  'Galeana': { lat: 24.8320, lng: -100.0760 },
  'General Zaragoza': { lat: 23.9740, lng: -99.7710 },
  'Aramberri': { lat: 24.1030, lng: -99.8200 },
  'La Ascensión': { lat: 24.0800, lng: -100.0200 },
  'Doctor Arroyo': { lat: 23.6700, lng: -100.1780 },
  'Mier y Noriega': { lat: 23.4210, lng: -100.1230 },
  'China': { lat: 25.7040, lng: -99.2380 },
  'General Bravo': { lat: 25.7950, lng: -99.1780 },
  'Doctor Coss': { lat: 25.9220, lng: -99.1720 },
  'Los Ramones': { lat: 25.7000, lng: -99.6100 },
  'General Tapia': { lat: 25.6800, lng: -99.7500 },
  'General Lucio Blanco': { lat: 25.7500, lng: -99.3000 },
  'Guadalupe la Joya': { lat: 25.6500, lng: -100.2200 },
  'La Cebadilla': { lat: 24.9000, lng: -99.6000 },
  'La Escondida': { lat: 24.9500, lng: -99.6300 },
  'Monterrey': { lat: 25.6710, lng: -100.3090 },
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onOpenHospitalModal,
  onFilterDoctorsByHospital
}) => {
  const { hospitals, doctors, updateHospital, deleteHospital, addHospital, cehMembers, congregations } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const congregationsLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);

  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [showCongregationTerritories, setShowCongregationTerritories] = useState<boolean>(true);
  const [showHospitalsOnMap, setShowHospitalsOnMap] = useState<boolean>(true);

  const [zoneData, setZoneData] = useState<ZonePolygonData | null>(() => {
    localStorage.removeItem(STORAGE_KEY_MAP_ZONE);
    return null;
  });

  // Exact congregation boundaries dictionary: empieza con los 147 polígonos
  // incluidos en la app y les aplica encima cualquier ajuste manual que se
  // haya guardado localmente (por ejemplo, subir un KML actualizado).
  const [congregationBoundaries, setCongregationBoundaries] = useState<Record<string, [number, number][]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONG_BOUNDARIES);
    if (saved) {
      try {
        const parsedSaved = JSON.parse(saved);
        return { ...DEFAULT_CONG_BOUNDARIES, ...parsedSaved };
      } catch (e) {
        return DEFAULT_CONG_BOUNDARIES;
      }
    }
    return DEFAULT_CONG_BOUNDARIES;
  });

  const [selectedCongForUpload, setSelectedCongForUpload] = useState<string>('');
  const [extractedHospitals, setExtractedHospitals] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string>('Zona 3');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('todos');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showHowToGuide, setShowHowToGuide] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'members' | 'hospital'>('members');
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [showLoadedBoundariesList, setShowLoadedBoundariesList] = useState<boolean>(false);
  const [hospitalToDeleteMap, setHospitalToDeleteMap] = useState<Hospital | null>(null);
  const [relocatingHospitalId, setRelocatingHospitalId] = useState<string | null>(null);
  const [relocateSuccessMsg, setRelocateSuccessMsg] = useState<string | null>(null);
  const [pastedKmlText, setPastedKmlText] = useState<string>('');

  // Keep default upload congregation select synced with congregations list
  useEffect(() => {
    if (congregations.length > 0) {
      if (!selectedCongForUpload || !congregations.some(c => c.name === selectedCongForUpload)) {
        setSelectedCongForUpload(congregations[0].name);
      }
    }
  }, [congregations, selectedCongForUpload]);

  // Handle relocating hospital location on map click
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const container = map.getContainer();

    if (!relocatingHospitalId) {
      container.classList.remove('relocating-mode');
      container.style.cursor = '';
      return;
    }

    container.classList.add('relocating-mode');
    container.style.setProperty('cursor', 'crosshair', 'important');

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));

      const hospToUpdate = hospitals.find(h => h.id === relocatingHospitalId);
      if (hospToUpdate) {
        updateHospital(hospToUpdate.id, {
          coordinates: { lat, lng }
        });
        setRelocateSuccessMsg(`📍 ¡Ubicación de "${hospToUpdate.shortName || hospToUpdate.name}" fijada correctamente en (${lat}, ${lng})!`);
        setTimeout(() => setRelocateSuccessMsg(null), 5000);
      }
      setRelocatingHospitalId(null);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      if (container) {
        container.classList.remove('relocating-mode');
        container.style.cursor = '';
      }
    };
  }, [relocatingHospitalId, hospitals, updateHospital]);

  // Helper to find assigned CEH member for a congregation
  const getAssignedMemberForCongregation = (cong: Congregation): CEHMember | undefined => {
    if (cong.assignedMemberId) {
      const found = cehMembers.find(m => m.id === cong.assignedMemberId);
      if (found) return found;
    }
    if (cong.assignedMemberName) {
      const searchName = cong.assignedMemberName.trim().toLowerCase();
      const found = cehMembers.find(m => {
        const mName = m.name.toLowerCase();
        return mName === searchName || mName.includes(searchName) || searchName.includes(mName) ||
          (searchName.includes('robert') && mName.includes('robert'));
      });
      if (found) return found;
    }
    const foundByArray = cehMembers.find(m => 
      m.assignedCongregationIds.some(assigned => {
        const a = String(assigned).trim().toLowerCase();
        const cNum = cong.number.toLowerCase();
        const cName = cong.name.toLowerCase();
        return a === cNum || 
               a === cName || 
               (cong.id && a === cong.id.toLowerCase());
      })
    );
    if (foundByArray) return foundByArray;

    return undefined;
  };

  // Helper to get boundary polygon points for a congregation
  const getCongregationPolygonData = (cong: Congregation): { points: [number, number][]; isExactKML: boolean; isExcluded?: boolean } => {
    // 1. Check exact KML boundaries by name or number
    let exactKMLCoords = congregationBoundaries[cong.name] || congregationBoundaries[cong.number];

    // 2. Flexible match by partial name or number
    if (!exactKMLCoords || exactKMLCoords.length < 3) {
      const congNameClean = cong.name.toLowerCase().split(',')[0].trim();
      const foundEntry = Object.entries(congregationBoundaries).find(([key, pts]) => {
        const ptsArr = pts as [number, number][];
        if (!ptsArr || !Array.isArray(ptsArr) || ptsArr.length < 3) return false;
        const keyLower = key.toLowerCase();
        return (
          keyLower === cong.number ||
          keyLower === congNameClean ||
          keyLower.includes(congNameClean) ||
          congNameClean.includes(keyLower) ||
          keyLower.replace(/\s+/g, '') === congNameClean.replace(/\s+/g, '')
        );
      });
      if (foundEntry) {
        exactKMLCoords = foundEntry[1] as [number, number][];
      }
    }

    if (exactKMLCoords && exactKMLCoords.length >= 3) {
      return { points: exactKMLCoords, isExactKML: true };
    }

    // Only exact boundaries uploaded by committee members are displayed
    return { points: [], isExactKML: false };
  };

  // Zoom and focus map on a specific member's coverage area
  const focusMemberOnMap = (memberId: string) => {
    setSelectedMemberFilter(memberId);
    setShowCongregationTerritories(true);
    setSidebarTab('members');

    const memberCongs = congregations.filter(c => {
      const assigned = getAssignedMemberForCongregation(c);
      return assigned?.id === memberId;
    });

    const allCoords: [number, number][] = [];

    memberCongs.forEach(c => {
      const { points } = getCongregationPolygonData(c);
      if (points && points.length > 0) {
        allCoords.push(...points);
      }
    });

    if (allCoords.length > 0 && mapInstanceRef.current) {
      try {
        const bounds = L.latLngBounds(allCoords);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (err) {
        console.error('Error fitting bounds', err);
      }
    } else {
      // Fallback: search hospitals assigned to this member and center on them
      const memberHospitals = hospitals.filter(h => h.assignedCEHMemberId === memberId || memberCongs.some(c => c.number === h.congregationNumber));
      const hospCoords: [number, number][] = [];
      memberHospitals.forEach(h => {
        if (h.coordinates?.lat && h.coordinates?.lng) {
          hospCoords.push([h.coordinates.lat, h.coordinates.lng]);
        }
      });
      if (hospCoords.length > 0 && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.fitBounds(L.latLngBounds(hospCoords), { padding: [50, 50], maxZoom: 14 });
        } catch (e) {
          console.error('Error fitting hospital bounds', e);
        }
      }
    }
  };

  // Fix default Leaflet icon assets in React/Vite
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Helper to find assigned CEH member for a hospital
  const getAssignedCEHMember = (hosp: Hospital): CEHMember | undefined => {
    if (hosp.assignedCEHMemberId) {
      return cehMembers.find(m => m.id === hosp.assignedCEHMemberId);
    }
    if (hosp.congregationNumber) {
      const cong = congregations.find(c => c.number === hosp.congregationNumber);
      if (cong?.assignedMemberId) {
        return cehMembers.find(m => m.id === cong.assignedMemberId);
      }
    }
    return undefined;
  };

  // Filter hospitals for map display
  const filteredHospitals = hospitals.filter(h => {
    if (zoneFilter !== 'todas' && h.zone && h.zone !== zoneFilter && !h.zone.includes('Zona 3')) return false;
    if (selectedType !== 'todos' && h.type !== selectedType) return false;
    
    if (selectedMemberFilter !== 'todos') {
      const assigned = getAssignedCEHMember(h);
      if (!assigned || assigned.id !== selectedMemberFilter) return false;
    }

    return true;
  });

  // Unique zones for dropdown
  const uniqueZones = Array.from(new Set(hospitals.map(h => h.zone))).filter(Boolean);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Clear any stale Leaflet ID from DOM container to prevent "Map container is already initialized" crash
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      let initialLat = 25.6780; // Center on Guadalupe / Monterrey NL
      let initialLng = -100.2570;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      congregationsLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Force Leaflet recalculate container size on load
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 400);
    }

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Render Congregation Territory Polygons (Colors per CEH Member)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const congLayer = congregationsLayerRef.current;
    if (!map || !congLayer) return;

    congLayer.clearLayers();

    if (!showCongregationTerritories) return;

    // Sort congregations so unassigned or excluded congregations render FIRST (at the bottom)
    // and assigned CEH member polygons render LAST (on top with crisp, vibrant colors)
    const sortedCongregations = [...congregations].sort((a, b) => {
      const memberA = getAssignedMemberForCongregation(a);
      const memberB = getAssignedMemberForCongregation(b);
      if (!memberA && memberB) return -1;
      if (memberA && !memberB) return 1;
      return 0;
    });

    sortedCongregations.forEach((cong) => {
      // Find assigned CEH member using helper
      const assignedMember = getAssignedMemberForCongregation(cong);

      // Get polygon coordinates (exact KML or generated territory)
      const { points, isExactKML } = getCongregationPolygonData(cong);

      if (!points || points.length < 3) return;

      const isFiltered = selectedMemberFilter === 'todos' || (assignedMember && assignedMember.id === selectedMemberFilter);

      let color = '#000000';
      let fillColor = isExactKML ? '#475569' : '#94a3b8';
      let fillOpacity = isExactKML ? 0.08 : 0.05;
      let weight = isExactKML ? 2.5 : 2;
      let dashArray: string | undefined = undefined;

      if (assignedMember) {
        // Vibrant border color for assigned CEH member with balanced translucent fill
        color = assignedMember.color;
        fillColor = assignedMember.color;
        // Translucent fill so map streets, topography and labels remain crisp and readable
        fillOpacity = isFiltered 
          ? (selectedMemberFilter === assignedMember.id ? 0.30 : 0.16) 
          : 0.10;
        weight = selectedMemberFilter === assignedMember.id ? 3.5 : 2.5;
      } else if (cong.isExcludedFromTerritory) {
        color = '#b45309';
        fillColor = '#f59e0b';
        fillOpacity = isFiltered ? 0.12 : 0.05;
        weight = 1.5;
        dashArray = '4, 4';
      }

      const polygon = L.polygon(points, {
        color,
        fillColor,
        fillOpacity,
        weight,
        dashArray,
        // Las congregaciones excluidas del reparto territorial no reaccionan
        // al pasar el mouse (sin tooltip ni resaltado) para reducir el ruido
        // visual al recorrer el mapa; su contorno punteado sigue visible.
        interactive: !cong.isExcludedFromTerritory
      }).addTo(congLayer);

      const memberShortName = assignedMember ? `👤 ${assignedMember.name}` : (cong.isExcludedFromTerritory ? '⚠️ Excluida' : '⚪ Sin Asignar');
      
      polygon.bindTooltip(`
        <div style="font-family: system-ui, sans-serif; padding: 3px 6px;">
          <strong style="font-size: 11.5px; color: #0f172a;">#${cong.number} ${cong.name} ${isExactKML ? '📍' : ''}</strong><br/>
          <span style="font-size: 10px; font-weight: bold; color: ${assignedMember ? assignedMember.color : '#64748b'};">
            ${memberShortName}
          </span>
          ${isExactKML ? '<br/><span style="font-size: 9px; color: #0f172a; font-weight: bold;">📍 Límite KML Exacto</span>' : ''}
        </div>
      `, { permanent: false, direction: 'top', sticky: true });

      polygon.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 250px; margin: -1px;">
          <div style="background: ${assignedMember ? assignedMember.color : '#334155'}; color: white; padding: 10px 14px; border-radius: 8px 8px 0 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 10px; opacity: 0.9; text-transform: uppercase; font-weight: bold;">Territorio de Congregación</span>
              ${isExactKML ? '<span style="background: rgba(255,255,255,0.25); border-radius: 10px; padding: 2px 7px; font-size: 9.5px; font-weight: bold;">📍 Mapa KML Cargado</span>' : ''}
            </div>
            <div style="font-size: 15px; font-weight: 800; margin-top: 3px;">#${cong.number} ${cong.name}</div>
          </div>
          <div style="padding: 12px; background: white; border-radius: 0 0 8px 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px;">
              <span style="color: #475569;">Ciudad: <strong>${cong.city}</strong></span>
              <span style="color: #475569;">Circuito: <strong>${cong.circuitSection}</strong></span>
            </div>
            <div style="font-size: 11px; color: #334155; margin-bottom: 8px; background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
              👥 <strong>${cong.publishersCount}</strong> publicadores | <strong>${cong.eldersCount}</strong> ancianos | <strong>${cong.pioneersCount}</strong> prec.
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 6px;">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">
                Integrante CEH Asignado:
              </div>
              ${assignedMember ? `
                <div style="display: flex; align-items: center; gap: 8px; background: ${assignedMember.color}20; padding: 8px; border-radius: 8px; border: 2px solid ${assignedMember.color};">
                  <span style="width: 14px; height: 14px; border-radius: 50%; background-color: ${assignedMember.color}; display: inline-block; flex-shrink: 0; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></span>
                  <div>
                    <strong style="color: #0f172a; font-size: 12px; display: block;">${assignedMember.name}</strong>
                    <span style="font-size: 10px; color: #475569;">${assignedMember.role || 'Enlace Hospitalario'} ${assignedMember.phone ? '• 📞 ' + assignedMember.phone : ''}</span>
                  </div>
                </div>
              ` : cong.isExcludedFromTerritory ? `
                <div style="background: #fef3c7; color: #92400e; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; border: 1px solid #fcd34d;">
                  ⚠️ ${cong.exclusionReason || 'Excluida del reparto territorial'}
                </div>
              ` : `
                <div style="background: #f1f5f9; color: #64748b; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-style: italic;">
                  ⚪ Sin integrante asignado
                </div>
              `}
            </div>
          </div>
        </div>
      `);
    });
  }, [showCongregationTerritories, congregations, cehMembers, selectedMemberFilter, congregationBoundaries]);

  // Render Hospital Markers with CEH Member Color Coding
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (!showHospitalsOnMap) return;

    const bounds: L.LatLngExpression[] = [];

    filteredHospitals.forEach((hosp, idx) => {
      let lat: number | undefined = undefined;
      let lng: number | undefined = undefined;

      const sanitized = sanitizeHospitalCoordinates(hosp.coordinates);
      if (sanitized) {
        lat = sanitized.lat;
        lng = sanitized.lng;
      }

      if (lat === undefined || lng === undefined) {
        if (hosp.googleMapsUrl) {
          const parsed = parseGoogleMapsUrl(hosp.googleMapsUrl);
          const parsedSanitized = sanitizeHospitalCoordinates(parsed.coordinates);
          if (parsedSanitized) {
            lat = parsedSanitized.lat;
            lng = parsedSanitized.lng;
          }
        }
      }

      if (lat === undefined || lng === undefined) {
        const cityCoords = getCityFallbackCoordinates(hosp.city) || getCityFallbackCoordinates(hosp.address) || getCityFallbackCoordinates(hosp.name);
        if (cityCoords) {
          lat = cityCoords.lat + (((idx % 5) - 2) * 0.0008);
          lng = cityCoords.lng + (((idx % 5) - 2) * 0.0008);
        }
      }

      if (lat === undefined || lng === undefined) {
        lat = 25.6710 + (((idx % 5) - 2) * 0.0008);
        lng = -100.3090 + (((idx % 5) - 2) * 0.0008);
      }

      bounds.push([lat, lng]);

      const doctorCount = doctors.filter(d => d.hospitalIds.includes(hosp.id)).length;
      const assignedMember = getAssignedCEHMember(hosp);

      const pinBgColor = assignedMember ? assignedMember.color : (hosp.pbmProtocolsAccepted ? '#0284c7' : '#d97706');
      const cong = hosp.congregationNumber ? congregations.find(c => c.number === hosp.congregationNumber) : undefined;

      const customHtmlIcon = L.divIcon({
        className: 'custom-hospital-globito-pin',
        html: `
          <div style="
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background-color: ${pinBgColor};
            border: 3px solid #ffffff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            cursor: grab;
            transition: transform 0.15s ease-in-out;
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -10],
        tooltipAnchor: [0, -10]
      });

      const marker = L.marker([lat, lng], { icon: customHtmlIcon, draggable: true }).addTo(markersLayer);

      // Save new coordinates automatically on drag and drop
      marker.on('dragend', (e: L.LeafletEvent) => {
        const targetMarker = e.target as L.Marker;
        const newLatLng = targetMarker.getLatLng();
        const newLat = parseFloat(newLatLng.lat.toFixed(6));
        const newLng = parseFloat(newLatLng.lng.toFixed(6));

        updateHospital(hosp.id, {
          coordinates: { lat: newLat, lng: newLng }
        });

        setSelectedHospital(prev => prev?.id === hosp.id ? { ...prev, coordinates: { lat: newLat, lng: newLng } } : prev);

        setRelocateSuccessMsg(`📍 ¡Ubicación de "${hosp.shortName || hosp.name}" ajustada a (${newLat}, ${newLng})!`);
        setTimeout(() => setRelocateSuccessMsg(null), 5000);
      });

      // Tooltip on hover: ahora que el ícono es solo un punto de color, aquí
      // se concentra la información relevante al pasar el mouse (sin abrir nada).
      marker.bindTooltip(`
        <div style="font-family: system-ui, sans-serif; padding: 3px 5px; text-align: left; min-width: 160px;">
          <strong style="font-size: 12.5px; color: #0f172a; display: block; margin-bottom: 2px;">🏥 ${hosp.shortName || hosp.name}</strong>
          ${hosp.city ? `<span style="font-size: 10.5px; color: #475569; display: block;">📍 ${hosp.city}</span>` : ''}
          <span style="font-size: 10.5px; font-weight: bold; color: ${pinBgColor}; display: block; margin-top: 2px;">
            ${assignedMember ? `👤 Enlace: ${assignedMember.name}` : '⚪ Sin CEH asignado'}
          </span>
          <span style="font-size: 10px; color: #64748b;">
            ${doctorCount} médico${doctorCount !== 1 ? 's' : ''} registrado${doctorCount !== 1 ? 's' : ''}
            ${hosp.pbmProtocolsAccepted ? ' · ✅ PBM' : ''}
          </span>
          <span style="font-size: 9px; color: #94a3b8; display: block; margin-top: 3px;">🖐️ Clic para ver detalles · arrastre para mover</span>
        </div>
      `, { permanent: false, direction: 'top', sticky: true, offset: [0, -6] });

      // Rich popup with full hospital data on click
      marker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; width: 285px; margin: -1px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
          <!-- Header with CEH Member Color -->
          <div style="background: ${pinBgColor}; color: white; padding: 12px 14px; border-radius: 8px 8px 0 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="background: rgba(255,255,255,0.22); padding: 2px 8px; border-radius: 10px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                🏥 ${hosp.type === 'publico' ? 'Público' : hosp.type === 'privado' ? 'Privado' : 'Hospital / Clínica'}
              </span>
              <span style="font-size: 10px; opacity: 0.9; font-weight: 600;">
                ${hosp.zone || 'Zona 3'}
              </span>
            </div>
            <div style="font-size: 15px; font-weight: 800; line-height: 1.2; margin-top: 2px;">
              ${hosp.name}
            </div>
            ${hosp.shortName && hosp.shortName !== hosp.name ? `
              <div style="font-size: 11px; opacity: 0.88; margin-top: 2px; font-weight: 500;">
                (${hosp.shortName})
              </div>
            ` : ''}
          </div>

          <!-- Body with details -->
          <div style="padding: 12px 14px; background: white; color: #1e293b;">
            <!-- Address & City -->
            <div style="margin-bottom: 8px; font-size: 11px; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
              📍 <strong>Dirección:</strong> ${hosp.address || 'No especificada'}${hosp.city ? `, ${hosp.city}` : ''}
            </div>

            <!-- Emergency & General Phones -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; font-size: 11px;">
              <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 6px 8px; border-radius: 6px; color: #991b1b;">
                <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; display: block; color: #7f1d1d;">🚨 Urgencias</span>
                <strong style="font-size: 11px;">${hosp.phoneEmergency || 'Sin Registro'}</strong>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 8px; border-radius: 6px; color: #334155;">
                <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; display: block; color: #64748b;">📞 Conmutador</span>
                <strong style="font-size: 11px;">${hosp.phoneGeneral || 'Sin Registro'}</strong>
              </div>
            </div>

            <!-- Assigned CEH Member -->
            <div style="margin-bottom: 10px;">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">
                Integrante CEH Asignado:
              </div>
              ${assignedMember ? `
                <div style="display: flex; align-items: center; gap: 8px; background: ${assignedMember.color}15; padding: 7px 9px; border-radius: 8px; border: 1.5px solid ${assignedMember.color};">
                  <span style="width: 12px; height: 12px; border-radius: 50%; background-color: ${assignedMember.color}; display: inline-block; flex-shrink: 0; box-shadow: 0 0 3px rgba(0,0,0,0.3);"></span>
                  <div>
                    <strong style="color: #0f172a; font-size: 11.5px; display: block;">${assignedMember.name}</strong>
                    <span style="font-size: 10px; color: #475569;">${assignedMember.phone ? '📞 ' + assignedMember.phone : (assignedMember.role || 'Enlace Hospitalario')}</span>
                  </div>
                </div>
              ` : `
                <div style="background: #f1f5f9; color: #64748b; padding: 6px 8px; border-radius: 6px; font-size: 10.5px; font-style: italic;">
                  ⚪ Sin integrante de comité asignado
                </div>
              `}
            </div>

            <!-- Territory Congregation & Protocols -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 8px; font-size: 10.5px; margin-bottom: 10px;">
              ${cong ? `
                <div style="color: #0f172a; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px dashed #cbd5e1;">
                  🏰 <strong>Territorio:</strong> #${cong.number} ${cong.name}
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; color: #334155; margin-bottom: 2px;">
                <span>🩺 Protocolos PBM:</span>
                <strong>${hosp.pbmProtocolsAccepted ? '✅ Aceptados' : '❌ Sin confirmar'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; color: #334155; margin-bottom: 2px;">
                <span>🩸 Cirugía Sin Sangre:</span>
                <strong>${hosp.acceptsBloodlessSurgery ? '✅ Acepta' : '❌ Sin confirmar'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; color: #334155; margin-top: 3px; padding-top: 3px; border-top: 1px solid #e2e8f0;">
                <span>👨‍⚕️ Médicos Registrados:</span>
                <strong style="color: #0284c7;">${doctorCount} médicos</strong>
              </div>
            </div>

            ${hosp.contactPerson ? `
              <div style="font-size: 10.5px; color: #475569; margin-bottom: 8px;">
                👤 <strong>Contacto en Hospital:</strong> ${hosp.contactPerson}
              </div>
            ` : ''}

            <!-- Drag Hint -->
            <div style="margin-top: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 8px; border-radius: 6px; font-size: 10px; color: #166534; text-align: center;">
              🖐️ <strong>Mover posición:</strong> Arrastre este ícono 🏥 directamente sobre el mapa para ubicarlo con precisión.
            </div>

            ${hosp.googleMapsUrl ? `
              <a href="${hosp.googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #0284c7; color: white; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; text-decoration: none; margin-top: 6px;">
                🗺️ Abrir en Google Maps
              </a>
            ` : ''}
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedHospital(hosp);
        setSidebarTab('hospital');
        map.panTo([lat, lng]);
      });
    });

    if (bounds.length > 0 && !zoneData && !showCongregationTerritories) {
      try {
        map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 14 });
      } catch (e) {
        console.log('Error fitting bounds:', e);
      }
    }
  }, [filteredHospitals, doctors, zoneData, cehMembers, congregations, showHospitalsOnMap]);

  // Render Zone Boundary Polygon (e.g., "Zona 3")
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }

    if (zoneData && zoneData.coordinates.length > 0) {
      const polygon = L.polygon(zoneData.coordinates, {
        color: '#f59e0b', // Amber-500
        weight: 3,
        fillColor: '#fef3c7', // Amber-100
        fillOpacity: 0.35,
        dashArray: '6, 6'
      }).addTo(map);

      polygon.bindTooltip(`Delimitación: ${zoneData.name}`, { permanent: false, direction: 'center' });
      polygonLayerRef.current = polygon;

      try {
        map.fitBounds(polygon.getBounds(), { padding: [40, 40] });
      } catch (e) {
        console.error('Error fitting polygon bounds', e);
      }

      localStorage.setItem(STORAGE_KEY_MAP_ZONE, JSON.stringify(zoneData));
    } else {
      localStorage.removeItem(STORAGE_KEY_MAP_ZONE);
    }
  }, [zoneData]);

  // Helper to extract all Placemark polygons & points from KML XML
  const extractAllPlacemarksFromKML = (xmlText: string) => {
    const polygonsFound: { name: string; coordinates: [number, number][] }[] = [];
    const pointsFound: { name: string; lat: number; lng: number }[] = [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const placemarks = xmlDoc.getElementsByTagName('Placemark');

      for (let i = 0; i < placemarks.length; i++) {
        const pm = placemarks[i];
        const nameEl = pm.getElementsByTagName('name')[0];
        const pmName = nameEl?.textContent?.trim() || `Congregación ${i + 1}`;

        // Polygons
        const polyNodes = pm.getElementsByTagName('Polygon');
        for (let p = 0; p < polyNodes.length; p++) {
          const coordNodes = polyNodes[p].getElementsByTagName('coordinates');
          for (let j = 0; j < coordNodes.length; j++) {
            const raw = coordNodes[j].textContent?.trim();
            if (raw) {
              const polyCoords: [number, number][] = [];
              const tokens = raw.split(/\s+/);
              tokens.forEach(tok => {
                const parts = tok.split(',');
                if (parts.length >= 2) {
                  const n1 = parseFloat(parts[0]);
                  const n2 = parseFloat(parts[1]);
                  if (!isNaN(n1) && !isNaN(n2)) {
                    if (Math.abs(n1) > Math.abs(n2)) {
                      polyCoords.push([n2, n1]);
                    } else {
                      polyCoords.push([n1, n2]);
                    }
                  }
                }
              });
              if (polyCoords.length >= 3) {
                polygonsFound.push({ name: pmName, coordinates: polyCoords });
              }
            }
          }
        }

        // Point coordinates for hospitals/landmarks
        const pointNode = pm.getElementsByTagName('Point')[0]?.getElementsByTagName('coordinates')[0];
        if (pointNode && pointNode.textContent) {
          const parts = pointNode.textContent.trim().split(',');
          if (parts.length >= 2) {
            const n1 = parseFloat(parts[0]);
            const n2 = parseFloat(parts[1]);
            if (!isNaN(n1) && !isNaN(n2)) {
              const lat = Math.abs(n1) > Math.abs(n2) ? n2 : n1;
              const lng = Math.abs(n1) > Math.abs(n2) ? n1 : n2;
              pointsFound.push({ name: pmName, lat, lng });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing KML placemarks', e);
    }

    return { polygonsFound, pointsFound };
  };

  // Universal KML / Coordinates processing for Congregations
  const processKMLContent = (textContent: string, targetCongNameOverride?: string) => {
    if (!textContent || !textContent.trim()) {
      setUploadStatus('El contenido o archivo ingresado está vacío.');
      return;
    }

    setUploadStatus('Procesando mapa KML/KMZ de las congregaciones...');

    try {
      const { polygonsFound, pointsFound } = extractAllPlacemarksFromKML(textContent);
      setExtractedHospitals(pointsFound);

      if (polygonsFound.length > 0) {
        const updated = { ...congregationBoundaries };
        let matchCount = 0;

        polygonsFound.forEach(item => {
          const pmName = item.name;
          const coords = item.coordinates;

          // Search matching congregation from app list
          const matchedCong = congregations.find(c => 
            c.name.toLowerCase() === pmName.toLowerCase() || 
            pmName.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(pmName.toLowerCase()) ||
            c.number === pmName
          );

          updated[pmName] = coords;
          if (matchedCong) {
            updated[matchedCong.name] = coords;
            updated[matchedCong.number] = coords;
            matchCount++;
          }
        });

        if (targetCongNameOverride && polygonsFound.length === 1) {
          updated[targetCongNameOverride] = polygonsFound[0].coordinates;
        }

        setCongregationBoundaries(updated);
        localStorage.setItem(STORAGE_KEY_CONG_BOUNDARIES, JSON.stringify(updated));

        setUploadStatus(
          `¡Éxito! Se importaron ${polygonsFound.length} delimitaciones (polígonos) de congregación (${matchCount} vinculadas a la lista oficial).`
        );

        const map = mapInstanceRef.current;
        if (map && polygonsFound[0].coordinates.length >= 3) {
          try {
            const polyBounds = L.latLngBounds(polygonsFound[0].coordinates);
            map.fitBounds(polyBounds, { padding: [40, 40] });
          } catch (errFit) {
            console.log('Error zooming to polygon', errFit);
          }
        }
      } else {
        // Fallback to single raw parsing
        const { parsedCoordinates, pointsExtracted, detectedName } = parseRawKmlOrTextContent(textContent);
        const targetCongName = targetCongNameOverride || selectedCongForUpload || detectedName || (congregations[0]?.name || '');

        if (parsedCoordinates.length >= 3) {
          const matchedCong = congregations.find(c => 
            c.name.toLowerCase() === targetCongName.toLowerCase() || 
            c.name.toLowerCase().includes(targetCongName.toLowerCase()) ||
            c.number === targetCongName
          );

          const updated = {
            ...congregationBoundaries,
            [targetCongName]: parsedCoordinates,
            ...(matchedCong ? { [matchedCong.name]: parsedCoordinates, [matchedCong.number]: parsedCoordinates } : {}),
          };

          setCongregationBoundaries(updated);
          localStorage.setItem(STORAGE_KEY_CONG_BOUNDARIES, JSON.stringify(updated));
          setUploadStatus(`¡Límites KML guardados para "${targetCongName}" con ${parsedCoordinates.length} puntos GPS!`);
        } else {
          setUploadStatus('No se encontraron polígonos válidos en el archivo KML.');
        }
      }
    } catch (err) {
      console.error('Error procesando KML', err);
      setUploadStatus('Error al procesar el archivo KML/KMZ. Verifica el formato.');
    }
  };

  const handleKMLUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.kmz')) {
      setUploadStatus(`Descomprimiendo y leyendo archivo KMZ (${file.name})...`);
      try {
        const zip = await JSZip.loadAsync(file);
        const kmlFileKey = Object.keys(zip.files).find(key => key.toLowerCase().endsWith('.kml'));
        if (!kmlFileKey) {
          setUploadStatus('El archivo KMZ no contiene ningún archivo .kml en su interior.');
          return;
        }
        const kmlText = await zip.files[kmlFileKey].async('string');
        processKMLContent(kmlText);
      } catch (err) {
        console.error('Error al abrir KMZ', err);
        setUploadStatus('Error al descomprimir el archivo .KMZ. Asegúrate de que no esté corrupto.');
      }
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) processKMLContent(text);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleDeleteCongregationBoundary = (nameToDelete: string) => {
    const updated = { ...congregationBoundaries };
    delete updated[nameToDelete];
    const matchedCong = congregations.find(c => c.name === nameToDelete || c.number === nameToDelete);
    if (matchedCong) {
      delete updated[matchedCong.name];
      delete updated[matchedCong.number];
    }
    setCongregationBoundaries(updated);
    localStorage.setItem(STORAGE_KEY_CONG_BOUNDARIES, JSON.stringify(updated));
    setUploadStatus(`Se eliminó la delimitación KML de "${nameToDelete}". Puedes cargar o pegar un nuevo mapa KML exacto.`);
  };

  const handleClearAllBoundaries = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar TODOS los polígonos KML cargados?')) {
      setCongregationBoundaries({});
      localStorage.removeItem(STORAGE_KEY_CONG_BOUNDARIES);
      setUploadStatus('Se han eliminado todos los polígonos de delimitación KML.');
    }
  };

  const batchImportExtractedHospitals = () => {
    if (extractedHospitals.length === 0) return;

    let importedCount = 0;
    extractedHospitals.forEach(pt => {
      // Check if hospital already exists
      const exists = hospitals.some(h => h.name.toLowerCase().includes(pt.name.toLowerCase()));
      if (!exists) {
        addHospital({
          name: pt.name,
          shortName: pt.name.substring(0, 18),
          zone: 'Zona 3',
          address: `Ubicación GPS (${pt.lat.toFixed(4)}, ${pt.lng.toFixed(4)})`,
          city: 'Zona 3',
          type: 'mixto',
          phoneGeneral: '55-0000-0000',
          phoneEmergency: '55-0000-0000',
          contactPerson: 'Enlace del Comité',
          pbmProtocolsAccepted: true,
          notes: 'Hospital importado automáticamente desde mapa KMZ/KML de Google Earth.',
          coordinates: { lat: pt.lat, lng: pt.lng }
        });
        importedCount++;
      }
    });

    setUploadStatus(`¡Se importaron ${importedCount} hospitales nuevos a la base de datos de la Zona 3!`);
    setExtractedHospitals([]);
  };

  const clearZoneBoundary = () => {
    setZoneData(null);
    setUploadStatus(null);
    setExtractedHospitals([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Toolbar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-600" />
            Mapa Interactivo de Zona de Trabajo y Hospitales (Zona 3)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualización geográfica con los límites exactos de los territorios de las congregaciones agregados por el comité e identificación de centros hospitalarios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Upload KML file */}
          <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-amber-100" />
            Cargar Zona KML / Google Earth
            <input
              type="file"
              accept=".kml, .kmz, .geojson, .json, .xml"
              onChange={handleKMLUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => onOpenHospitalModal()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Agregar Hospital al Mapa
          </button>
        </div>
      </div>

      {/* Guide: How to share Google Earth Map with the AI Assistant or App */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white p-4 rounded-xl shadow border border-slate-700 space-y-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowHowToGuide(!showHowToGuide)}>
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-xs sm:text-sm">
              ¿Cómo compartir tu mapa de Google Earth (Zona 3) con el Comité y esta aplicación?
            </h3>
          </div>
          <button className="text-xs underline text-sky-300 font-semibold hover:text-white">
            {showHowToGuide ? 'Ocultar guía' : 'Ver instrucciones'}
          </button>
        </div>

        {showHowToGuide && (
          <div className="pt-2 border-t border-slate-700/80 text-xs text-slate-300 space-y-2.5">
            <p>
              Tienes <strong>dos maneras fáciles</strong> para ingresar tu delimitación de la Zona 3 de Google Earth:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/90 p-3 rounded-lg border border-slate-700 space-y-1">
                <span className="font-bold text-amber-400 block">Opción 1: Carga Directa del archivo KML aquí</span>
                <p className="text-[11px] text-slate-300">
                  En Google Earth, haz clic derecho sobre tu lugar/polígono de "Zona 3" &gt; <em>"Guardar sitio como..."</em> y guárdalo como archivo <code>.kml</code>. Luego haz clic en el botón <strong>"Cargar Zona KML"</strong> arriba.
                </p>
              </div>

              <div className="bg-slate-800/90 p-3 rounded-lg border border-slate-700 space-y-1">
                <span className="font-bold text-sky-300 block">Opción 2: Copiar y Pegar Coordenadas en el Chat</span>
                <p className="text-[11px] text-slate-300">
                  Abre tu archivo KML con el Bloc de Notas, copia el texto con las coordenadas o la lista de colonias/municipios y pégalo directamente aquí en nuestro chat. ¡El Asistente trazará la zona por ti!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Status Banner */}
      {uploadStatus && (
        <div className="bg-sky-50 border-2 border-sky-300 p-4 rounded-xl flex items-center justify-between text-xs text-sky-950 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-sky-600 shrink-0" />
            <span className="font-medium">{uploadStatus}</span>
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-sky-800 hover:text-sky-950 font-bold text-xs underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Congregation KML Upload & Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-5 rounded-2xl shadow border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5 text-xs">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Delimitación Exacta por Congregaciones (KML de Google Earth)</span>
          </div>
          <h3 className="text-base font-extrabold text-white">
            Cargar o Pegar Mapa KML Exacto para Congregación
          </h3>
          <p className="text-slate-300 text-xs">
            Sube el archivo <code>.kml</code> exportado de Google Earth o pega directamente las coordenadas de tu congregación. Se dibujará con 100% de precisión matemática.
          </p>

          {/* List of congregations with KML loaded */}
          <div className="pt-2 text-[11px] space-y-2">
            {Object.keys(congregationBoundaries).length === 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">📍 Mapa KML Cargado:</span>
                <span className="text-amber-300/80 italic">Sin mapas KML cargados. Carga o pega el archivo .kml / .kmz exacto.</span>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 font-semibold text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>📍 <strong>{Object.keys(congregationBoundaries).length} congregaciones</strong> con mapa KML/KMZ exacto cargado</span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => setShowLoadedBoundariesList(!showLoadedBoundariesList)}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px]"
                    >
                      {showLoadedBoundariesList ? '▲ Ocultar Lista' : '▼ Ver Lista de Congregaciones'}
                    </button>

                    <button
                      onClick={handleClearAllBoundaries}
                      className="text-red-300 hover:text-red-100 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 text-[11px]"
                      title="Eliminar todos los mapas KML cargados"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar Todos</span>
                    </button>
                  </div>
                </div>

                {showLoadedBoundariesList && (
                  <div className="mt-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 max-h-44 overflow-y-auto flex flex-wrap gap-1.5 shadow-inner">
                    {Object.entries(congregationBoundaries).map(([name, coords]) => (
                      <span key={name} className="bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 text-[10px]">
                        <span>📍 {name} ({Array.isArray(coords) ? coords.length : 0} pts)</span>
                        <button
                          onClick={() => handleDeleteCongregationBoundary(name)}
                          title="Eliminar esta delimitación KML"
                          className="text-red-300 hover:text-white hover:bg-red-600/50 rounded p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80 space-y-3 w-full md:w-auto shrink-0">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Seleccionar Congregación:
            </label>
            <select
              value={selectedCongForUpload}
              onChange={(e) => setSelectedCongForUpload(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 font-bold text-amber-300 text-xs focus:ring-2 focus:ring-amber-500"
            >
              {congregations.map(c => (
                <option key={c.number} value={c.name}>
                  #{c.number} {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-1.5 text-xs">
              <Upload className="w-4 h-4 text-amber-200 shrink-0" />
              <span>Subir .KML</span>
              <input
                type="file"
                accept=".kml, .kmz, .geojson, .json, .xml"
                onChange={handleKMLUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowPasteModal(true)}
              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-sky-300 font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 text-xs border border-slate-600"
            >
              <Clipboard className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Pegar KML</span>
            </button>
          </div>
        </div>
      </div>

      {/* Extracted Hospitals Batch Import Prompt */}
      {extractedHospitals.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-emerald-900">
                ¡Se encontraron {extractedHospitals.length} puntos de hospitales en tu archivo!
              </strong>
              <span className="text-emerald-800">
                ¿Deseas agregarlos automáticamente al Directorio de Hospitales de la Zona 3 con sus coordenadas GPS?
              </span>
            </div>
          </div>

          <button
            onClick={batchImportExtractedHospitals}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow shrink-0 transition-colors"
          >
            Importar {extractedHospitals.length} Hospitales Ahora
          </button>
        </div>
      )}

      {/* Filters Toolbar & Layer Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Layer toggles */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setShowCongregationTerritories(!showCongregationTerritories)}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                showCongregationTerritories
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Territorios Congregaciones ({congregations.filter(c => c.assignedMemberId).length} asignadas)
            </button>
            <button
              onClick={() => setShowHospitalsOnMap(!showHospitalsOnMap)}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                showHospitalsOnMap
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Hospitales ({filteredHospitals.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Users className="w-4 h-4 text-amber-600" />
              Color por Integrante:
            </span>
            <select
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              className="bg-amber-50 border border-amber-300 rounded-lg p-1.5 font-bold text-amber-950 focus:ring-2 focus:ring-amber-500"
            >
              <option value="todos">Todos los 16 Integrantes (Colores)</option>
              {cehMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.assignedCongregationIds.length} congs)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Layers className="w-4 h-4 text-slate-500" />
              Zona:
            </span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-semibold text-slate-800"
            >
              <option value="Zona 3">Zona 3 ({hospitals.length} centros)</option>
            </select>
          </div>
        </div>

        {selectedMemberFilter !== 'todos' && (
          <button
            onClick={() => setSelectedMemberFilter('todos')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px]"
          >
            Ver Todos los Colores
          </button>
        )}
      </div>

      {/* Main Map View + Hospital Detail Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Leaflet Map Box */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[540px] relative">
          
          {/* Relocation Mode Banner Overlay */}
          {relocatingHospitalId && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center gap-3 animate-pulse max-w-[90%] sm:max-w-md">
              <MapPin className="w-5 h-5 text-slate-950 shrink-0" />
              <div className="text-xs">
                <span className="block font-black uppercase text-[10px] text-slate-900 tracking-wider">Modo Cambio de Ubicación</span>
                <span>Haga clic en el mapa para colocar el marcador de <strong>{hospitals.find(h => h.id === relocatingHospitalId)?.name}</strong></span>
              </div>
              <button
                onClick={() => setRelocatingHospitalId(null)}
                className="ml-auto px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Relocate Success Notification Overlay */}
          {relocateSuccessMsg && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs border border-emerald-500 animate-in fade-in duration-200 max-w-[90%] text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span>{relocateSuccessMsg}</span>
            </div>
          )}

          <div 
            ref={mapContainerRef} 
            className="w-full h-full min-h-[540px] z-10 relative" 
            style={{ width: '100%', height: '100%', minHeight: '540px' }}
          />

          {/* Map Overlay Legend */}
          <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1.5 max-w-[220px]">
            <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
              Colores de Integrantes CEH:
            </span>
            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
              {cehMembers.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => setSelectedMemberFilter(selectedMemberFilter === m.id ? 'todos' : m.id)}
                  className={`flex items-center justify-between gap-1.5 cursor-pointer p-0.5 rounded ${
                    selectedMemberFilter === m.id ? 'bg-amber-100 font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-3 h-3 rounded-full shrink-0 border border-black/20" style={{ backgroundColor: m.color }} />
                    <span className="text-slate-800 truncate">{m.name.split(' ')[0]} {m.name.split(' ')[1] || ''}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">#{m.assignedCongregationIds.length}c</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lateral Sidebar Panel (Miembros CEH y Cobertura + Detalle del Hospital) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4 flex flex-col h-[540px]">
          
          {/* Sidebar Tab Header */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-bold">
            <button
              onClick={() => setSidebarTab('members')}
              className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                sidebarTab === 'members'
                  ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Integrantes ({cehMembers.length})</span>
            </button>

            <button
              onClick={() => setSidebarTab('hospital')}
              className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                sidebarTab === 'hospital'
                  ? 'bg-sky-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {selectedHospital ? (selectedHospital.shortName || selectedHospital.name.substring(0, 10)) : 'Hospital'}
              </span>
            </button>
          </div>

          {/* TAB 1: LISTA LATERAL DE MIEMBROS Y COBERTURA */}
          {sidebarTab === 'members' ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              
              {/* Search Box & Quick Status */}
              <div className="space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Buscar por integrante o congregación..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {memberSearchQuery && (
                    <button 
                      onClick={() => setMemberSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {selectedMemberFilter !== 'todos' && (
                  <div className="bg-amber-50 border border-amber-300 p-2 rounded-lg flex items-center justify-between text-xs text-amber-950">
                    <span className="font-semibold text-[11px] truncate">
                      🔍 Filtrando: <strong>{cehMembers.find(m => m.id === selectedMemberFilter)?.name}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedMemberFilter('todos')}
                      className="text-amber-800 hover:text-amber-950 font-bold text-[11px] underline shrink-0 ml-1"
                    >
                      Ver Todos
                    </button>
                  </div>
                )}
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
                {(() => {
                  const filteredMembers = cehMembers.filter(m => {
                    if (!memberSearchQuery.trim()) return true;
                    const q = memberSearchQuery.toLowerCase();
                    const memberCongs = congregations.filter(c => getAssignedMemberForCongregation(c)?.id === m.id);
                    return (
                      m.name.toLowerCase().includes(q) ||
                      m.role?.toLowerCase().includes(q) ||
                      m.phone?.includes(q) ||
                      memberCongs.some(c => c.name.toLowerCase().includes(q) || c.number.includes(q))
                    );
                  });

                  if (filteredMembers.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No se encontraron integrantes que coincidan con "{memberSearchQuery}".
                      </div>
                    );
                  }

                  return filteredMembers.map(member => {
                    const isSelected = selectedMemberFilter === member.id;
                    const assignedCongs = congregations.filter(c => getAssignedMemberForCongregation(c)?.id === member.id);
                    const assignedHospCount = hospitals.filter(h => 
                      h.assignedCEHMemberId === member.id || assignedCongs.some(c => c.number === h.congregationNumber)
                    ).length;

                    return (
                      <div
                        key={member.id}
                        className={`p-3 rounded-xl border text-xs transition-all space-y-2 ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                            : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {/* Member Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-4 h-4 rounded-full border border-black/20 shadow-sm shrink-0" 
                              style={{ backgroundColor: member.color }}
                            />
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-xs">
                                {member.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {member.role || 'Enlace Hospitalario'}
                              </p>
                            </div>
                          </div>

                          {member.phone && (
                            <a
                              href={`tel:${member.phone}`}
                              className="text-slate-500 hover:text-emerald-700 bg-white p-1 rounded-md border border-slate-200 text-[10px] font-mono flex items-center gap-1"
                              title={`Llamar a ${member.name}`}
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                            </a>
                          )}
                        </div>

                        {/* Coverage Stats */}
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Compass className="w-3 h-3 text-amber-600" />
                            {assignedCongs.length} congs
                          </span>
                          <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-sky-600" />
                            {assignedHospCount} hospitales
                          </span>
                        </div>

                        {/* Congregations List Chips */}
                        {assignedCongs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {assignedCongs.slice(0, 3).map(c => {
                              const isKmlLoaded = Boolean(congregationBoundaries[c.name] || congregationBoundaries[c.number]);
                              return (
                                <span
                                  key={c.number}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    isKmlLoaded
                                      ? 'bg-sky-50 border-sky-300 text-sky-900'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  #{c.number} {c.name} {isKmlLoaded ? '📍' : ''}
                                </span>
                              );
                            })}
                            {assignedCongs.length > 3 && (
                              <span className="text-[10px] font-bold text-slate-400 self-center">
                                +{assignedCongs.length - 3} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10.5px] text-slate-400 italic">Sin congregaciones asignadas aún.</p>
                        )}

                        {/* Action buttons */}
                        <div className="pt-1.5 flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMemberFilter(isSelected ? 'todos' : member.id)}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-colors flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-amber-50 hover:border-amber-300'
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            {isSelected ? 'Mostrando Solamente' : 'Resaltar Zona'}
                          </button>

                          <button
                            onClick={() => focusMemberOnMap(member.id)}
                            className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center justify-center gap-1"
                            title="Centrar y hacer zoom en el territorio de este miembro"
                          >
                            <Target className="w-3 h-3 text-amber-400" />
                            Centrar
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

            </div>
          ) : (
            /* TAB 2: DETALLE DEL HOSPITAL */
            <div className="flex-1 overflow-y-auto pr-1">
              {selectedHospital ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {selectedHospital.zone}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1">
                        {selectedHospital.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedHospital.address}, {selectedHospital.city}
                      </p>

                      <div className="pt-1.5">
                        <a
                          href={
                            selectedHospital.googleMapsUrl && selectedHospital.googleMapsUrl.trim()
                              ? selectedHospital.googleMapsUrl.trim()
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedHospital.name}, ${selectedHospital.address}, ${selectedHospital.city}`)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                          {selectedHospital.googleMapsUrl ? 'Abrir en Google Maps 📍' : 'Navegar en Google Maps 📍'}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* CEH Member Responsible Selector */}
                  {(() => {
                    const currentAssigned = getAssignedCEHMember(selectedHospital);
                    return (
                      <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs space-y-1.5">
                        <label className="font-bold text-amber-950 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-600" />
                            Hermano Responsable CEH:
                          </span>
                          {currentAssigned && (
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-sm" 
                              style={{ backgroundColor: currentAssigned.color }} 
                            />
                          )}
                        </label>

                        <select
                          value={selectedHospital.assignedCEHMemberId || ''}
                          onChange={(e) => {
                            const newMemberId = e.target.value || undefined;
                            updateHospital(selectedHospital.id, { assignedCEHMemberId: newMemberId });
                            setSelectedHospital({ ...selectedHospital, assignedCEHMemberId: newMemberId });
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-amber-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">-- Asignación por Congregación o General --</option>
                          {cehMembers.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.assignedCongregationIds.length} congs)
                            </option>
                          ))}
                        </select>

                        {currentAssigned && (
                          <p className="text-[11px] text-amber-800 font-medium pt-0.5">
                            Este hospital se pinta con el color <strong style={{ color: currentAssigned.color }}>● {currentAssigned.name}</strong> en el mapa.
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedHospital.pbmProtocolsAccepted ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> PBM Aceptado
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border border-amber-200">
                        <Info className="w-3.5 h-3.5" /> PBM Pendiente
                      </span>
                    )}

                    <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-semibold capitalize">
                      {selectedHospital.type}
                    </span>
                  </div>

                  {/* Contacts info */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Contacto / Enlace del Hospital</span>
                      <span className="font-bold text-slate-800">
                        {selectedHospital.contactPerson || 'No especificado'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block text-[11px]">Urgencias</span>
                        <span className="font-mono text-slate-800">{selectedHospital.phoneEmergency}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block text-[11px]">Central</span>
                        <span className="font-mono text-slate-800">{selectedHospital.phoneGeneral}</span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Affiliation stats */}
                  {(() => {
                    const connectedDoctors = doctors.filter(d => d.hospitalIds.includes(selectedHospital.id));
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            Médicos Colaboradores ({connectedDoctors.length}):
                          </span>
                          <button
                            onClick={() => onFilterDoctorsByHospital(selectedHospital.id)}
                            className="text-sky-700 font-bold hover:underline text-[11px]"
                          >
                            Ver todos
                          </button>
                        </div>

                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {connectedDoctors.length === 0 ? (
                            <p className="text-slate-400 italic text-[11px]">No hay médicos vinculados a este hospital aún.</p>
                          ) : (
                            connectedDoctors.map(doc => (
                              <div key={doc.id} className="p-2 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                                <span className="font-bold text-slate-800">{doc.title} {doc.name}</span>
                                <span className="text-[10px] text-sky-800 font-semibold">{doc.specialty}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {selectedHospital.notes && (
                    <div className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                      <strong>Notas del Comité:</strong> {selectedHospital.notes}
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1">
                      <div className="font-extrabold flex items-center gap-1 text-emerald-950">
                        <span>🖐️ ¿Cómo mover este marcador?</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-snug">
                        <strong>Método 1 (Más fácil):</strong> Arrastre y suelte el ícono 🏥 del hospital directamente sobre el mapa.
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-snug">
                        <strong>Método 2:</strong> Use el botón de abajo y haga clic sobre la nueva posición.
                      </p>
                    </div>

                    <button
                      onClick={() => setRelocatingHospitalId(selectedHospital.id)}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Activar "Clic en Mapa para Ubicar"
                    </button>

                    <button
                      onClick={() => onOpenHospitalModal(selectedHospital)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Editar Datos / Coordenadas Manuales
                    </button>

                    <button
                      onClick={() => setHospitalToDeleteMap(selectedHospital)}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar este Hospital
                    </button>

                    <button
                      onClick={() => setSidebarTab('members')}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                    >
                      ← Volver a Integrantes del Comité
                    </button>
                  </div>

                </div>
              ) : (
                <div className="text-center py-12 space-y-3 my-auto">
                  <MapPin className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
                  <h3 className="font-bold text-sm text-slate-800">Selecciona un Hospital en el Mapa</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Haz clic sobre cualquiera de los pines de la mapa para consultar médicos vinculados, contacto de urgencias y notas de la Zona 3.
                  </p>
                  <button
                    onClick={() => setSidebarTab('members')}
                    className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow"
                  >
                    Ver Integrantes del Comité
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Modal: Paste KML Code or Coordinates */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-sky-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Pegar Código o Coordenadas KML (Google Earth)
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPastedKmlText('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Congregación a actualizar:
                </label>
                <select
                  value={selectedCongForUpload}
                  onChange={(e) => setSelectedCongForUpload(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                >
                  {congregations.map(c => (
                    <option key={c.number} value={c.name}>
                      #{c.number} {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pega aquí el contenido XML KML de Google Earth o las Coordenadas:
                </label>
                <textarea
                  rows={8}
                  value={pastedKmlText}
                  onChange={(e) => setPastedKmlText(e.target.value)}
                  placeholder={`Ejemplo XML KML:\n<coordinates>\n  -100.2642,25.6685,0\n  -100.2481,25.6760,0\n  -100.2240,25.6720,0\n</coordinates>\n\nO lista simple:\n25.6685, -100.2642\n25.6760, -100.2481\n...`}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-sky-200 border border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                💡 <strong>Consejo:</strong> En Google Earth, puedes abrir las propiedades del polígono de tu congregación, copiar sus coordenadas o abrir el archivo .kml con Bloc de Notas y pegar todo el texto aquí.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPastedKmlText('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  processKMLContent(pastedKmlText, selectedCongForUpload);
                  setShowPasteModal(false);
                  setPastedKmlText('');
                }}
                disabled={!pastedKmlText.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Guardar Delimitación Exacta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Delete Confirmation Modal on Map */}
      {hospitalToDeleteMap && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar hospital del mapa y directorio?</h3>
                <p className="text-xs text-slate-500 font-semibold">{hospitalToDeleteMap.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Se eliminará permanentemente de la base de datos de la Zona 3 y de la vista del mapa interactivo.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setHospitalToDeleteMap(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteHospital(hospitalToDeleteMap.id);
                  if (selectedHospital?.id === hospitalToDeleteMap.id) {
                    setSelectedHospital(null);
                  }
                  setHospitalToDeleteMap(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sí, Eliminar Hospital
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
