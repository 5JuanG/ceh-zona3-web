import React, { createContext, useContext, useState, useEffect } from 'react';
import { Doctor, Hospital, VisitLog, PatientCase, MedicalResource, CEHMember, Congregation, EmergencyWorksheet } from '../types';
import { INITIAL_DOCTORS, INITIAL_HOSPITALS, INITIAL_VISITS, INITIAL_CASES, INITIAL_RESOURCES } from '../data/initialData';
import { INITIAL_CEH_MEMBERS, INITIAL_CONGREGATIONS } from '../data/congregationsData';
import { db, defaultDb, authReady } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { sanitizeHospitalCoordinates } from '../utils/googleMapsParser';

interface AppContextType {
  doctors: Doctor[];
  hospitals: Hospital[];
  visits: VisitLog[];
  cases: PatientCase[];
  worksheets: EmergencyWorksheet[];
  resources: MedicalResource[];
  cehMembers: CEHMember[];
  congregations: Congregation[];
  isCloudSynced: boolean;
  syncAllToCloud: () => Promise<{ ok: boolean; error?: string }>;
  
  // Search and Filter State
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  activeTab: 'dashboard' | 'doctors' | 'hospitals' | 'map' | 'visits' | 'cases' | 'resources' | 'congregations' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'doctors' | 'hospitals' | 'map' | 'visits' | 'cases' | 'resources' | 'congregations' | 'admin') => void;

  // CRUD Doctors
  addDoctor: (doc: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addDoctorsBulk: (newDocs: Doctor[], mode?: 'merge' | 'replace') => void;
  updateDoctor: (id: string, doc: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;

  // CRUD Hospitals
  addHospital: (hosp: Omit<Hospital, 'id' | 'createdAt'>) => void;
  updateHospital: (id: string, hosp: Partial<Hospital>) => void;
  deleteHospital: (id: string) => void;

  // CRUD Visits
  addVisit: (visit: Omit<VisitLog, 'id' | 'createdAt'>) => void;
  updateVisit: (id: string, visit: Partial<VisitLog>) => void;
  deleteVisit: (id: string) => void;

  // CRUD Cases
  addCase: (caseItem: Omit<PatientCase, 'id' | 'updatedAt'>) => void;
  updateCase: (id: string, caseItem: Partial<PatientCase>) => void;
  deleteCase: (id: string) => void;

  // CRUD Worksheets (hlc-7-S)
  addWorksheet: (ws: Omit<EmergencyWorksheet, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateWorksheet: (id: string, ws: Partial<EmergencyWorksheet>) => void;
  deleteWorksheet: (id: string) => void;

  // CEH Members & Congregations Management
  updateCEHMember: (id: string, fields: Partial<CEHMember>) => void;
  addCEHMember: (member: Omit<CEHMember, 'id'>) => void;
  deleteCEHMember: (id: string) => void;
  addCongregation: (congregation: Congregation) => void;
  deleteCongregation: (congregationNumber: string) => void;
  assignCongregationToMember: (congregationNumber: string, memberId: string | undefined) => void;
  toggleCongregationExclusion: (congregationNumber: string, reason?: string) => void;
  autoDistributeCongregations: () => void;
  resetCongregationAssignments: () => void;

  // Backup & Restore
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetToDefaultData: () => void;

  // Quick stats
  stats: {
    totalDoctors: number;
    totalCollaborators: number;
    totalConsultants: number;
    totalHospitals: number;
    totalVisitsThisMonth: number;
    activeCasesCount: number;
    totalWorksheets: number;
    totalCongregations: number;
    validTerritoryCongregations: number;
    excludedCongregations: number;
    assignedCongregations: number;
    unassignedCongregations: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_DOCTORS = 'clh_app_doctors_v2';
const STORAGE_KEY_HOSPITALS = 'clh_app_hospitals_v2';
const STORAGE_KEY_VISITS = 'clh_app_visits_v2';
const STORAGE_KEY_CASES = 'clh_app_cases_v2';
const STORAGE_KEY_WORKSHEETS = 'clh_app_worksheets_v2';
const STORAGE_KEY_CEH_MEMBERS = 'clh_app_ceh_members_v2';
const STORAGE_KEY_CONGREGATIONS = 'clh_app_congregations_v2';

const normalizeStringForComparison = (str: string) => 
  (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ');

export const deduplicateHospitals = (list: Hospital[]): Hospital[] => {
  const seenNames = new Map<string, Hospital>();
  const seenIds = new Set<string>();

  list.forEach(h => {
    if (!h || !h.id) return;
    if (seenIds.has(h.id)) return;

    const normName = normalizeStringForComparison(h.name);
    if (!normName) {
      seenIds.add(h.id);
      return;
    }

    if (seenNames.has(normName)) {
      const existing = seenNames.get(normName)!;
      const existingHasCoords = existing.coordinates?.lat !== undefined && existing.coordinates?.lng !== undefined;
      const currentHasCoords = h.coordinates?.lat !== undefined && h.coordinates?.lng !== undefined;

      const merged: Hospital = {
        ...existing,
        ...h,
        id: existing.id,
        coordinates: existingHasCoords ? existing.coordinates : (currentHasCoords ? h.coordinates : existing.coordinates),
        shortName: existing.shortName || h.shortName,
        phoneEmergency: existing.phoneEmergency || h.phoneEmergency,
        phoneGeneral: existing.phoneGeneral || h.phoneGeneral,
        assignedCEHMemberId: existing.assignedCEHMemberId || h.assignedCEHMemberId,
        congregationNumber: existing.congregationNumber || h.congregationNumber,
        address: existing.address || h.address,
        notes: existing.notes || h.notes,
      };

      seenNames.set(normName, merged);
    } else {
      seenIds.add(h.id);
      seenNames.set(normName, h);
    }
  });

  return Array.from(seenNames.values());
};


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clean up legacy v1 keys from older sessions
  useEffect(() => {
    ['clh_app_doctors_v1', 'clh_app_hospitals_v1', 'clh_app_visits_v1', 'clh_app_cases_v1'].forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DOCTORS);
    if (!saved) return INITIAL_DOCTORS;
    try {
      const parsed: Doctor[] = JSON.parse(saved);
      const exampleIds = ['doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-5', 'doc-6'];
      return parsed.filter(d => !exampleIds.includes(d.id));
    } catch {
      return INITIAL_DOCTORS;
    }
  });

  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    const sampleHospIds = ['hosp-1', 'hosp-2', 'hosp-3', 'hosp-4'];
    const saved = localStorage.getItem(STORAGE_KEY_HOSPITALS);
    if (!saved) return deduplicateHospitals(INITIAL_HOSPITALS.filter(h => !sampleHospIds.includes(h.id)));
    try {
      const parsed: Hospital[] = JSON.parse(saved);
      // Filter out old sample hospitals and migrate old hospital zones to Zona 3 if needed
      const cleaned = parsed
        .filter(h => !sampleHospIds.includes(h.id))
        .map(h => ({
          ...h,
          zone: (!h.zone || h.zone.includes('Zona Centro') || h.zone.includes('Zona Norte') || h.zone.includes('Zona Sur') || h.zone.includes('Zona Oeste')) ? 'Zona 3' : h.zone
        }));
      return deduplicateHospitals(cleaned);
    } catch {
      return deduplicateHospitals(INITIAL_HOSPITALS.filter(h => !sampleHospIds.includes(h.id)));
    }
  });

  const [visits, setVisits] = useState<VisitLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VISITS);
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  const [cases, setCases] = useState<PatientCase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CASES);
    return saved ? JSON.parse(saved) : INITIAL_CASES;
  });

  const [worksheets, setWorksheets] = useState<EmergencyWorksheet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WORKSHEETS);
    return saved ? JSON.parse(saved) : [];
  });

  const [cehMembers, setCehMembers] = useState<CEHMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CEH_MEMBERS);
    return saved ? JSON.parse(saved) : INITIAL_CEH_MEMBERS;
  });

  const [congregations, setCongregations] = useState<Congregation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONGREGATIONS);
    return saved ? JSON.parse(saved) : INITIAL_CONGREGATIONS;
  });

  const [resources] = useState<MedicalResource[]>(INITIAL_RESOURCES);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctors' | 'hospitals' | 'map' | 'visits' | 'cases' | 'resources' | 'congregations' | 'admin'>('dashboard');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Helper to sanitize payload and remove undefined values recursively before Firestore setDoc
  const removeUndefined = (val: any): any => {
    if (val === undefined || val === null) return null;
    if (Array.isArray(val)) {
      return val.map(item => removeUndefined(item));
    }
    if (typeof val === 'object') {
      const clean: Record<string, any> = {};
      for (const key of Object.keys(val)) {
        if (val[key] !== undefined) {
          clean[key] = removeUndefined(val[key]);
        }
      }
      return clean;
    }
    return val;
  };

  const sanitize = (data: any) => removeUndefined(JSON.parse(JSON.stringify(data ?? [])));

  // Helper to save a document to Firebase Firestore
  const saveDocToCloud = (docName: string, items: any) => {
    try {
      const cleanItems = sanitize(items);
      authReady.then(() => {
        setDoc(doc(db, 'appData', docName), { items: cleanItems, updatedAt: new Date().toISOString() })
          .then(() => setIsCloudSynced(true))
          .catch(err => {
            console.warn(`Firestore save error for ${docName} on primary db, trying default:`, err);
            setDoc(doc(defaultDb, 'appData', docName), { items: cleanItems, updatedAt: new Date().toISOString() })
              .then(() => setIsCloudSynced(true))
              .catch(e2 => console.warn(`Firestore save error on default db:`, e2));
          });
      });
    } catch (e) {
      console.warn('Firestore save error:', e);
    }
  };

  const syncAllToCloud = async (): Promise<{ ok: boolean; error?: string }> => {
    const payload = [
      { name: 'cehMembers', items: cehMembers },
      { name: 'doctors', items: doctors },
      { name: 'hospitals', items: hospitals },
      { name: 'visits', items: visits },
      { name: 'cases', items: cases },
      { name: 'worksheets', items: worksheets },
      { name: 'congregations', items: congregations },
    ];

    try {
      await authReady;
      for (const p of payload) {
        await setDoc(doc(db, 'appData', p.name), {
          items: sanitize(p.items),
          updatedAt: new Date().toISOString()
        });
      }
      setIsCloudSynced(true);
      return { ok: true };
    } catch (err1: any) {
      console.warn('Manual sync failed on named database, trying default database fallback...', err1);
      try {
        for (const p of payload) {
          await setDoc(doc(defaultDb, 'appData', p.name), {
            items: sanitize(p.items),
            updatedAt: new Date().toISOString()
          });
        }
        setIsCloudSynced(true);
        return { ok: true };
      } catch (err2: any) {
        console.error('Manual sync failed on default database as well:', err2);
        const errorDetails = err2?.message || err1?.message || String(err2 || err1);
        return { ok: false, error: errorDetails };
      }
    }
  };

  // Local persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORKSHEETS, JSON.stringify(worksheets));
  }, [worksheets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CEH_MEMBERS, JSON.stringify(cehMembers));
  }, [cehMembers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONGREGATIONS, JSON.stringify(congregations));
  }, [congregations]);

  // Real-time Cloud Sync from Firebase Firestore across all devices (Desktop, Mobile, etc.)
  useEffect(() => {
    const syncCollection = (
      docName: string,
      storageKey: string,
      setter: React.Dispatch<React.SetStateAction<any[]>>,
      defaultFallbackArray: any[] = []
    ) => {
      try {
        const docRef = doc(db, 'appData', docName);
        return onSnapshot(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const remoteItems = snapshot.data()?.items;
              if (Array.isArray(remoteItems)) {
                let itemsToSet = remoteItems;

                if (docName === 'hospitals') {
                  const sampleHospIds = ['hosp-1', 'hosp-2', 'hosp-3', 'hosp-4'];
                  const sampleNames = [
                    'hospital general universitario central',
                    'sanatorio de especialidades clínicas y quirúrgicas',
                    'hospital materno infantil esperanza',
                    'clínica de traumatología y urgencias médicas'
                  ];
                  
                  // Filter out sample hospitals, sanitize coordinates, and deduplicate
                  const cleaned = remoteItems
                    .filter(h => !sampleHospIds.includes(h.id) && !sampleNames.includes((h.name || '').toLowerCase().trim()))
                    .map(h => {
                      const sanitized = sanitizeHospitalCoordinates(h.coordinates);
                      return {
                        ...h,
                        coordinates: sanitized || h.coordinates,
                        zone: (!h.zone || h.zone.includes('Zona Centro') || h.zone.includes('Zona Norte') || h.zone.includes('Zona Sur') || h.zone.includes('Zona Oeste')) ? 'Zona 3' : h.zone
                      };
                    });

                  const deduplicated = deduplicateHospitals(cleaned);

                  if (deduplicated.length !== remoteItems.length) {
                    saveDocToCloud('hospitals', deduplicated);
                  }
                  itemsToSet = deduplicated;
                }

                setter(itemsToSet);
                localStorage.setItem(storageKey, JSON.stringify(itemsToSet));
              } else {
                // Remote doc empty or ill-formed: fallback to local or default data
                const savedLocal = localStorage.getItem(storageKey);
                let localParsed = defaultFallbackArray;
                if (savedLocal) {
                  try {
                    const parsed = JSON.parse(savedLocal);
                    if (Array.isArray(parsed)) {
                      localParsed = parsed;
                    }
                  } catch {}
                }
                setDoc(docRef, { items: localParsed, updatedAt: new Date().toISOString() }).catch(console.warn);
                setter(localParsed);
                localStorage.setItem(storageKey, JSON.stringify(localParsed));
              }
            } else {
              // Document doesn't exist yet in Firestore
              const saved = localStorage.getItem(storageKey);
              let initialData = defaultFallbackArray;
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (Array.isArray(parsed)) {
                    initialData = parsed;
                  }
                } catch {}
              }
              setDoc(docRef, { items: initialData, updatedAt: new Date().toISOString() }).catch(console.warn);
              setter(initialData);
              localStorage.setItem(storageKey, JSON.stringify(initialData));
            }
            setIsCloudSynced(true);
          },
          (err) => {
            console.warn(`Firestore sync error for ${docName}:`, err);
          }
        );
      } catch (e) {
        console.warn(`Firestore setup error for ${docName}:`, e);
        return () => {};
      }
    };

    // Las reglas de Firestore ahora exigen request.auth != null: hay que
    // esperar a que termine el inicio de sesión (anónimo, por ahora) antes
    // de suscribirse, o los onSnapshot fallarían con "permission-denied".
    let cancelled = false;
    let unsubscribers: Array<() => void> = [];

    authReady.then(() => {
      if (cancelled) return;
      unsubscribers = [
        syncCollection('cehMembers', STORAGE_KEY_CEH_MEMBERS, setCehMembers as any, INITIAL_CEH_MEMBERS),
        syncCollection('doctors', STORAGE_KEY_DOCTORS, setDoctors as any, INITIAL_DOCTORS),
        syncCollection('hospitals', STORAGE_KEY_HOSPITALS, setHospitals as any, INITIAL_HOSPITALS),
        syncCollection('visits', STORAGE_KEY_VISITS, setVisits as any, INITIAL_VISITS),
        syncCollection('cases', STORAGE_KEY_CASES, setCases as any, INITIAL_CASES),
        syncCollection('worksheets', STORAGE_KEY_WORKSHEETS, setWorksheets as any, []),
        syncCollection('congregations', STORAGE_KEY_CONGREGATIONS, setCongregations as any, INITIAL_CONGREGATIONS),
      ];
    });

    return () => {
      cancelled = true;
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Doctors CRUD
  const addDoctor = (docData: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newDoc: Doctor = {
      ...docData,
      id: 'doc-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      createdAt: today,
      updatedAt: today,
    };
    setDoctors(prev => {
      const updated = [newDoc, ...prev];
      saveDocToCloud('doctors', updated);
      return updated;
    });
  };

  const addDoctorsBulk = (newDocsList: Doctor[], mode: 'merge' | 'replace' = 'merge') => {
    if (mode === 'replace') {
      setDoctors(newDocsList);
      saveDocToCloud('doctors', newDocsList);
      return;
    }

    setDoctors(prev => {
      const existingNamesMap = new Map(prev.map(d => [d.name.trim().toLowerCase(), d]));
      const updated = [...prev];

      newDocsList.forEach(importedDoc => {
        const cleanName = importedDoc.name.trim().toLowerCase();
        if (existingNamesMap.has(cleanName)) {
          const existingIndex = updated.findIndex(d => d.name.trim().toLowerCase() === cleanName);
          if (existingIndex !== -1) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...importedDoc,
              id: updated[existingIndex].id,
              updatedAt: new Date().toISOString().split('T')[0]
            };
          }
        } else {
          updated.push(importedDoc);
        }
      });

      saveDocToCloud('doctors', updated);
      return updated;
    });
  };

  const updateDoctor = (id: string, updatedFields: Partial<Doctor>) => {
    const today = new Date().toISOString().split('T')[0];
    setDoctors(prev => {
      const updated = prev.map(doc => doc.id === id ? { ...doc, ...updatedFields, updatedAt: today } : doc);
      saveDocToCloud('doctors', updated);
      return updated;
    });
  };

  const deleteDoctor = (id: string) => {
    setDoctors(prev => {
      const updated = prev.filter(doc => doc.id !== id);
      saveDocToCloud('doctors', updated);
      return updated;
    });
  };

  // Hospitals CRUD
  const addHospital = (hospData: Omit<Hospital, 'id' | 'createdAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const normNewName = normalizeStringForComparison(hospData.name);

    setHospitals(prev => {
      const existingIndex = prev.findIndex(h => normalizeStringForComparison(h.name) === normNewName);
      let updated: Hospital[];

      if (existingIndex !== -1) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...hospData,
        };
      } else {
        const newHosp: Hospital = {
          ...hospData,
          id: 'hosp-' + Date.now(),
          createdAt: today,
        };
        updated = [newHosp, ...prev];
      }

      const deduplicated = deduplicateHospitals(updated);
      saveDocToCloud('hospitals', deduplicated);
      return deduplicated;
    });
  };

  const updateHospital = (id: string, updatedFields: Partial<Hospital>) => {
    setHospitals(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, ...updatedFields } : h);
      saveDocToCloud('hospitals', updated);
      try {
        localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error on hospital update:', e);
      }
      return updated;
    });
  };

  const deleteHospital = (id: string) => {
    setHospitals(prev => {
      const updated = prev.filter(h => h.id !== id);
      saveDocToCloud('hospitals', updated);
      try {
        localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error on hospital deletion:', e);
      }
      return updated;
    });
  };

  // Visits CRUD
  const addVisit = (visitData: Omit<VisitLog, 'id' | 'createdAt'>) => {
    const newVisit: VisitLog = {
      ...visitData,
      id: 'vis-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setVisits(prev => {
      const updated = [newVisit, ...prev];
      saveDocToCloud('visits', updated);
      return updated;
    });
  };

  const updateVisit = (id: string, updatedFields: Partial<VisitLog>) => {
    setVisits(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, ...updatedFields } : v);
      saveDocToCloud('visits', updated);
      return updated;
    });
  };

  const deleteVisit = (id: string) => {
    setVisits(prev => {
      const updated = prev.filter(v => v.id !== id);
      saveDocToCloud('visits', updated);
      return updated;
    });
  };

  // Cases CRUD
  const addCase = (caseData: Omit<PatientCase, 'id' | 'updatedAt'>) => {
    const newCase: PatientCase = {
      ...caseData,
      id: 'case-' + Date.now(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCases(prev => {
      const updated = [newCase, ...prev];
      saveDocToCloud('cases', updated);
      return updated;
    });
  };

  const updateCase = (id: string, updatedFields: Partial<PatientCase>) => {
    const today = new Date().toISOString().split('T')[0];
    setCases(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updatedFields, updatedAt: today } : c);
      saveDocToCloud('cases', updated);
      return updated;
    });
  };

  const deleteCase = (id: string) => {
    setCases(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveDocToCloud('cases', updated);
      return updated;
    });
  };

  // Worksheets (hlc-7-S) CRUD
  const addWorksheet = (wsData: Omit<EmergencyWorksheet, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = 'ws-' + Date.now();
    const today = new Date().toISOString().split('T')[0];
    const newWs: EmergencyWorksheet = {
      ...wsData,
      id,
      createdAt: today,
      updatedAt: today
    };
    setWorksheets(prev => {
      const updated = [newWs, ...prev];
      saveDocToCloud('worksheets', updated);
      return updated;
    });
    return id;
  };

  const updateWorksheet = (id: string, updatedFields: Partial<EmergencyWorksheet>) => {
    const today = new Date().toISOString().split('T')[0];
    setWorksheets(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, ...updatedFields, updatedAt: today } : w);
      saveDocToCloud('worksheets', updated);
      return updated;
    });
  };

  const deleteWorksheet = (id: string) => {
    setWorksheets(prev => {
      const updated = prev.filter(w => w.id !== id);
      saveDocToCloud('worksheets', updated);
      return updated;
    });
  };

  // CEH Members & Congregations CRUD & Distribution
  const updateCEHMember = (id: string, fields: Partial<CEHMember>) => {
    setCehMembers(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...fields } : m);
      saveDocToCloud('cehMembers', updated);
      return updated;
    });
  };

  const addCEHMember = (memberData: Omit<CEHMember, 'id'>) => {
    const newMember: CEHMember = {
      ...memberData,
      id: 'm-' + Date.now(),
      assignedCongregationIds: memberData.assignedCongregationIds || []
    };
    setCehMembers(prev => {
      const updated = [...prev, newMember];
      saveDocToCloud('cehMembers', updated);
      return updated;
    });
  };

  const deleteCEHMember = (id: string) => {
    setCongregations(prev => {
      const updatedCongs = prev.map(c => c.assignedMemberId === id ? { ...c, assignedMemberId: undefined } : c);
      saveDocToCloud('congregations', updatedCongs);
      return updatedCongs;
    });
    setCehMembers(prev => {
      const updatedMembers = prev.filter(m => m.id !== id);
      saveDocToCloud('cehMembers', updatedMembers);
      return updatedMembers;
    });
  };

  const addCongregation = (newCong: Congregation) => {
    setCongregations(prev => {
      const filtered = prev.filter(c => c.number !== newCong.number);
      const updated = [newCong, ...filtered];
      saveDocToCloud('congregations', updated);
      return updated;
    });
  };

  const deleteCongregation = (congregationNumber: string) => {
    setCongregations(prev => {
      const updated = prev.filter(c => c.number !== congregationNumber && c.name !== congregationNumber);
      saveDocToCloud('congregations', updated);
      return updated;
    });

    // Also remove from any member assignment
    setCehMembers(prev => {
      const updatedMembers = prev.map(m => ({
        ...m,
        assignedCongregationIds: m.assignedCongregationIds.filter(id => id !== congregationNumber)
      }));
      saveDocToCloud('cehMembers', updatedMembers);
      return updatedMembers;
    });
  };

  const assignCongregationToMember = (congregationNumber: string, memberId: string | undefined) => {
    setCongregations(prev => {
      const updatedCongs = prev.map(c => {
        if (c.number === congregationNumber) {
          return { ...c, assignedMemberId: memberId };
        }
        return c;
      });
      saveDocToCloud('congregations', updatedCongs);
      return updatedCongs;
    });

    setCehMembers(prev => {
      const updatedMembers = prev.map(m => {
        const filtered = m.assignedCongregationIds.filter(id => id !== congregationNumber);
        if (m.id === memberId) {
          return { ...m, assignedCongregationIds: [...filtered, congregationNumber] };
        }
        return { ...m, assignedCongregationIds: filtered };
      });
      saveDocToCloud('cehMembers', updatedMembers);
      return updatedMembers;
    });
  };

  const toggleCongregationExclusion = (congregationNumber: string, reason?: string) => {
    setCongregations(prev => {
      const updatedCongs = prev.map(c => {
        if (c.number === congregationNumber) {
          const nextExcluded = !c.isExcludedFromTerritory;
          return {
            ...c,
            isExcludedFromTerritory: nextExcluded,
            exclusionReason: nextExcluded ? (reason || 'Excluida de búsqueda territorial') : undefined,
            assignedMemberId: nextExcluded ? undefined : c.assignedMemberId
          };
        }
        return c;
      });
      saveDocToCloud('congregations', updatedCongs);
      return updatedCongs;
    });
  };

  const autoDistributeCongregations = () => {
    const validCongs = congregations.filter(c => !c.isExcludedFromTerritory);
    if (cehMembers.length === 0 || validCongs.length === 0) return;

    const newCongregations = [...congregations];
    const memberAssignments: Record<string, string[]> = {};
    cehMembers.forEach(m => { memberAssignments[m.id] = []; });

    validCongs.forEach((cong, idx) => {
      const targetMember = cehMembers[idx % cehMembers.length];
      const congIndex = newCongregations.findIndex(c => c.number === cong.number);
      if (congIndex !== -1) {
        newCongregations[congIndex] = {
          ...newCongregations[congIndex],
          assignedMemberId: targetMember.id
        };
      }
      if (memberAssignments[targetMember.id]) {
        memberAssignments[targetMember.id].push(cong.number);
      }
    });

    setCongregations(newCongregations);
    saveDocToCloud('congregations', newCongregations);

    const updatedMembers = cehMembers.map(m => ({
      ...m,
      assignedCongregationIds: memberAssignments[m.id] || []
    }));
    setCehMembers(updatedMembers);
    saveDocToCloud('cehMembers', updatedMembers);
  };

  const resetCongregationAssignments = () => {
    const resetCongs = congregations.map(c => ({ ...c, assignedMemberId: undefined }));
    const resetMembers = cehMembers.map(m => ({ ...m, assignedCongregationIds: [] }));
    setCongregations(resetCongs);
    setCehMembers(resetMembers);
    saveDocToCloud('congregations', resetCongs);
    saveDocToCloud('cehMembers', resetMembers);
  };

  // Backup & Export
  const exportDataJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      app: 'ComiteEnlaceHospitalario',
      doctors,
      hospitals,
      visits,
      cases,
      worksheets,
      cehMembers,
      congregations
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_comite_enlace_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.doctors && Array.isArray(parsed.doctors)) setDoctors(parsed.doctors);
      if (parsed.hospitals && Array.isArray(parsed.hospitals)) setHospitals(parsed.hospitals);
      if (parsed.visits && Array.isArray(parsed.visits)) setVisits(parsed.visits);
      if (parsed.cases && Array.isArray(parsed.cases)) setCases(parsed.cases);
      if (parsed.worksheets && Array.isArray(parsed.worksheets)) setWorksheets(parsed.worksheets);
      if (parsed.cehMembers && Array.isArray(parsed.cehMembers)) setCehMembers(parsed.cehMembers);
      if (parsed.congregations && Array.isArray(parsed.congregations)) setCongregations(parsed.congregations);
      setTimeout(() => { syncAllToCloud(); }, 100);
      return true;
    } catch (e) {
      console.error('Error importing JSON data', e);
      return false;
    }
  };

  const resetToDefaultData = () => {
    setDoctors(INITIAL_DOCTORS);
    setHospitals(INITIAL_HOSPITALS);
    setVisits(INITIAL_VISITS);
    setCases(INITIAL_CASES);
    setWorksheets([]);
    setCehMembers(INITIAL_CEH_MEMBERS);
    setCongregations(INITIAL_CONGREGATIONS);
    localStorage.removeItem(STORAGE_KEY_DOCTORS);
    localStorage.removeItem(STORAGE_KEY_HOSPITALS);
    localStorage.removeItem(STORAGE_KEY_VISITS);
    localStorage.removeItem(STORAGE_KEY_CASES);
    localStorage.removeItem(STORAGE_KEY_WORKSHEETS);
    localStorage.removeItem(STORAGE_KEY_CEH_MEMBERS);
    localStorage.removeItem(STORAGE_KEY_CONGREGATIONS);
    setTimeout(() => { syncAllToCloud(); }, 100);
  };

  // Calculate statistics
  const validTerritoryCongs = congregations.filter(c => !c.isExcludedFromTerritory);
  const excludedCongs = congregations.filter(c => c.isExcludedFromTerritory);
  const assignedCongs = validTerritoryCongs.filter(c => !!c.assignedMemberId);

  const stats = {
    totalDoctors: doctors.length,
    totalCollaborators: doctors.filter(d => d.type === 'colaborador').length,
    totalConsultants: doctors.filter(d => d.type === 'consultor').length,
    totalHospitals: hospitals.length,
    totalVisitsThisMonth: visits.length,
    activeCasesCount: cases.filter(c => c.patientStatus !== 'alta' && c.patientStatus !== 'resuelto').length,
    totalWorksheets: worksheets.length,
    totalCongregations: congregations.length,
    validTerritoryCongregations: validTerritoryCongs.length,
    excludedCongregations: excludedCongs.length,
    assignedCongregations: assignedCongs.length,
    unassignedCongregations: validTerritoryCongs.length - assignedCongs.length
  };

  return (
    <AppContext.Provider
      value={{
        doctors,
        hospitals,
        visits,
        cases,
        worksheets,
        resources,
        cehMembers,
        congregations,
        isCloudSynced,
        syncAllToCloud,
        globalSearch,
        setGlobalSearch,
        activeTab,
        setActiveTab,
        addDoctor,
        addDoctorsBulk,
        updateDoctor,
        deleteDoctor,
        addHospital,
        updateHospital,
        deleteHospital,
        addVisit,
        updateVisit,
        deleteVisit,
        addCase,
        updateCase,
        deleteCase,
        addWorksheet,
        updateWorksheet,
        deleteWorksheet,
        updateCEHMember,
        addCEHMember,
        deleteCEHMember,
        addCongregation,
        deleteCongregation,
        assignCongregationToMember,
        toggleCongregationExclusion,
        autoDistributeCongregations,
        resetCongregationAssignments,
        exportDataJSON,
        importDataJSON,
        resetToDefaultData,
        stats
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
