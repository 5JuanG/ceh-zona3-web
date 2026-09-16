import { Specialty } from '../types';

/**
 * Catálogo completo de especialidades y subespecialidades médicas.
 * Basado en el folleto "Especialidades médicas fundamentales" (hlc-9-S) y en las
 * especialidades administrativas propias del CEH Zona 3.
 *
 * Se usa tanto en el filtro del Directorio de Médicos como en el modal
 * "Añadir un nuevo médico", para que ambos siempre muestren la misma lista.
 */
export interface SpecialtyGroup {
  label: string;
  items: Specialty[];
}

export const SPECIALTY_GROUPS: SpecialtyGroup[] = [
  {
    label: 'Cirugía General y subespecialidades',
    items: [
      'Cirugía General',
      'Cirugía Bucal y Maxilofacial',
      'Cirugía Cardíaca',
      'Cirugía Colorrectal',
      'Cirugía de Trasplantes',
      'Cirugía Ortopédica',
      'Cirugía Torácica',
      'Cirugía Traumatológica',
      'Cirugía Vascular',
      'Tratamiento de Quemaduras',
    ],
  },
  {
    label: 'Medicina Interna y subespecialidades',
    items: [
      'Medicina Interna',
      'Cuidados Intensivos (UCI)',
      'Gastroenterología',
      'Hematología',
      'Nefrología',
      'Neumología',
      'Oncología',
    ],
  },
  {
    label: 'Obstetricia y Ginecología',
    items: [
      'Ginecología y Obstetricia',
      'Ginecología',
      'Ginecología Oncológica',
      'Obstetricia',
      'Hospitalista Tocoginecólogo',
      'Perinatólogo (Embarazos de Alto Riesgo)',
    ],
  },
  {
    label: 'Pediatría',
    items: [
      'Pediatría y Neonatología',
      'Neonatología',
    ],
  },
  {
    label: 'Radiología',
    items: [
      'Radiología Intervencionista',
    ],
  },
  {
    label: 'Otras especialidades médicas',
    items: [
      'Anestesiología',
      'Cardiología / Cirugía Cardiovascular',
      'Medicina de Urgencias',
      'Medicina Hospitalaria',
      'Nocturnista',
      'Neurocirugía',
      'Otorrinolaringología (Cirugía de Cabeza y Cuello)',
      'Traumatología y Ortopedia',
      'Urología',
    ],
  },
  {
    label: 'Administrativo / Otro',
    items: [
      'Bioética',
      'Dirección Médica',
      'Otra',
      'Proveedor de la Salud',
      'Colaborador Administrativo',
    ],
  },
];

/** Lista plana de todas las especialidades, en el mismo orden que los grupos. */
export const SPECIALTIES: Specialty[] = SPECIALTY_GROUPS.flatMap(g => g.items);
