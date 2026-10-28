export type PersonRole = 'parent' | 'child';
export type GameId =
  | 'lobby'
  | 'heights'
  | 'circumference'
  | 'memory'
  | 'study'
  | 'feedback'
  | 'done';
export type GameStage = 'show' | 'play' | 'results';
export type MemoryChoice = 'A' | 'B' | 'C' | 'D';
export type ChocolateColor = 'red' | 'black';

export interface Person {
  id: string;
  role: PersonRole;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  people: Person[];
  joinedAt: number;
}

export interface HeightEntry {
  personId: string;
  cm: number;
}

export interface HeightsAnswer {
  teamId: string;
  entries: HeightEntry[];
}

export interface UmfangEntry {
  personId: string;
  meters: number;
}

export interface UmfangAnswer {
  teamId: string;
  entries: UmfangEntry[];
}

export interface MemoryAnswer {
  teamId: string;
  round: number;
  choice: MemoryChoice;
}

export interface StudyPersonEntry {
  personId: string;
  color: ChocolateColor;
  before: number;
  after: number;
}

export interface StudyAnswer {
  teamId: string;
  entries: StudyPersonEntry[];
}

export interface FeedbackAnswer {
  teamId: string;
  rating: number;
  comment: string;
}

export interface MemoryOption {
  label: MemoryChoice;
  cid: number;
  name: string;
}

export interface MemoryRoundPublic {
  index: number;
  name: string;
  options: MemoryOption[];
  promptCid: number;
  correctLabel?: MemoryChoice;
}

export interface PublicSession {
  code: string;
  game: GameId;
  stage: GameStage;
  memoryRound: number;
  umfangTruth: number;
  studyUnblinded: boolean;
  studyDrugColor?: ChocolateColor;
  memoryRounds: MemoryRoundPublic[];
  teams: Team[];
  heights: HeightsAnswer[];
  umfang: UmfangAnswer[];
  memory: MemoryAnswer[];
  study: StudyAnswer[];
  feedback: FeedbackAnswer[];
}

export interface HostSession extends PublicSession {
  hostKey: string;
  studyDrugColor: ChocolateColor;
}

export interface GameSummary {
  code: string;
  hostKey: string;
  createdAt: number;
  game: GameId;
  teamCount: number;
  finished: boolean;
}

export const GAME_ORDER: GameId[] = [
  'lobby',
  'heights',
  'circumference',
  'memory',
  'study',
  'feedback',
  'done',
];

export const GAME_TITLES: Record<GameId, string> = {
  lobby: 'Tech Check',
  heights: 'Spiel der Körpergrössen',
  circumference: 'Rat den Zimmerumfang',
  memory: 'Molekül Memory',
  study: 'Klinische Studie',
  feedback: 'Feedback',
  done: 'Auswertung',
};
