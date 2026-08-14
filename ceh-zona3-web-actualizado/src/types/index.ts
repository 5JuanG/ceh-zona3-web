export type DoctorType = 'colaborador' | 'consultor' | 'contacto_administrativo' | 'proveedor_salud';

export type DoctorStatus = 'disponible' | 'solo_urgencias' | 'en_consulta' | 'inactivo';

// Estatus de autorización por la sucursal. Aplica principalmente a médicos
// colaboradores/consultores: mientras no exista el campo (registros viejos)
// o sea 'autorizado', se consideran parte del directorio oficial. 'pendiente'
// significa que solo se tienen datos de contacto, todavía no fue aprobado.
export type DoctorApprovalStatus = 'pendiente' | 'autorizado';

export type Specialty = 
  | 'Cirugía General'
  | 'Anestesiología'
  | 'Hematología'
  | 'Ginecología y Obstetricia'
  | 'Traumatología y Ortopedia'
  | 'Pediatría y Neonatología'
  | 'Cuidados Intensivos (UCI)'
  | 'Cardiología / Cirugía Cardiovascular'
  | 'Gastroenterología'
  | 'Nefrología'
  | 'Oncología'
  | 'Bioética'
  | 'Dirección Médica'
  | 'Otra';

export interface Hlc31Data {
  formPurpose?: 'actualizar' | 'nuevo';
  contactTypes?: string[]; // 'medico_colaborador', 'medico_consultor', 'testigo_jehova', 'miembro_ceh', 'otro'
  contactTypeOther?: string;
  sec1Comments?: string;
  firstContactDateAndPlace?: string;

  firstName?: string;
  lastName?: string;
  phoneFixed?: string;
  phoneMobile?: string;
  email?: string;
  gender?: string;
  congregationInfo?: string;
  address?: string;
  city?: string;
  stateProvince?: string;
  zipCode?: string;
  country?: string;
  sec2Comments?: string;

  specialty1?: string;
  subSpecialty1?: string;
  specialty2?: string;
  subSpecialty2?: string;
  specialty3?: string;
  subSpecialty3?: string;
  acceptedPatientTypes?: string[]; // 'adulto', 'nino', 'neonato'
  sec3Comments?: string;

  cehName?: string;
  formDate?: string;
  cehMemberName?: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string; // e.g., 'Dr.', 'Dra.', 'Prof.'
  type: DoctorType;
  specialty: Specialty;
  subSpecialty?: string;
  hospitalIds: string[]; // Associated hospitals
  department?: string;
  phoneMobile: string;
  phoneHospital?: string;
  phoneExtension?: string;
  email?: string;
  status: DoctorStatus;
  approvalStatus?: DoctorApprovalStatus; // 'pendiente' = solo contactado; 'autorizado' = aprobado por la sucursal
  bloodlessExperience: 'alto' | 'medio' | 'en_formacion' | 'por_contactar';
  pbmTechniquesUsed?: string[]; // e.g. Recuperador de sangre, Normovolemia, EPO, etc.
  notes: string;
  lastContactDate?: string;
  preferredContactHour?: string;
  hlc31?: Hlc31Data;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  shortName?: string;
  zone: string; // e.g. "Zona Norte", "Centro", "Sector Metropolitano"
  type: 'publico' | 'privado' | 'mixto';
  address: string;
  city: string;
  phoneEmergency: string;
  phoneGeneral: string;
  email?: string;
  website?: string;
  contactPerson?: string; // Liaison or Director at Hospital
  pbmProtocolsAccepted: boolean; // Patient Blood Management accepted
  acceptsBloodlessSurgery: boolean;
  assignedCEHMemberId?: string; // Responsible CEH member who discovered/manages this hospital
  congregationNumber?: string; // Congregation territory where hospital is located
  notes: string;
  googleMapsUrl?: string; // Enlace de compartir de Google Maps (maps.app.goo.gl o similar)
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export interface VisitLog {
  id: string;
  date: string;
  hospitalId: string;
  doctorId?: string;
  contactName?: string;
  committeeMembers: string[]; // Members of the committee who attended
  objective: string; // e.g., 'Presentación de literatura', 'Consulta de caso urgente', 'Seguimiento bioética'
  summary: string;
  outcome: string;
  requiresFollowUp: boolean;
  followUpDate?: string;
  status: 'completada' | 'pendiente' | 'programada';
  createdAt: string;
}

export interface PatientCase {
  id: string;
  caseCode: string; // Confidential code, e.g. "CASO-2026-081"
  hospitalId: string;
  attendingDoctorId?: string;
  attendingDoctorName?: string;
  consultantDoctorId?: string;
  specialtyRequired: Specialty;
  assignedCommitteeMember: string;
  patientStatus: 'estable' | 'cuidados_intensivos' | 'programado_cirugia' | 'alta' | 'resuelto';
  summary: string;
  appliedStrategies: string[]; // e.g. "EPO a dosis altas", "Acido Tranexámico", "Hemodilución"
  startDate: string;
  updatedAt: string;
  notes: string;
}

export interface MedicalResource {
  id: string;
  title: string;
  category: 'pbm' | 'farmacos' | 'equipos' | 'bioetica' | 'legal';
  description: string;
  clinicalSummary: string;
  dosageOrUsage?: string;
  references?: string;
  tags: string[];
}

export interface CEHMemberPermissions {
  canAssignTerritories: boolean;
  canManageMembers: boolean;
  canRemoveMembers: boolean;
  canManagePasswords: boolean;
  canEditHospitalsDoctors: boolean;
}

export type CEHRole = 'Coordinador' | 'Secretario' | 'Auxiliar' | 'Enlace Hospitalario' | 'Bioética / Legal' | string;

export interface CEHMember {
  id: string; // e.g. 'm-1'
  name: string;
  phone?: string;
  email?: string;
  role?: CEHRole;
  color: string;
  assignedCongregationIds: string[];
  photoUrl?: string; // Profile photo URL or base64 image
  status?: 'activo' | 'inactivo';
  permissions?: CEHMemberPermissions;
}

export interface Congregation {
  id?: string;
  number: string; // e.g., "63412"
  name: string;
  city: string;
  language: string;
  circuitSection: string;
  publishersCount: number;
  eldersCount: number;
  ministerialServantsCount: number;
  pioneersCount: number;
  isExcludedFromTerritory: boolean;
  exclusionReason?: string;
  assignedMemberId?: string; // ID of assigned CEH member
  assignedMemberName?: string;
  hospitalsFoundCount?: number;
  notes?: string;
}

export interface LabResultEntry {
  dateTime: string;
  hemoglobin: string;
  hematocrit: string;
  platelets: string;
  others: string;
}

export interface EmergencyWorksheet {
  id: string;
  caseCode?: string;
  createdAt: string;
  updatedAt: string;

  // 1. NOTIFICACIÓN
  callDateTime: string;
  callerName: string;
  callerContactInfo: string;
  patientRequestsHlcHelp: boolean;
  relationshipToPatient: string;

  // 2. INFORMACIÓN SOBRE EL PACIENTE/HOSPITAL
  patientName: string;
  gender: 'Masculino' | 'Femenino' | '';
  age: string;
  isBaptized: boolean;
  hasGoodReputation: boolean;
  hasDpaCompleted: boolean;
  patientComments: string;

  // Menor o recién nacido
  fatherName: string;
  fatherBaptized: boolean;
  motherName: string;
  motherBaptized: boolean;
  familyComments: string;

  hospitalName: string;
  roomNumber: string;
  hospitalPhone: string;
  congregationName: string;
  contactedEldersNames: string;
  contactedEldersPhones: string;

  // Recién nacidos
  birthWeight: string;
  gestationalAgeWeeks: string;
  birthDate: string;
  apgarBirth: string;
  apgar5Min: string;

  // 3. INFORMACIÓN SOBRE EL PROBLEMA MÉDICO
  specificProblem: string;
  relevantMedicalHistory: string;

  // 4. RESULTADOS DE LOS ANÁLISIS DE LABORATORIO
  labResults: LabResultEntry[];

  // 5. INFORMACIÓN SOBRE EL MÉDICO
  attendingDoctor: string;
  attendingDoctorSpecialty: string;
  otherDoctor: string;
  otherDoctorSpecialty: string;

  // 6. PLAN DE TRATAMIENTO DEL MÉDICO
  treatmentPlan: string;
  medicalStaffNotifiedHlcHelp: boolean;
  legalActionMentioned: boolean;

  // 7. ESTRATEGIAS/ALTERNATIVAS
  strategiesAndAlternatives: string;

  // 8. ARTÍCULOS MÉDICOS
  medicalArticles: string;
  doctorWillingToCollabAfterArticles: boolean;

  // 9. CONSULTA ENTRE MÉDICOS
  consultantDoctorName: string;
  consultantPreferredContact: string;
  consultantSpecialty: string;
  consultantAdditionalInfo: string;

  // 10. SOLICITUD DE TRASLADO
  transferConfirmed: boolean;
  hospitalInfoSectionContacted: boolean;
  transferHospitalName: string;
  transferAttendingDoctor: string;
  transferHospitalContactPhone: string;
  transferAdditionalInfo: string;

  // 11. RESULTADOS/SEGUIMIENTO
  localEldersContactedFollowup: boolean;
  followupResultsAndDetails: string;
}
