import React, { useState, useEffect } from 'react';
import { Hospital } from '../types';
import { useApp } from '../context/AppContext';
import { X, Building2, Save, MapPin, Phone, Mail, ShieldCheck, ExternalLink, Globe, Sparkles, Users, Compass, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { parseGoogleMapsUrl, resolveAndParseGoogleMapsUrl, getCityFallbackCoordinates, parseLatAndLng, sanitizeHospitalCoordinates, geocodeAddressOrName } from '../utils/googleMapsParser';

interface HospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalToEdit?: Hospital | null;
}

export const HospitalModal: React.FC<HospitalModalProps> = ({ isOpen, onClose, hospitalToEdit }) => {
  const { addHospital, updateHospital, deleteHospital, cehMembers, congregations } = useApp();

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [zone, setZone] = useState('Zona 3');
  const [type, setType] = useState<'publico' | 'privado' | 'mixto'>('publico');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phoneEmergency, setPhoneEmergency] = useState('');
  const [phoneGeneral, setPhoneGeneral] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [assignedCEHMemberId, setAssignedCEHMemberId] = useState<string>('');
  const [congregationNumber, setCongregationNumber] = useState<string>('');
  const [pbmProtocolsAccepted, setPbmProtocolsAccepted] = useState(true);
  const [acceptsBloodlessSurgery, setAcceptsBloodlessSurgery] = useState(true);
  const [notes, setNotes] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [latInput, setLatInput] = useState<string>('');
  const [lngInput, setLngInput] = useState<string>('');

  const [parseStatusMsg, setParseStatusMsg] = useState<string | null>(null);
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);

  useEffect(() => {
    if (hospitalToEdit) {
      setName(hospitalToEdit.name || '');
      setShortName(hospitalToEdit.shortName || '');
      setZone(hospitalToEdit.zone || 'Zona 3');
      setType(hospitalToEdit.type || 'publico');
      setAddress(hospitalToEdit.address || '');
      setCity(hospitalToEdit.city || '');
      setPhoneEmergency(hospitalToEdit.phoneEmergency || '');
      setPhoneGeneral(hospitalToEdit.phoneGeneral || '');
      setEmail(hospitalToEdit.email || '');
      setContactPerson(hospitalToEdit.contactPerson || '');
      setGoogleMapsUrl(hospitalToEdit.googleMapsUrl || '');
      setAssignedCEHMemberId(hospitalToEdit.assignedCEHMemberId || '');
      setCongregationNumber(hospitalToEdit.congregationNumber || '');
      setPbmProtocolsAccepted(hospitalToEdit.pbmProtocolsAccepted ?? true);
      setAcceptsBloodlessSurgery(hospitalToEdit.acceptsBloodlessSurgery ?? true);
      setNotes(hospitalToEdit.notes || '');
      setCoordinates(hospitalToEdit.coordinates);
      setLatInput(hospitalToEdit.coordinates ? String(hospitalToEdit.coordinates.lat) : '');
      setLngInput(hospitalToEdit.coordinates ? String(hospitalToEdit.coordinates.lng) : '');
    } else {
      setName('');
      setShortName('');
      setZone('Zona 3');
      setType('publico');
      setAddress('');
      setCity('');
      setPhoneEmergency('');
      setPhoneGeneral('');
      setEmail('');
      setContactPerson('');
      setGoogleMapsUrl('');
      setAssignedCEHMemberId('');
      setCongregationNumber('');
      setPbmProtocolsAccepted(true);
      setAcceptsBloodlessSurgery(true);
      setNotes('');
      setCoordinates(undefined);
      setLatInput('');
      setLngInput('');
    }
    setParseStatusMsg(null);
    setIsExtractingUrl(false);
  }, [hospitalToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto Parse Google Maps URL logic (Async to support short links expansion)
  const handleParseGoogleMapsLink = async (urlToParse?: string) => {
    const targetUrl = urlToParse || googleMapsUrl;
    if (!targetUrl || !targetUrl.trim()) return;

    setIsExtractingUrl(true);
    setParseStatusMsg('🔍 Analizando enlace y expandiendo ubicación GPS...');

    try {
      const parsed = await resolveAndParseGoogleMapsUrl(targetUrl);
      let extractedCount = 0;

      if (parsed.coordinates) {
        setCoordinates(parsed.coordinates);
        setLatInput(String(parsed.coordinates.lat));
        setLngInput(String(parsed.coordinates.lng));
        extractedCount++;
      }

      if (parsed.extractedName && (!name || name.length < 3)) {
        setName(parsed.extractedName);
        if (!shortName) setShortName(parsed.extractedName.substring(0, 20));
        extractedCount++;
      }

      if (parsed.extractedAddress && !address) {
        setAddress(parsed.extractedAddress);
        extractedCount++;
      }

      if (parsed.extractedCity && !city) {
        setCity(parsed.extractedCity);
        extractedCount++;
      }

      if (parsed.coordinates) {
        setParseStatusMsg(`📍 ¡Coordenadas GPS exactas (${parsed.coordinates.lat.toFixed(6)}, ${parsed.coordinates.lng.toFixed(6)}) extraídas del enlace!`);
      } else if (extractedCount > 0) {
        setParseStatusMsg('✅ Datos de ubicación extraídos del enlace correctamente.');
      } else {
        setParseStatusMsg('ℹ️ No se detectaron coordenadas en el enlace. Puede ingresar Latitud y Longitud manualmente abajo.');
      }
    } catch (e) {
      setParseStatusMsg('⚠️ No se pudo extraer la coordenada del enlace. Ingrese Lat/Lng manualmente abajo.');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const handleGeocodeByAddress = async () => {
    const query = address.trim() || name.trim();
    if (!query) {
      setParseStatusMsg('⚠️ Ingrese el Nombre o la Dirección del hospital para buscar sus coordenadas.');
      return;
    }
    setIsExtractingUrl(true);
    setParseStatusMsg('🔍 Buscando ubicación GPS exacta en el mapa...');
    try {
      const geo = await geocodeAddressOrName(query, city);
      if (geo) {
        setCoordinates(geo);
        setLatInput(String(geo.lat));
        setLngInput(String(geo.lng));
        setParseStatusMsg(`📍 ¡Ubicación GPS encontrada: ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}!`);
      } else {
        setParseStatusMsg('ℹ️ No se hallaron coordenadas exactas para la dirección. Puede ingresarlas manualmente.');
      }
    } catch {
      setParseStatusMsg('⚠️ Error al buscar ubicación. Ingrese Lat/Lng manualmente.');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const handleUrlChange = (val: string) => {
    setGoogleMapsUrl(val);
    if (val.includes('maps') || val.includes('goo.gl')) {
      handleParseGoogleMapsLink(val);
    }
  };

  const selectedMember = cehMembers.find(m => m.id === assignedCEHMemberId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingrese el nombre del hospital.');
      return;
    }

    // Resolve final coordinates: manual inputs > parsed > geocoded > fallback from city
    const parsedCoords = parseLatAndLng(latInput, lngInput);
    let finalCoords: { lat: number; lng: number } | undefined = parsedCoords || sanitizeHospitalCoordinates(coordinates);

    if (!finalCoords && googleMapsUrl) {
      const parsed = await resolveAndParseGoogleMapsUrl(googleMapsUrl);
      finalCoords = sanitizeHospitalCoordinates(parsed.coordinates);
    }

    if (!finalCoords && (address.trim() || name.trim())) {
      finalCoords = await geocodeAddressOrName(address.trim() || name.trim(), city);
    }

    if (!finalCoords && (city || address || name)) {
      finalCoords = getCityFallbackCoordinates(city) || getCityFallbackCoordinates(address) || getCityFallbackCoordinates(name);
    }

    const hospitalData = {
      name: name.trim(),
      shortName: shortName.trim(),
      zone: zone.trim(),
      type,
      address: address.trim(),
      city: city.trim(),
      phoneEmergency: phoneEmergency.trim(),
      phoneGeneral: phoneGeneral.trim(),
      email: email.trim(),
      contactPerson: contactPerson.trim(),
      googleMapsUrl: googleMapsUrl.trim(),
      assignedCEHMemberId: assignedCEHMemberId || undefined,
      congregationNumber: congregationNumber || undefined,
      pbmProtocolsAccepted,
      acceptsBloodlessSurgery,
      notes: notes.trim(),
      coordinates: finalCoords
    };

    if (hospitalToEdit) {
      updateHospital(hospitalToEdit.id, hospitalData);
    } else {
      addHospital(hospitalData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">
              {hospitalToEdit ? 'Editar Centro Hospitalario' : 'Registrar Nuevo Hospital de la Zona'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          
          {/* Quick Google Maps Import Banner */}
          <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-sky-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                Enlace de compartir de Google Maps (Ubicación GPS):
              </span>
              <span className="text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full font-semibold">
                Auto-ubica en mapa
              </span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="Pegue aquí el enlace (ej: https://maps.app.goo.gl/... o https://www.google.com/maps/...)"
                  value={googleMapsUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full bg-white border border-sky-300 rounded-lg p-2 pl-8 focus:ring-2 focus:ring-sky-500 text-xs font-mono"
                />
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="button"
                disabled={isExtractingUrl}
                onClick={() => handleParseGoogleMapsLink()}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm disabled:opacity-50"
              >
                {isExtractingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Extraer
              </button>
            </div>
            {parseStatusMsg && (
              <p className="text-[11px] text-sky-800 font-semibold flex items-center gap-1 bg-sky-50 p-1.5 rounded border border-sky-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                {parseStatusMsg}
              </p>
            )}

            {/* Editable Lat/Lng Fields */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Latitud GPS</label>
                  <input
                    type="text"
                    placeholder="ej. 25.6880"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Longitud GPS</label>
                  <input
                    type="text"
                    placeholder="ej. -100.3120"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isExtractingUrl}
                onClick={handleGeocodeByAddress}
                className="w-full py-1.5 px-3 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
              >
                {isExtractingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                Obtener GPS por Nombre o Dirección
              </button>
            </div>
          </div>

          {/* Assigned CEH Member Selection (Color Coding) */}
          <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                Integrante CEH Responsable del Hospital (Color en Mapa):
              </label>
              {selectedMember && (
                <span 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md inline-block shrink-0" 
                  style={{ backgroundColor: selectedMember.color }}
                />
              )}
            </div>

            <select
              value={assignedCEHMemberId}
              onChange={(e) => setAssignedCEHMemberId(e.target.value)}
              className="w-full bg-white border border-amber-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 text-xs"
            >
              <option value="">-- Sin integrante específico (Color genérico por PBM) --</option>
              {cehMembers.map(m => (
                <option key={m.id} value={m.id}>
                  👤 {m.name} ({m.assignedCongregationIds.length} congregaciones asignadas)
                </option>
              ))}
            </select>

            {selectedMember ? (
              <div className="flex items-center gap-2 text-[11px] text-amber-900 font-medium pt-0.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedMember.color }} />
                <span>
                  Este hospital se pintará en el mapa con el marcador oficial de <strong>{selectedMember.name}</strong>.
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-amber-800 italic">
                💡 Al asignar un integrante, el pin del hospital en el mapa interactivo adoptará su color distintivo.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Oficial del Hospital *</label>
            <input
              type="text"
              required
              placeholder="Ej. Hospital General Universitario Central"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Corto</label>
              <input
                type="text"
                placeholder="Ej. Hospital Central"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zona / Sector</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-sky-500"
              >
                <option value="Zona 3">Zona 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Centro</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              >
                <option value="publico">Público</option>
                <option value="privado">Privado</option>
                <option value="mixto">Mixto / Seguridad Social</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección Completa</label>
              <input
                type="text"
                placeholder="Av. Gran Vía #450"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad / Localidad</label>
              <input
                type="text"
                placeholder="Guadalupe, Monterrey..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono de Urgencias *</label>
              <input
                type="text"
                required
                placeholder="+52 81 4555-0100"
                value={phoneEmergency}
                onChange={(e) => setPhoneEmergency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Conmutador / General</label>
              <input
                type="text"
                placeholder="+52 81 4555-0101"
                value={phoneGeneral}
                onChange={(e) => setPhoneGeneral(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contacto Principal / Comité Bioética</label>
              <input
                type="text"
                placeholder="Dra. María Elena Ramos (Dir. Médica)"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Institucional</label>
              <input
                type="email"
                placeholder="contacto@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={pbmProtocolsAccepted}
                onChange={(e) => setPbmProtocolsAccepted(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              Acepta Protocolos de PBM (Patient Blood Management)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={acceptsBloodlessSurgery}
                onChange={(e) => setAcceptsBloodlessSurgery(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              Acepta Cirugía Sin Sangre / Alternativas a Transfusiones
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas y detalles del centro</label>
            <textarea
              rows={3}
              placeholder="Equipamiento especial (Cell Saver), recepción del Comité, jefaturas amigables..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
            {hospitalToEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Está seguro de eliminar "${hospitalToEdit.name}" de la base de datos?`)) {
                    deleteHospital(hospitalToEdit.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar Hospital
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow"
              >
                <Save className="w-4 h-4" />
                Guardar Hospital
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

