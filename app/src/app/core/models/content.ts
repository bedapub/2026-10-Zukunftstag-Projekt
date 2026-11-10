import { MemoryChoice } from './session';

export const ROCHE_TEAMS: { name: string; indication: string; indicationEn: string }[] = [
  { name: 'Actemra', indication: 'Rheumatoide Arthritis', indicationEn: 'Rheumatoid arthritis' },
  { name: 'Alecensa', indication: 'ALK-positiver Lungenkrebs', indicationEn: 'ALK-positive lung cancer' },
  { name: 'Avastin', indication: 'Verschiedene Krebsarten', indicationEn: 'Various cancers' },
  { name: 'CellCept', indication: 'Organtransplantation', indicationEn: 'Organ transplantation' },
  { name: 'Columvi', indication: 'Grosszelliges B-Zell-Lymphom', indicationEn: 'Large B-cell lymphoma' },
  { name: 'Cotellic', indication: 'Melanom', indicationEn: 'Melanoma' },
  { name: 'Enspryng', indication: 'NMOSD', indicationEn: 'NMOSD' },
  { name: 'Erivedge', indication: 'Basalzellkarzinom', indicationEn: 'Basal cell carcinoma' },
  { name: 'Esbriet', indication: 'Lungenfibrose', indicationEn: 'Pulmonary fibrosis' },
  { name: 'Evrysdi', indication: 'Spinale Muskelatrophie', indicationEn: 'Spinal muscular atrophy' },
  { name: 'Fuzeon', indication: 'HIV', indicationEn: 'HIV' },
  { name: 'Gazyva', indication: 'CLL / follikuläres Lymphom', indicationEn: 'CLL / follicular lymphoma' },
  { name: 'Hemlibra', indication: 'Hämophilie A', indicationEn: 'Hemophilia A' },
  { name: 'Herceptin', indication: 'HER2-positiver Brustkrebs', indicationEn: 'HER2-positive breast cancer' },
  { name: 'MabThera', indication: 'Lymphom / Rheumatoide Arthritis', indicationEn: 'Lymphoma / rheumatoid arthritis' },
  { name: 'Polivy', indication: 'Diffuses grosszelliges B-Zell-Lymphom', indicationEn: 'Diffuse large B-cell lymphoma' },
  { name: 'Perjeta', indication: 'HER2-positiver Brustkrebs', indicationEn: 'HER2-positive breast cancer' },
  { name: 'Phesgo', indication: 'HER2-positiver Brustkrebs', indicationEn: 'HER2-positive breast cancer' },
  { name: 'Rozlytrek', indication: 'ROS1 / NTRK Tumore', indicationEn: 'ROS1 / NTRK tumors' },
  { name: 'Tecentriq', indication: 'Verschiedene Krebsarten', indicationEn: 'Various cancers' },
  { name: 'Zelboraf', indication: 'BRAF-positives Melanom', indicationEn: 'BRAF-positive melanoma' },
  { name: 'Accutane', indication: 'Schwere Akne', indicationEn: 'Severe acne' },
  { name: 'Madopar', indication: 'Parkinson', indicationEn: "Parkinson's disease" },
  { name: 'Ocrevus', indication: 'Multiple Sklerose', indicationEn: 'Multiple sclerosis' },
  { name: 'Susvimo', indication: 'Feuchte AMD', indicationEn: 'Wet AMD' },
  { name: 'Vabysmo', indication: 'Feuchte AMD', indicationEn: 'Wet AMD' },
  { name: 'Pulmozyme', indication: 'Mukoviszidose', indicationEn: 'Cystic fibrosis' },
  { name: 'Rocephin', indication: 'Bakterielle Infektionen', indicationEn: 'Bacterial infections' },
  { name: 'Tamiflu', indication: 'Grippe', indicationEn: 'Influenza' },
  { name: 'Xofluza', indication: 'Grippe', indicationEn: 'Influenza' },
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
    correct: { cid: 124081896, name: 'Baloxavir marboxil' },
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
