import { Lang } from './messages';

export interface ChartCopy {
  child: string;
  parent: string;
  parents: string;
  frequency: string;
  group: string;
  median: string;
  medianParent: string;
  medianChild: string;
  sameSize: string;
  team: string;
  teams: string;
  fit: string;
  top3: string;
  heightChildCm: string;
  heightParentCm: string;
  heightCm: string;
  heightGroup: string;
  umfangGroup: string;
  umfangM: string;
  umfangDiffM: string;
  teamRole: string;
  answer: string;
  answersTeamCount: string;
  correctMolecules: string;
  pain: string;
  before: string;
  after: string;
  chocolate: string;
  diffAfterBefore: string;
  rating: string;
  teamCount: string;
  drug: string;
  placebo: string;
  red: string;
  black: string;
  histogram: string;
  boxplot: string;
  scatter: string;
  barChart: string;
  pairedSlope: string;
  diffPlot: string;
  stars: string;
  memoryGroup: string;
  studyGroup: string;
  feedbackGroup: string;
  molecule: string;
  hoverFreq: string;
  hoverTeams: string;
  hoverTeamsWith: string;
  hoverCorrect: string;
  hoverRight: string;
  hoverWrong: string;
  hoverRating: string;
  truth: string;
}

const de: ChartCopy = {
  child: 'Kind',
  parent: 'Eltern',
  parents: 'Eltern',
  frequency: 'Frequenz',
  group: 'Gruppe',
  median: 'Median',
  medianParent: 'Median Eltern',
  medianChild: 'Median Kind',
  sameSize: 'Gleiche Grösse',
  team: 'Team',
  teams: 'Teams',
  fit: 'Fit (Regression)',
  top3: 'Top 3',
  heightChildCm: 'Körpergrösse Kind [cm]',
  heightParentCm: 'Körpergrösse Eltern [cm]',
  heightCm: 'Körpergrösse [cm]',
  heightGroup: 'Körpergrösse',
  umfangGroup: 'Zimmerumfang',
  umfangM: 'Umfang [meter]',
  umfangDiffM: 'Unterschied [meter]',
  teamRole: 'Team · Rolle',
  answer: 'Antwort',
  answersTeamCount: 'Antworten (Anzahl Teams)',
  correctMolecules: 'Richtige Moleküle',
  pain: 'Schmerz',
  before: 'Vor',
  after: 'Nach',
  chocolate: 'Schokolade',
  diffAfterBefore: 'Differenz (Nach − Vor)',
  rating: 'Bewertung (1–6)',
  teamCount: 'Anzahl Teams',
  drug: 'Medikament',
  placebo: 'Placebo',
  red: 'Rot',
  black: 'Schwarz',
  histogram: 'Histogram',
  boxplot: 'Boxplot',
  scatter: 'Scatterplot',
  barChart: 'Balkendiagramm',
  pairedSlope: 'Paired Slope Chart',
  diffPlot: 'Differenzen-Plot',
  stars: 'Sterne',
  memoryGroup: 'Molekül Memory',
  studyGroup: 'Klinische Studie',
  feedbackGroup: 'Feedback',
  molecule: 'Molekül',
  hoverFreq: 'Frequenz',
  hoverTeams: 'Teams',
  hoverTeamsWith: 'Teams mit',
  hoverCorrect: 'richtig',
  hoverRight: 'richtig',
  hoverWrong: 'falsch',
  hoverRating: 'Bewertung',
  truth: 'Wahrheit',
};

const en: ChartCopy = {
  child: 'Child',
  parent: 'Parent',
  parents: 'Parents',
  frequency: 'Frequency',
  group: 'Group',
  median: 'Median',
  medianParent: 'Parent median',
  medianChild: 'Child median',
  sameSize: 'Same height',
  team: 'Team',
  teams: 'Teams',
  fit: 'Fit (regression)',
  top3: 'Top 3',
  heightChildCm: 'Child height [cm]',
  heightParentCm: 'Parent height [cm]',
  heightCm: 'Height [cm]',
  heightGroup: 'Height',
  umfangGroup: 'Room circumference',
  umfangM: 'Circumference [meters]',
  umfangDiffM: 'Difference [meters]',
  teamRole: 'Team · role',
  answer: 'Answer',
  answersTeamCount: 'Answers (number of teams)',
  correctMolecules: 'Correct molecules',
  pain: 'Pain',
  before: 'Before',
  after: 'After',
  chocolate: 'Chocolate',
  diffAfterBefore: 'Difference (after − before)',
  rating: 'Rating (1–6)',
  teamCount: 'Number of teams',
  drug: 'Drug',
  placebo: 'Placebo',
  red: 'Red',
  black: 'Black',
  histogram: 'Histogram',
  boxplot: 'Box plot',
  scatter: 'Scatter plot',
  barChart: 'Bar chart',
  pairedSlope: 'Paired slope chart',
  diffPlot: 'Difference plot',
  stars: 'Stars',
  memoryGroup: 'Molecule memory',
  studyGroup: 'Clinical study',
  feedbackGroup: 'Feedback',
  molecule: 'Molecule',
  hoverFreq: 'Frequency',
  hoverTeams: 'Teams',
  hoverTeamsWith: 'Teams with',
  hoverCorrect: 'correct',
  hoverRight: 'correct',
  hoverWrong: 'wrong',
  hoverRating: 'Rating',
  truth: 'Truth',
};

export function chartCopy(lang: Lang): ChartCopy {
  return lang === 'en' ? en : de;
}
