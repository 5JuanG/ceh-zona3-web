/**
 * Helper utility to parse Google Maps links and extract coordinates, hospital/place names, and address info.
 */

export interface ParsedGoogleMapsData {
  coordinates?: { lat: number; lng: number };
  extractedName?: string;
  extractedAddress?: string;
  extractedCity?: string;
}

export function parseGoogleMapsUrl(url: string): ParsedGoogleMapsData {
  if (!url || !url.trim()) return {};

  const cleanUrl = url.trim();
  const result: ParsedGoogleMapsData = {};

  try {
    // 1. Extract exact pin coordinates from !3d<lat> and !4d<lng> anywhere in the URL/string
    // In Google Maps URLs, !3d<lat> is latitude and !4d<lng> is longitude of the exact feature pin.
    const lat3d = cleanUrl.match(/!3d(-?\d+\.\d+)/);
    const lng4d = cleanUrl.match(/!4d(-?\d+\.\d+)/);
    if (lat3d && lng4d) {
      const lat = parseFloat(lat3d[1]);
      const lng = parseFloat(lng4d[1]);
      if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        result.coordinates = { lat, lng };
      }
    }

    // 2. Embed iframe format: !2d<lng>!3d<lat> or !3d<lat>!2d<lng>
    if (!result.coordinates) {
      const embedMatch = cleanUrl.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/) || cleanUrl.match(/!3d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
      if (embedMatch) {
        const is2dFirst = cleanUrl.includes('!2d' + embedMatch[1]);
        const lat = parseFloat(is2dFirst ? embedMatch[2] : embedMatch[1]);
        const lng = parseFloat(is2dFirst ? embedMatch[1] : embedMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          result.coordinates = { lat, lng };
        }
      }
    }

    // 3. Direct path /maps/place/<lat>,<lng> or staticmap?center=<lat>,<lng>
    if (!result.coordinates) {
      const placeCoordMatch = cleanUrl.match(/(?:\/maps\/place\/|center=|staticmap\?center=)(-?\d+\.\d+)(?:%2C|,|\+|\s)+(-?\d+\.\d+)/i);
      if (placeCoordMatch) {
        const lat = parseFloat(placeCoordMatch[1]);
        const lng = parseFloat(placeCoordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          result.coordinates = { lat, lng };
        }
      }
    }

    // 4. Query parameters q=lat,lng or query=lat,lng or ll=lat,lng or center=lat,lng
    if (!result.coordinates) {
      const qMatch = cleanUrl.match(/[?&](?:q|query|ll|center|saddr|daddr|destination|origin)=(-?\d+\.\d+)(?:%2C|,|\+|\s)+(-?\d+\.\d+)/i);
      if (qMatch) {
        const lat = parseFloat(qMatch[1]);
        const lng = parseFloat(qMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          result.coordinates = { lat, lng };
        }
      }
    }

    // 5. Viewport camera position @25.6880123,-100.3520123 (Fallback if no exact place pin was found)
    if (!result.coordinates) {
      const atMatch = cleanUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        const lat = parseFloat(atMatch[1]);
        const lng = parseFloat(atMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          result.coordinates = { lat, lng };
        }
      }
    }

    // 6. Generic pair of coordinates in text (e.g. "25.679542, -100.25231")
    if (!result.coordinates) {
      const genericPairMatch = cleanUrl.match(/(-?\d{1,2}\.\d{4,15})\s*(?:,|%2C|\s)+\s*(-?\d{1,3}\.\d{4,15})/);
      if (genericPairMatch) {
        const lat = parseFloat(genericPairMatch[1]);
        const lng = parseFloat(genericPairMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          result.coordinates = { lat, lng };
        }
      }
    }

    // Extract Place Name or Search Query from path: /maps/place/Hospital+General+Guadalupe/...
    const placeMatch = cleanUrl.match(/\/maps\/place\/([^/@?]+)/);
    if (placeMatch) {
      let rawName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      rawName = rawName.split(',')[0].trim();
      if (rawName && rawName.length > 2 && !rawName.startsWith('http')) {
        result.extractedName = rawName;
      }

      const parts = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).split(',');
      if (parts.length >= 2) {
        result.extractedAddress = parts.slice(1, -1).join(', ').trim();
        result.extractedCity = parts[parts.length - 1].trim();
      }
    }

    // Search query: /maps/search/Hospital+Universitario/
    const searchMatch = cleanUrl.match(/\/maps\/search\/([^/@?]+)/);
    if (searchMatch && !result.extractedName) {
      const rawSearch = decodeURIComponent(searchMatch[1].replace(/\+/g, ' ')).trim();
      if (rawSearch) {
        result.extractedName = rawSearch;
      }
    }

  } catch (err) {
    console.warn('Error parsing Google Maps URL:', err);
  }

  return result;
}

/**
 * Geocodes an address or place name using OpenStreetMap Nominatim API to get exact GPS coordinates
 */
export async function geocodeAddressOrName(query: string, cityHint?: string): Promise<{ lat: number; lng: number } | undefined> {
  if (!query || !query.trim()) return undefined;

  let searchQuery = query.trim().replace(/[\\/]/g, ' ');

  if (cityHint && !searchQuery.toLowerCase().includes(cityHint.toLowerCase())) {
    searchQuery += `, ${cityHint}`;
  }
  if (!searchQuery.toLowerCase().includes('nuevo león') && !searchQuery.toLowerCase().includes('nuevo leon') && !searchQuery.toLowerCase().includes('mexico') && !searchQuery.toLowerCase().includes('méxico')) {
    searchQuery += ', Nuevo León, México';
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CLH-Zona3-App/1.0'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const sanitized = sanitizeHospitalCoordinates({ lat, lng });
        if (sanitized) return sanitized;
      }
    }
  } catch (e) {
    console.warn('Geocoding search failed:', e);
  }

  return undefined;
}

/**
 * Async parser that expands short links (e.g. maps.app.goo.gl) via CORS proxy to extract exact GPS coordinates
 */
export async function resolveAndParseGoogleMapsUrl(url: string): Promise<ParsedGoogleMapsData> {
  if (!url || !url.trim()) return {};

  const cleanUrl = url.trim();

  // 1. First try direct synchronous parsing
  const directResult = parseGoogleMapsUrl(cleanUrl);
  if (directResult.coordinates) {
    return directResult;
  }

  // 2. If it is a short link (e.g., maps.app.goo.gl, goo.gl/maps, etc.), unshorten via CORS proxy
  if (cleanUrl.includes('goo.gl') || cleanUrl.includes('maps.app') || cleanUrl.includes('bit.ly') || cleanUrl.includes('t.co')) {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`;
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
      if (response.ok) {
        const data = await response.json();
        if (data.status?.url) {
          const expandedResult = parseGoogleMapsUrl(data.status.url);
          if (expandedResult.coordinates) {
            return {
              ...expandedResult,
              extractedName: expandedResult.extractedName || directResult.extractedName,
            };
          }
        }
        if (data.contents) {
          const htmlParsed = parseGoogleMapsUrl(data.contents);
          if (htmlParsed.coordinates) {
            return {
              ...htmlParsed,
              extractedName: directResult.extractedName || htmlParsed.extractedName,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Primary CORS proxy resolution failed, trying secondary...', err);
    }

    try {
      const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`;
      const response2 = await fetch(proxyUrl2, { signal: AbortSignal.timeout(7000) });
      if (response2.ok) {
        const text = await response2.text();
        const htmlParsed2 = parseGoogleMapsUrl(text);
        if (htmlParsed2.coordinates) {
          return htmlParsed2;
        }
      }
    } catch (err) {
      console.warn('Secondary CORS proxy resolution failed', err);
    }
  }

  // 3. Fallback: if we extracted a name/place, try geocoding it with Nominatim
  if (directResult.extractedName) {
    const geocoded = await geocodeAddressOrName(directResult.extractedName, directResult.extractedCity);
    if (geocoded) {
      return {
        ...directResult,
        coordinates: geocoded
      };
    }
  }

  return directResult;
}

/**
 * Fallback coordinate locator based on City Name if GPS coordinates were not found in link
 */
export function getCityFallbackCoordinates(cityName: string): { lat: number; lng: number } {
  if (!cityName) return { lat: 25.6780, lng: -100.2570 };
  const name = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (name.includes('cadereyta')) return { lat: 25.5880, lng: -99.9920 };
  if (name.includes('juarez') || name.includes('benito')) return { lat: 25.6470, lng: -100.0960 };
  if (name.includes('guadalupe')) return { lat: 25.6780, lng: -100.2570 };
  if (name.includes('monterrey')) return { lat: 25.6710, lng: -100.3090 };
  if (name.includes('china')) return { lat: 25.7040, lng: -99.2380 };
  if (name.includes('montemorelos')) return { lat: 25.1880, lng: -99.8270 };
  if (name.includes('linares')) return { lat: 24.8620, lng: -99.5670 };
  if (name.includes('allende')) return { lat: 25.2810, lng: -100.0180 };
  if (name.includes('san nicolas')) return { lat: 25.7480, lng: -100.2850 };
  if (name.includes('san pedro')) return { lat: 25.6570, lng: -100.4020 };
  if (name.includes('santa catarina')) return { lat: 25.6750, lng: -100.4630 };
  if (name.includes('escobedo')) return { lat: 25.8080, lng: -100.3220 };
  if (name.includes('apodaca')) return { lat: 25.7810, lng: -100.1880 };

  // Default Zona 3 central coordinates (Guadalupe / Monterrey)
  return { lat: 25.6780, lng: -100.2570 };
}

/**
 * Sanitizes and validates GPS coordinates for hospitals and landmarks.
 * Handles swapped lat/lng, combined string input, missing negative signs in Western Hemisphere, and string numbers.
 */
export function sanitizeHospitalCoordinates(coords: any): { lat: number; lng: number } | undefined {
  if (!coords) return undefined;

  let rawLat = typeof coords.lat === 'number' ? coords.lat : parseFloat(String(coords.lat || ''));
  let rawLng = typeof coords.lng === 'number' ? coords.lng : parseFloat(String(coords.lng || ''));

  // If rawLat or rawLng couldn't be parsed directly, attempt parsing pair from string
  if (isNaN(rawLat) || isNaN(rawLng)) {
    const combinedStr = `${coords.lat || ''} ${coords.lng || ''}`;
    const pairMatch = combinedStr.match(/(-?\d{1,3}(?:\.\d+)?)\s*(?:,|%2C|\s)+\s*(-?\d{1,3}(?:\.\d+)?)/);
    if (pairMatch) {
      rawLat = parseFloat(pairMatch[1]);
      rawLng = parseFloat(pairMatch[2]);
    }
  }

  if (isNaN(rawLat) || isNaN(rawLng) || (rawLat === 0 && rawLng === 0)) {
    return undefined;
  }

  let lat = rawLat;
  let lng = rawLng;

  // 1. Swap detection: if magnitude of lat > 90, lat and lng are swapped (e.g. lat=-100.31, lng=25.68)
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }

  // 2. Western Hemisphere longitude auto-fix (e.g. Mexico / North America / Americas lat between 5 and 60, entered positive lng 100.31)
  if (lat > 5 && lat < 60 && lng > 30 && lng < 180) {
    lng = -lng;
  }

  if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lat, lng };
  }

  return undefined;
}

/**
 * Parses user input from Latitud and Longitud input fields.
 * Accepts separate inputs OR full coordinate string in either field (e.g., "25.6880, -100.3120").
 */
export function parseLatAndLng(latInput: string, lngInput: string): { lat: number; lng: number } | undefined {
  const cleanLat = (latInput || '').trim();
  const cleanLng = (lngInput || '').trim();

  if (!cleanLat && !cleanLng) return undefined;

  // Combine to check for pair in latInput or lngInput
  const combined = `${cleanLat} ${cleanLng}`;
  const pairMatch = combined.match(/(-?\d{1,3}(?:\.\d+)?)\s*(?:,|%2C|\s)+\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (pairMatch) {
    return sanitizeHospitalCoordinates({ lat: pairMatch[1], lng: pairMatch[2] });
  }

  return sanitizeHospitalCoordinates({ lat: cleanLat, lng: cleanLng });
}
