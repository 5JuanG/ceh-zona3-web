import { Doctor, Hospital, VisitLog, PatientCase, MedicalResource } from '../types';

export const INITIAL_HOSPITALS: Hospital[] = [];

export const INITIAL_DOCTORS: Doctor[] = [];

export const INITIAL_VISITS: VisitLog[] = [];

export const INITIAL_CASES: PatientCase[] = [];

export const INITIAL_RESOURCES: MedicalResource[] = [
  {
    id: 'res-1',
    title: 'Eritropoyetina (rHuEPO) en Anemia Preoperatoria',
    category: 'farmacos',
    description: 'Protocolos de estimulación de la eritropoyesis preoperatoria acelerada y de mantenimiento.',
    clinicalSummary: 'La EPO recombinante humana estimula la producción de glóbulos rojos. En dosis de 300 UI/kg/día por 10 días o 40.000 UI semanales junto a hierro parenteral, puede elevar la Hb entre 1.5 a 3.0 g/dL en 7-14 días.',
    dosageOrUsage: 'Pauta habitual: 40,000 UI SC semanal o 300 UI/kg/día por 10 días antes de cirugía electiva. Acompañar SIEMPRE con Hierro EV (e.g. Carboximaltosa de Hierro o Hierro Sacarosado).',
    references: 'Anesthesia & Analgesia / British Journal of Anaesthesia / Guías PBM',
    tags: ['EPO', 'Eritropoyetina', 'Hierro EV', 'Anemia', 'Preoperatorio']
  },
  {
    id: 'res-2',
    title: 'Recuperador de Sangre Intraoperatorio (Cell Saver)',
    category: 'equipos',
    description: 'Principios de funcionamiento y maniobras para la recuperación de glóbulos rojos autólogos en campo quirúrgico.',
    clinicalSummary: 'Aspira la sangre perdida en la cavidad quirúrgica, la mezcla con anticoagulante, la lava y la centrifuga para devolver al paciente un concentrado de sus propios glóbulos rojos lavados con hematocrito del 50-60%. Es un circuito cerrado continuo aceptable para la conciencia de la gran mayoría de los pacientes.',
    dosageOrUsage: 'Indicado en cirugías con pérdida hemática estimada > 500 ml (Cardíaca, Traumatología de columna/cadera, Vascular, Aneurismas).',
    references: 'Manual de Recuperación Hemática Autóloga / Sociedad de Anestesiología',
    tags: ['Cell Saver', 'Autotransfusión', 'Circuito Cerrado', 'Intraoperatorio']
  },
  {
    id: 'res-3',
    title: 'Antifibrinolíticos: Ácido Tranexámico (TXA)',
    category: 'farmacos',
    description: 'Uso de antifibrinolíticos para reducir la fibrinólisis y mitigar el sangrado en traumatismos, cirugías mayores y ginecología.',
    clinicalSummary: 'El Ácido Tranexámico inhibe competitivamente la activación del plasminógeno a plasmina. Administrado de forma precoz reduce la pérdida sanguínea en un 25-40% en cirugía mayor y emergencias.',
    dosageOrUsage: 'Dosis estándar adulto: 1 g IV en 10 min al inicio de la cirugía o trauma, seguido opcionalmente de infusión de 1g en 8 horas. O dosis tópica intraarticular en traumatología.',
    references: 'Estudios CRASH-2 y CRASH-3 / WOMAN Trial',
    tags: ['Ácido Tranexámico', 'TXA', 'Antifibrinolítico', 'Hemorragia']
  },
  {
    id: 'res-4',
    title: 'Expandores de Volumen Plasmático No Sanguíneos',
    category: 'pbm',
    description: 'Soluciones cristaloides y coloides para mantener la normovolemia y la perfusión tisular.',
    clinicalSummary: 'Mantener el volumen intravascular adecuado es vital para garantizar la perfusión orgánica durante la hemodilución. La capacidad de transporte de oxígeno se mantiene adecuada incluso con niveles de Hb sustancialmente reducidos si el volumen circulatorio se mantiene estable.',
    dosageOrUsage: 'Soluciones Cristaloides (Ringer Lactato, Solución Fisiológica 0.9%, Isolyte) y Coloides no hemáticos según normatividad local.',
    references: 'Fundamentos de Fisiología Cardiovascular y Hemodilución Normovolémica',
    tags: ['Expandores', 'Cristaloides', 'Ringer Lactato', 'Normovolemia']
  },
  {
    id: 'res-5',
    title: 'Documento de Voluntades Anticipadas (DPA) y Directivas Médicas',
    category: 'legal',
    description: 'Aspectos legales, ejercicio de la autonomía del paciente y validez jurídica de la exoneración de responsabilidad médica.',
    clinicalSummary: 'El documento DPA firmante refleja el libre ejercicio del derecho fundamental del paciente a rechazar la transfusión de sangre completa o sus 4 componentes principales, aceptando alternativas médicas sin sangre. Otorga respaldo y amparo legal total al equipo médico tratante.',
    references: 'Ley de Derechos del Paciente / Bioética y Autonomía de la Persona',
    tags: ['DPA', 'Voluntades Anticipadas', 'Autonomía', 'Bioética', 'Legal']
  }
];
