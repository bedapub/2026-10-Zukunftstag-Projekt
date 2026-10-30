import {
  ChocolateColor,
  MemoryAnswer,
  Person,
  PublicSession,
  StudyAnswer,
} from './session';

export interface NamedValue {
  teamName: string;
  personName: string;
  role: Person['role'];
  value: number;
}

export interface HistogramBin {
  start: number;
  label: string;
  parent: number;
  child: number;
}

export interface BoxStats {
  values: number[];
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

function personMap(session: PublicSession): Map<string, Person> {
  const map = new Map<string, Person>();
  for (const team of session.teams) {
    for (const person of team.people) {
      map.set(person.id, person);
    }
  }
  return map;
}

function collectValues<E extends { personId: string }>(
  session: PublicSession,
  answers: { teamId: string; entries: E[] }[],
  valueOf: (entry: E) => number,
): NamedValue[] {
  const people = personMap(session);
  const out: NamedValue[] = [];
  for (const answer of answers) {
    const team = session.teams.find((item) => item.id === answer.teamId);
    if (!team) continue;
    for (const entry of answer.entries) {
      const person = people.get(entry.personId);
      if (!person) continue;
      out.push({
        teamName: team.name,
        personName: person.name,
        role: person.role,
        value: valueOf(entry),
      });
    }
  }
  return out;
}

export function heightValues(session: PublicSession): NamedValue[] {
  return collectValues(session, session.heights, (entry) => entry.cm);
}

export function umfangValues(session: PublicSession): NamedValue[] {
  return collectValues(session, session.umfang, (entry) => entry.meters);
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function boxStats(values: number[]): BoxStats | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number) => {
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
  };
  return {
    values: sorted,
    min: sorted[0],
    q1: q(0.25),
    median: q(0.5),
    q3: q(0.75),
    max: sorted[sorted.length - 1],
  };
}

function rangeLabel(start: number, size: number, integerValues: boolean): string {
  const end = start + size;
  if (integerValues && Number.isInteger(size) && size >= 1) {
    return `${start}–${start + size - 1}`;
  }
  return `${start}–${end}`;
}

export function histogram(items: NamedValue[], binSize: number): HistogramBin[] {
  if (!items.length) return [];
  const integerValues = items.every((item) => Number.isInteger(item.value));
  const filled = new Map<number, HistogramBin>();
  for (const item of items) {
    const start = Math.floor(item.value / binSize) * binSize;
    const bin =
      filled.get(start) ?? {
        start,
        label: rangeLabel(start, binSize, integerValues),
        parent: 0,
        child: 0,
      };
    if (item.role === 'parent') bin.parent += 1;
    else bin.child += 1;
    filled.set(start, bin);
  }
  const minVal = Math.min(...filled.keys());
  const maxVal = Math.max(...filled.keys());
  const bins: HistogramBin[] = [];
  for (let start = minVal; start <= maxVal; start += binSize) {
    bins.push(
      filled.get(start) ?? {
        start,
        label: rangeLabel(start, binSize, integerValues),
        parent: 0,
        child: 0,
      },
    );
  }
  return bins;
}

export function closestUmfang(items: NamedValue[], truth: number, n = 3): NamedValue[] {
  return [...items]
    .sort((a, b) => Math.abs(a.value - truth) - Math.abs(b.value - truth))
    .slice(0, n);
}

export function memoryVotes(answers: MemoryAnswer[], round: number): Record<string, number> {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  for (const answer of answers.filter((item) => item.round === round)) {
    counts[answer.choice] += 1;
  }
  return counts;
}

export function memoryScores(session: PublicSession): { teamName: string; correct: number }[] {
  const rounds = session.memoryRounds;
  return session.teams
    .map((team) => {
      const answers = session.memory.filter((item) => item.teamId === team.id);
      const correct = answers.filter((answer) => {
        const round = rounds[answer.round];
        return round?.correctLabel && round.correctLabel === answer.choice;
      }).length;
      return { teamName: team.name, correct };
    })
    .sort((a, b) => b.correct - a.correct);
}

export interface TeamPair {
  teamName: string;
  parentName: string;
  childName: string;
  parentValue: number;
  childValue: number;
}

export function pairByTeam(items: NamedValue[]): TeamPair[] {
  const byTeam = new Map<string, { parent?: NamedValue; child?: NamedValue }>();
  for (const item of items) {
    const row = byTeam.get(item.teamName) ?? {};
    if (item.role === 'parent') row.parent = item;
    else row.child = item;
    byTeam.set(item.teamName, row);
  }
  const out: TeamPair[] = [];
  for (const [teamName, row] of byTeam) {
    if (!row.parent || !row.child) continue;
    out.push({
      teamName,
      parentName: row.parent.personName,
      childName: row.child.personName,
      parentValue: row.parent.value,
      childValue: row.child.value,
    });
  }
  return out;
}

export interface MemoryVoteBucket {
  label: 'A' | 'B' | 'C' | 'D';
  count: number;
  teams: string[];
  correct: boolean;
}

export function memoryVoteBuckets(
  session: PublicSession,
  round: number,
): MemoryVoteBucket[] {
  const labels = ['A', 'B', 'C', 'D'] as const;
  const correct = session.memoryRounds[round]?.correctLabel;
  return labels.map((label) => {
    const answers = session.memory.filter(
      (item) => item.round === round && item.choice === label,
    );
    const teams = answers.map(
      (item) => session.teams.find((team) => team.id === item.teamId)?.name ?? item.teamId,
    );
    return { label, count: answers.length, teams, correct: label === correct };
  });
}

export interface ScoreBucket {
  score: number;
  count: number;
  teams: string[];
}

export function memoryScoreBuckets(session: PublicSession): ScoreBucket[] {
  const scores = memoryScores(session);
  const max = session.memoryRounds.length;
  return Array.from({ length: max + 1 }, (_, score) => {
    const teams = scores.filter((item) => item.correct === score).map((item) => item.teamName);
    return { score, count: teams.length, teams };
  });
}

export interface StudyPersonRow {
  teamName: string;
  personName: string;
  personId: string;
  role: Person['role'];
  before: number;
  after: number;
  treatment: 'drug' | 'placebo';
}

export function studyPeople(session: PublicSession): StudyPersonRow[] {
  const people = personMap(session);
  const out: StudyPersonRow[] = [];
  for (const answer of session.study) {
    const team = session.teams.find((item) => item.id === answer.teamId);
    if (!team) continue;
    for (const entry of answer.entries) {
      const person = people.get(entry.personId);
      if (!person) continue;
      out.push({
        teamName: team.name,
        personName: person.name,
        personId: person.id,
        role: person.role,
        before: entry.before,
        after: entry.after,
        treatment: entry.color === session.studyDrugColor ? 'drug' : 'placebo',
      });
    }
  }
  return out;
}

export function studyDeltas(
  answers: StudyAnswer[],
  drugColor: ChocolateColor,
): { label: string; values: number[] }[] {
  const drug: number[] = [];
  const placebo: number[] = [];
  for (const answer of answers) {
    for (const entry of answer.entries) {
      const delta = entry.after - entry.before;
      if (entry.color === drugColor) drug.push(delta);
      else placebo.push(delta);
    }
  }
  return [
    { label: 'Medikament', values: drug },
    { label: 'Placebo', values: placebo },
  ];
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export interface RecapMemoryCell {
  choice: string;
  correct: string;
  ok: boolean | null;
}

export interface RecapMemoryRow {
  teamName: string;
  cells: RecapMemoryCell[];
  points: number;
}

export interface RecapMeasureRow {
  teamName: string;
  personName: string;
  role: string;
  heightCm: number | null;
  umfangM: number | null;
  umfangDelta: number | null;
}

export interface RecapStudyRow {
  teamName: string;
  personName: string;
  chocolate: string;
  before: number;
  after: number;
  delta: number;
  treatment: string;
}

export interface RecapFeedbackRow {
  teamName: string;
  rating: number;
  comment: string;
}

export interface Recap {
  code: string;
  teamCount: number;
  umfangTruth: number;
  studyDrug: string;
  measures: RecapMeasureRow[];
  memoryRounds: { index: number; name: string; correct: string }[];
  memory: RecapMemoryRow[];
  study: RecapStudyRow[];
  feedback: RecapFeedbackRow[];
}

function roleLabel(role: Person['role']): string {
  return role === 'parent' ? 'Eltern' : 'Kind';
}

function chocolateLabel(color: ChocolateColor): string {
  return color === 'red' ? 'Rot' : 'Schwarz';
}

export function buildRecap(session: PublicSession): Recap {
  const people = personMap(session);
  const measures: RecapMeasureRow[] = [];
  for (const team of session.teams) {
    const heights = session.heights.find((item) => item.teamId === team.id);
    const umfang = session.umfang.find((item) => item.teamId === team.id);
    for (const person of team.people) {
      const heightCm = heights?.entries.find((entry) => entry.personId === person.id)?.cm ?? null;
      const umfangM = umfang?.entries.find((entry) => entry.personId === person.id)?.meters ?? null;
      measures.push({
        teamName: team.name,
        personName: person.name,
        role: roleLabel(person.role),
        heightCm,
        umfangM,
        umfangDelta: umfangM == null ? null : round1(umfangM - session.umfangTruth),
      });
    }
  }

  const memoryRounds = session.memoryRounds.map((round) => ({
    index: round.index,
    name: round.name,
    correct: round.correctLabel ?? '–',
  }));
  const memory: RecapMemoryRow[] = session.teams.map((team) => {
    const cells = session.memoryRounds.map((round) => {
      const answer = session.memory.find(
        (item) => item.teamId === team.id && item.round === round.index,
      );
      const correct = round.correctLabel ?? '';
      const choice = answer?.choice ?? '';
      return {
        choice: choice || '–',
        correct: correct || '–',
        ok: answer && correct ? choice === correct : null,
      };
    });
    return {
      teamName: team.name,
      cells,
      points: cells.filter((cell) => cell.ok).length,
    };
  }).sort((a, b) => b.points - a.points || a.teamName.localeCompare(b.teamName));

  const study: RecapStudyRow[] = [];
  for (const answer of session.study) {
    const team = session.teams.find((item) => item.id === answer.teamId);
    if (!team) continue;
    for (const entry of answer.entries) {
      const person = people.get(entry.personId);
      if (!person) continue;
      study.push({
        teamName: team.name,
        personName: person.name,
        chocolate: chocolateLabel(entry.color),
        before: entry.before,
        after: entry.after,
        delta: round1(entry.after - entry.before),
        treatment: session.studyUnblinded
          ? entry.color === session.studyDrugColor
            ? 'Medikament'
            : 'Placebo'
          : '–',
      });
    }
  }

  const feedback: RecapFeedbackRow[] = session.teams.map((team) => {
    const item = session.feedback.find((entry) => entry.teamId === team.id);
    return {
      teamName: team.name,
      rating: item?.rating ?? 0,
      comment: item?.comment ?? '',
    };
  });

  return {
    code: session.code,
    teamCount: session.teams.length,
    umfangTruth: session.umfangTruth,
    studyDrug: session.studyUnblinded
      ? chocolateLabel(session.studyDrugColor ?? 'red')
      : 'noch geheim',
    measures,
    memoryRounds,
    memory,
    study,
    feedback,
  };
}

function csvCell(value: string | number | null | undefined): string {
  const text = value == null || value === '' ? '' : String(value);
  if (/[;"\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function recapCsv(session: PublicSession): string {
  const recap = buildRecap(session);
  const memoryHeaders = recap.memoryRounds.map(
    (round) => `Memory_${round.index + 1}_${round.name}`,
  );
  const header = [
    'PIN',
    'Team',
    'Person',
    'Rolle',
    'Groesse_cm',
    'Zimmerumfang_m',
    'Wahrheit_m',
    'Differenz_m',
    ...memoryHeaders,
    'Memory_Punkte',
    'Schokolade',
    'Schmerz_vorher',
    'Schmerz_nachher',
    'Schmerz_Delta',
    'Behandlung',
    'Feedback_Sterne',
    'Feedback_Kommentar',
  ];
  const lines = [header.map(csvCell).join(';')];
  for (const row of recap.measures) {
    const memory = recap.memory.find((item) => item.teamName === row.teamName);
    const study = recap.study.find(
      (item) => item.teamName === row.teamName && item.personName === row.personName,
    );
    const feedback = recap.feedback.find((item) => item.teamName === row.teamName);
    const memoryCells = recap.memoryRounds.map((_, index) => {
      const cell = memory?.cells[index];
      if (!cell || cell.ok == null) return '';
      return `${cell.choice} (${cell.ok ? 'richtig' : 'falsch'})`;
    });
    lines.push(
      [
        recap.code,
        row.teamName,
        row.personName,
        row.role,
        row.heightCm,
        row.umfangM,
        recap.umfangTruth,
        row.umfangDelta,
        ...memoryCells,
        memory?.points ?? '',
        study?.chocolate ?? '',
        study?.before ?? '',
        study?.after ?? '',
        study?.delta ?? '',
        study?.treatment ?? '',
        feedback?.rating || '',
        feedback?.comment ?? '',
      ]
        .map(csvCell)
        .join(';'),
    );
  }
  return `\uFEFF${lines.join('\n')}\n`;
}
