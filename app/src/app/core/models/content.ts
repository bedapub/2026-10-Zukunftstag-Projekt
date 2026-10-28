import { MemoryChoice } from './session';

export const ROCHE_TEAMS: { name: string; indication: string }[] = [
  { name: 'Actemra', indication: 'Rheumatoide Arthritis' },
  { name: 'Alecensa', indication: 'ALK-positiver Lungenkrebs' },
  { name: 'Avastin', indication: 'Verschiedene Krebsarten' },
  { name: 'CellCept', indication: 'Organtransplantation' },
  { name: 'Columvi', indication: 'Grosszelliges B-Zell-Lymphom' },
  { name: 'Cotellic', indication: 'Melanom' },
  { name: 'Enspryng', indication: 'NMOSD' },
  { name: 'Erivedge', indication: 'Basalzellkarzinom' },
  { name: 'Esbriet', indication: 'Lungenfibrose' },
  { name: 'Evrysdi', indication: 'Spinale Muskelatrophie' },
  { name: 'Fuzeon', indication: 'HIV' },
  { name: 'Gazyva', indication: 'CLL / follikuläres Lymphom' },
  { name: 'Hemlibra', indication: 'Hämophilie A' },
  { name: 'Herceptin', indication: 'HER2-positiver Brustkrebs' },
  { name: 'MabThera', indication: 'Lymphom / Rheumatoide Arthritis' },
  { name: 'Polivy', indication: 'Diffuses grosszelliges B-Zell-Lymphom' },
  { name: 'Perjeta', indication: 'HER2-positiver Brustkrebs' },
  { name: 'Phesgo', indication: 'HER2-positiver Brustkrebs' },
  { name: 'Rozlytrek', indication: 'ROS1 / NTRK Tumore' },
  { name: 'Tecentriq', indication: 'Verschiedene Krebsarten' },
  { name: 'Zelboraf', indication: 'BRAF-positives Melanom' },
  { name: 'Accutane', indication: 'Schwere Akne' },
  { name: 'Madopar', indication: 'Parkinson' },
  { name: 'Ocrevus', indication: 'Multiple Sklerose' },
  { name: 'Susvimo', indication: 'Feuchte AMD' },
  { name: 'Vabysmo', indication: 'Feuchte AMD' },
  { name: 'Pulmozyme', indication: 'Mukoviszidose' },
  { name: 'Rocephin', indication: 'Bakterielle Infektionen' },
  { name: 'Tamiflu', indication: 'Grippe' },
  { name: 'Xofluza', indication: 'Grippe' },
];

export interface MemoryRoundDef {
  name: string;
  correct: { cid: number; name: string };
  decoys: { cid: number; name: string }[];
}

export const MEMORY_ROUNDS: MemoryRoundDef[] = [
  {
    name: 'Aspirin',
    correct: { cid: 2244, name: 'Aspirin' },
    decoys: [
      { cid: 2519, name: 'Koffein' },
      { cid: 1983, name: 'Paracetamol' },
      { cid: 3672, name: 'Ibuprofen' },
    ],
  },
  {
    name: 'Glutathion',
    correct: { cid: 124886, name: 'Glutathion' },
    decoys: [
      { cid: 5793, name: 'Glucose' },
      { cid: 54670067, name: 'Vitamin C' },
      { cid: 5862, name: 'Cystein' },
    ],
  },
  {
    name: 'Dopamin',
    correct: { cid: 681, name: 'Dopamin' },
    decoys: [
      { cid: 5202, name: 'Serotonin' },
      { cid: 5816, name: 'Adrenalin' },
      { cid: 774, name: 'Histamin' },
    ],
  },
  {
    name: 'Baloxavir',
    correct: { cid: 124081897, name: 'Baloxavir marboxil' },
    decoys: [
      { cid: 65028, name: 'Oseltamivir (Tamiflu)' },
      { cid: 2022, name: 'Aciclovir' },
      { cid: 121304016, name: 'Remdesivir' },
    ],
  },
  {
    name: 'Risdiplam',
    correct: { cid: 118513481, name: 'Risdiplam' },
    decoys: [
      { cid: 6047, name: 'Levodopa' },
      { cid: 3016, name: 'Diazepam' },
      { cid: 3670, name: 'Pyridostigmin' },
    ],
  },
];

export const MEMORY_LABELS: MemoryChoice[] = ['A', 'B', 'C', 'D'];

export function moleculeImage(cid: number): string {
  return `/assets/molecules/${cid}.png`;
}

const CORRECT_TRANSFORMS = [
  'none',
  'rotate(90deg)',
  'rotate(180deg)',
  'scaleX(-1)',
  'rotate(145deg) scaleX(-1)',
];

export function moleculeTransform(
  roundIndex: number,
  cid: number,
  promptCid: number,
): string {
  if (cid === promptCid) {
    return CORRECT_TRANSFORMS[Math.min(Math.max(roundIndex, 0), CORRECT_TRANSFORMS.length - 1)];
  }
  if (roundIndex < 2) return 'none';
  const tilt = ((cid % 7) - 3) * 12;
  return `rotate(${tilt}deg)`;
}
