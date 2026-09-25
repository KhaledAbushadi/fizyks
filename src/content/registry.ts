// المعرّفات المسجّلة للرسومات والمعامل والرسوم التوضيحية (المتحقق يرفض أي معرّف غير مسجَّل)
export const DIAGRAM_IDS = [
  'charge-flow',
  'energy-lift',
  'single-resistor',
  'open-circuit',
  'closed-circuit-internal-r',
  'terminal-voltmeter',
  'series-two-resistors',
  'series-three-resistors',
  'parallel-two-resistors',
  'parallel-three-resistors',
  'mixed-parallel-series',
  'wire-segment',
  'two-wires',
  'kirchhoff-junction',
  'kirchhoff-single-loop',
  'kirchhoff-two-loops',
] as const;
export type DiagramId = (typeof DIAGRAM_IDS)[number];

export const LAB_IDS = ['lab-charge', 'lab-energy', 'lab-ohm', 'lab-wire', 'lab-series', 'lab-parallel', 'lab-internal', 'lab-junction'] as const;
export type LabId = (typeof LAB_IDS)[number];

export const ART_IDS = [
  'art-charger',
  'art-pump',
  'art-dimmer',
  'art-wires',
  'art-lights-series',
  'art-home-sockets',
  'art-car-battery',
  'art-roundabout',
] as const;
export type ArtId = (typeof ART_IDS)[number];
