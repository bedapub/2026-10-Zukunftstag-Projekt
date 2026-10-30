import { HostSession, PublicSession } from './session';
import {
  NamedValue,
  TeamPair,
  heightValues,
  median,
  memoryScoreBuckets,
  memoryScores,
  memoryVoteBuckets,
  pairByTeam,
  round1,
  studyPeople,
  umfangValues,
} from './stats';

export interface PlotFigure {
  data: Record<string, unknown>[];
  layout: Record<string, unknown>;
}

export interface ChartSpec {
  id: string;
  label: string;
  group: string;
  figure: PlotFigure;
}

const CHILD_FILL = '#FFF8BC';
const PARENT_FILL = '#D95F0E';
const EDGE = '#004495';
const CHILD_POINT = 'orange';
const PARENT_POINT = 'darkblue';
const SCATTER_POINT = '#0b41cd';
const MEDIAN_COLOR = 'blueviolet';
const TRUTH_COLOR = '#cc0033';
const FIT_COLOR = '#ff1f26';
const PLACEBO_POINT = '#0b41cd';
const DRUG_POINT = '#007c6b';
const LINK = '#c2bab5';
const FONT = 'Source Sans 3, Arial, sans-serif';

const CHOICE_COLORS: Record<string, string> = {
  A: '#ff1f26',
  B: '#0b41cd',
  C: '#ff7d29',
  D: '#bc36f0',
};

function baseLayout(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    font: { family: FONT, size: 13, color: '#544f4f' },
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { t: 12, r: 16, b: 48, l: 52 },
    hovermode: 'closest',
    legend: { orientation: 'h', y: 1.08, x: 0.5, xanchor: 'center', font: { size: 11 } },
    title: { font: { size: 15, family: FONT, color: '#022366' }, x: 0.5, xanchor: 'center' },
    ...extra,
  };
}

function jitter(seed: string, center: number, spread = 0.12): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unit = ((hash >>> 0) % 10000) / 10000;
  return center + (unit - 0.5) * 2 * spread;
}

function sizeBins(values: number[], binSize: number): { start: number; end: number; size: number } {
  const minVal = Math.round(Math.min(...values));
  const maxVal = Math.round(Math.max(...values));
  const start = minVal - 1;
  const end = maxVal + binSize + 1;
  return { start, size: binSize, end };
}

function fitLine(xs: number[], ys: number[]): { x: number[]; y: number[] } | null {
  if (xs.length < 2) return null;
  const n = xs.length;
  const meanX = xs.reduce((sum, value) => sum + value, 0) / n;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (!den) return null;
  const slope = num / den;
  const intercept = meanY - slope * meanX;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return { x: [minX, maxX], y: [slope * minX + intercept, slope * maxX + intercept] };
}

function roleItems(items: NamedValue[], role: NamedValue['role']): NamedValue[] {
  return items.filter((item) => item.role === role);
}

function splitHistogram(
  child: NamedValue[],
  parent: NamedValue[],
  binSize: number,
  xTitleChild: string,
  xTitleParent: string,
  yTitle: string,
): PlotFigure | null {
  const childValues = child.map((item) => item.value);
  const parentValues = parent.map((item) => item.value);
  if (!childValues.length && !parentValues.length) return null;
  const childBins = childValues.length ? sizeBins(childValues, binSize) : sizeBins(parentValues, binSize);
  const parentBins = parentValues.length ? sizeBins(parentValues, binSize) : childBins;
  return {
    data: [
      {
        type: 'histogram',
        x: childValues,
        autobinx: false,
        xbins: childBins,
        marker: { color: CHILD_FILL, line: { color: EDGE, width: 3 } },
        hovertemplate: 'Frequenz: %{y}<extra></extra>',
        showlegend: false,
        xaxis: 'x',
        yaxis: 'y',
      },
      {
        type: 'scatter',
        x: childValues,
        y: childValues.map(() => 0),
        mode: 'markers',
        marker: { symbol: 'diamond', size: 11, color: CHILD_POINT },
        customdata: child.map((item) => [item.teamName, item.personName, item.value]),
        hovertemplate: '<b>%{customdata[0]}</b><br>%{customdata[1]}: %{customdata[2]}<extra></extra>',
        showlegend: false,
        xaxis: 'x',
        yaxis: 'y',
      },
      {
        type: 'histogram',
        x: parentValues,
        autobinx: false,
        xbins: parentBins,
        marker: { color: PARENT_FILL, line: { color: EDGE, width: 3 } },
        hovertemplate: 'Frequenz: %{y}<extra></extra>',
        showlegend: false,
        xaxis: 'x2',
        yaxis: 'y2',
      },
      {
        type: 'scatter',
        x: parentValues,
        y: parentValues.map(() => 0),
        mode: 'markers',
        marker: { symbol: 'diamond', size: 11, color: PARENT_POINT },
        customdata: parent.map((item) => [item.teamName, item.personName, item.value]),
        hovertemplate: '<b>%{customdata[0]}</b><br>%{customdata[1]}: %{customdata[2]}<extra></extra>',
        showlegend: false,
        xaxis: 'x2',
        yaxis: 'y2',
      },
    ],
    layout: baseLayout({
      grid: { rows: 1, columns: 2, pattern: 'independent' },
      yaxis: {
        title: yTitle,
        rangemode: 'tozero',
        dtick: 1,
        range: [0, Math.max(4, Math.ceil(Math.max(childValues.length, parentValues.length) * 0.5) + 1)],
      },
      yaxis2: { matches: 'y', rangemode: 'tozero', dtick: 1 },
      xaxis: { title: xTitleChild, tickangle: 0, automargin: true },
      xaxis2: { title: xTitleParent, tickangle: 0, automargin: true },
      showlegend: false,
      margin: { t: 8, r: 12, b: 48, l: 44 },
    }),
  };
}

function splitBox(
  child: NamedValue[],
  parent: NamedValue[],
  yTitle: string,
  unit: string,
  hlines: { value: number; color: string; dash: string; label: string }[] = [],
): PlotFigure | null {
  if (!child.length && !parent.length) return null;
  const traces: Record<string, unknown>[] = [];
  const addPanel = (
    items: NamedValue[],
    name: string,
    color: string,
    axis: { x: string; y: string },
  ) => {
    if (!items.length) return;
    const values = items.map((item) => item.value);
    const med = median(values);
    traces.push({
      type: 'box',
      y: values,
      x: values.map(() => 1),
      name,
      boxpoints: false,
      fillcolor: 'rgba(11, 65, 205, 0.08)',
      line: { color: EDGE, width: 1 },
      hoverinfo: 'skip',
      showlegend: false,
      xaxis: axis.x,
      yaxis: axis.y,
    });
    traces.push({
      type: 'scatter',
      x: items.map((item) => jitter(`${item.teamName}:${item.personName}`, 1)),
      y: values,
      mode: 'markers',
      marker: { size: 10, color },
      customdata: items.map((item) => [item.teamName, item.personName, item.value]),
      hovertemplate: `<b>%{customdata[0]}</b><br>%{customdata[1]}: %{customdata[2]} ${unit}<extra></extra>`,
      showlegend: false,
      xaxis: axis.x,
      yaxis: axis.y,
    });
    if (med != null) {
      traces.push({
        type: 'scatter',
        x: [0.7, 1.3],
        y: [med, med],
        mode: 'lines',
        line: { color: MEDIAN_COLOR, width: 6 },
        hoverinfo: 'skip',
        showlegend: false,
        xaxis: axis.x,
        yaxis: axis.y,
      });
    }
  };
  addPanel(child, 'Kind', CHILD_POINT, { x: 'x', y: 'y' });
  addPanel(parent, 'Eltern', PARENT_POINT, { x: 'x2', y: 'y2' });
  const shapes = hlines.flatMap((line) => [
    {
      type: 'line',
      xref: 'x',
      yref: 'y',
      x0: 0.45,
      x1: 1.55,
      y0: line.value,
      y1: line.value,
      line: { color: line.color, width: 3, dash: line.dash },
    },
    {
      type: 'line',
      xref: 'x2',
      yref: 'y2',
      x0: 0.45,
      x1: 1.55,
      y0: line.value,
      y1: line.value,
      line: { color: line.color, width: 3, dash: line.dash },
    },
  ]);
  const dummy = hlines.map((line) => ({
    type: 'scatter',
    x: [null],
    y: [null],
    mode: 'lines',
    name: line.label,
    line: { color: line.color, width: 3, dash: line.dash },
  }));
  return {
    data: [...traces, ...dummy],
    layout: baseLayout({
      grid: { rows: 1, columns: 2, pattern: 'independent' },
      yaxis: { title: yTitle, automargin: true },
      yaxis2: { matches: 'y' },
      xaxis: { title: '', tickvals: [1], ticktext: ['Kind'] },
      xaxis2: { title: '', tickvals: [1], ticktext: ['Eltern'] },
      margin: { t: 8, r: 8, b: 36, l: 48 },
      shapes,
      showlegend: dummy.length > 0,
    }),
  };
}

function scatterPairs(
  pairs: TeamPair[],
  xTitle: string,
  yTitle: string,
  unit: string,
  options: {
    title?: string;
    parentMedian?: number | null;
    childMedian?: number | null;
    regression?: boolean;
  } = {},
): PlotFigure | null {
  if (!pairs.length) return null;
  const xs = pairs.map((item) => item.parentValue);
  const ys = pairs.map((item) => item.childValue);
  const traces: Record<string, unknown>[] = [
    {
      type: 'scatter',
      x: xs,
      y: ys,
      mode: 'markers',
      name: 'Team',
      marker: { size: 12, color: SCATTER_POINT },
      customdata: pairs.map((item) => [
        item.teamName,
        item.parentName,
        item.parentValue,
        item.childName,
        item.childValue,
      ]),
      hovertemplate:
        `<b>%{customdata[0]}</b><br>%{customdata[1]}: %{customdata[2]} ${unit}` +
        `<br>%{customdata[3]}: %{customdata[4]} ${unit}<extra></extra>`,
    },
  ];
  const shapes: Record<string, unknown>[] = [];
  if (options.parentMedian != null) {
    shapes.push({
      type: 'line',
      x0: options.parentMedian,
      x1: options.parentMedian,
      y0: 0,
      y1: 1,
      yref: 'paper',
      line: { color: PARENT_FILL, width: 3, dash: 'dash' },
    });
    traces.push({
      type: 'scatter',
      x: [null],
      y: [null],
      mode: 'lines',
      name: `Median (Eltern): ${round1(options.parentMedian)} ${unit}`,
      line: { color: PARENT_FILL, width: 3, dash: 'dash' },
    });
  }
  if (options.childMedian != null) {
    shapes.push({
      type: 'line',
      y0: options.childMedian,
      y1: options.childMedian,
      x0: 0,
      x1: 1,
      xref: 'paper',
      line: { color: CHILD_POINT, width: 3, dash: 'dash' },
    });
    traces.push({
      type: 'scatter',
      x: [null],
      y: [null],
      mode: 'lines',
      name: `Median (Kind): ${round1(options.childMedian)} ${unit}`,
      line: { color: CHILD_POINT, width: 3, dash: 'dash' },
    });
  }
  if (options.regression) {
    const fit = fitLine(xs, ys);
    if (fit) {
      traces.push({
        type: 'scatter',
        x: fit.x,
        y: fit.y,
        mode: 'lines',
        name: 'Fit (Regression)',
        line: { color: FIT_COLOR, width: 3 },
      });
    }
  }
  return {
    data: traces,
    layout: baseLayout({
      title: options.title,
      xaxis: { title: xTitle, zeroline: false },
      yaxis: { title: yTitle, zeroline: false },
      shapes,
      showlegend: traces.length > 1,
    }),
  };
}

function stackedUmfang(items: NamedValue[], truth: number): PlotFigure | null {
  if (!items.length) return null;
  const child = roleItems(items, 'child');
  const parent = roleItems(items, 'parent');
  const values = items.map((item) => item.value);
  const min = Math.min(...values, truth);
  const max = Math.max(...values, truth);
  const size = (max - min) / 12 || 1;
  const med = median(values);
  const traces: Record<string, unknown>[] = [
    {
      type: 'histogram',
      x: child.map((item) => item.value),
      name: 'Kind',
      autobinx: false,
      marker: { color: CHILD_FILL, line: { color: '#363636', width: 1 } },
      xbins: { start: min, size, end: max + size / 100 },
      hovertemplate: 'Kind: %{y}<extra></extra>',
    },
    {
      type: 'histogram',
      x: parent.map((item) => item.value),
      name: 'Eltern',
      autobinx: false,
      marker: { color: PARENT_FILL, line: { color: '#363636', width: 1 } },
      xbins: { start: min, size, end: max + size / 100 },
      hovertemplate: 'Eltern: %{y}<extra></extra>',
    },
  ];
  const shapes: Record<string, unknown>[] = [
    {
      type: 'line',
      x0: truth,
      x1: truth,
      y0: 0,
      y1: 1,
      yref: 'paper',
      line: { color: TRUTH_COLOR, width: 4 },
    },
  ];
  traces.push({
    type: 'scatter',
    x: [null],
    y: [null],
    mode: 'lines',
    name: `Umfang (${truth} m)`,
    line: { color: TRUTH_COLOR, width: 4 },
  });
  if (med != null) {
    shapes.push({
      type: 'line',
      x0: med,
      x1: med,
      y0: 0,
      y1: 1,
      yref: 'paper',
      line: { color: MEDIAN_COLOR, width: 4, dash: 'dash' },
    });
    traces.push({
      type: 'scatter',
      x: [null],
      y: [null],
      mode: 'lines',
      name: `Median (${round1(med)} m)`,
      line: { color: MEDIAN_COLOR, width: 4, dash: 'dash' },
    });
  }
  return {
    data: traces,
    layout: baseLayout({
      barmode: 'stack',
      xaxis: { title: 'Umfang [meter]' },
      yaxis: { title: 'Frequenz', rangemode: 'tozero' },
      shapes,
    }),
  };
}

function deltaBars(
  pairs: TeamPair[],
  truth: number,
  role: 'parent' | 'child',
  axis: { x: string; y: string },
): Record<string, unknown>[] {
  const rows = pairs
    .map((pair) => ({
      teamName: role === 'parent' ? pair.teamName : pair.teamName,
      personName: role === 'parent' ? pair.parentName : pair.childName,
      delta: round1((role === 'parent' ? pair.parentValue : pair.childValue) - truth),
    }))
    .sort((a, b) => a.delta - b.delta);
  const winners = [...rows]
    .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    .slice(0, 3)
    .map((row) => row.teamName);
  const y = rows.map((row) => row.teamName);
  const x = rows.map((row) => row.delta);
  const winnerY = rows.filter((row) => winners.includes(row.teamName)).map((row) => row.teamName);
  const winnerX = winnerY.map(() => Math.max(...x, 0.1) * 0.08 || 0.2);
  return [
    {
      type: 'bar',
      orientation: 'h',
      x,
      y,
      name: role === 'parent' ? 'Eltern' : 'Kind',
      marker: { color: role === 'parent' ? PARENT_POINT : CHILD_POINT },
      customdata: rows.map((row) => [row.personName, row.delta]),
      hovertemplate: '<b>%{y}</b><br>%{customdata[0]}: %{customdata[1]} m<extra></extra>',
      showlegend: false,
      xaxis: axis.x,
      yaxis: axis.y,
    },
    {
      type: 'scatter',
      x: winnerX,
      y: winnerY,
      mode: 'markers',
      marker: { symbol: 'star', size: 16, color: TRUTH_COLOR },
      name: 'Top 3',
      hoverinfo: 'skip',
      showlegend: axis.x === 'x',
      xaxis: axis.x,
      yaxis: axis.y,
    },
  ];
}

function umfangDeltaFigure(pairs: TeamPair[], truth: number): PlotFigure | null {
  if (!pairs.length) return null;
  return {
    data: [
      ...deltaBars(pairs, truth, 'parent', { x: 'x', y: 'y' }),
      ...deltaBars(pairs, truth, 'child', { x: 'x2', y: 'y2' }),
    ],
    layout: baseLayout({
      grid: { rows: 1, columns: 2, pattern: 'independent' },
      xaxis: { title: 'Eltern · Differenz [meter]', zeroline: true, zerolinewidth: 2 },
      xaxis2: { title: 'Kind · Differenz [meter]', zeroline: true, zerolinewidth: 2 },
      yaxis: { automargin: true },
      yaxis2: { automargin: true },
      margin: { t: 8, r: 12, b: 44, l: 72 },
    }),
  };
}

function memoryVoteScatterFigure(session: PublicSession): PlotFigure | null {
  const round = session.memoryRound;
  const answers = session.memory.filter((item) => item.round === round);
  if (!answers.length) return null;
  const xPos: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
  const correct = session.memoryRounds[round]?.correctLabel;
  return {
    data: [
      {
        type: 'scatter',
        x: answers.map((item) => jitter(`${item.teamId}:${round}`, xPos[item.choice], 0.16)),
        y: answers.map((item) => jitter(`${item.teamId}:y:${round}`, 1, 0.28)),
        mode: 'markers',
        marker: {
          size: 14,
          color: answers.map((item) => CHOICE_COLORS[item.choice]),
          line: {
            color: answers.map((item) => (item.choice === correct ? '#022366' : 'rgba(0,0,0,0)')),
            width: answers.map((item) => (item.choice === correct ? 2 : 0)),
          },
        },
        customdata: answers.map((item) => {
          const team = session.teams.find((row) => row.id === item.teamId)?.name ?? item.teamId;
          return [team, item.choice, item.choice === correct ? 'richtig' : 'falsch'];
        }),
        hovertemplate: '<b>%{customdata[0]}</b><br>%{customdata[1]} · %{customdata[2]}<extra></extra>',
      },
    ],
    layout: baseLayout({
      xaxis: { title: 'Antwort', tickvals: [1, 2, 3, 4], ticktext: ['A', 'B', 'C', 'D'], range: [0.4, 4.6] },
      yaxis: { visible: false, range: [0.35, 1.65], fixedrange: true },
      showlegend: false,
      margin: { t: 8, r: 12, b: 40, l: 16 },
    }),
  };
}

function memoryScoreScatterFigure(session: PublicSession): PlotFigure | null {
  const scores = memoryScores(session);
  if (!scores.length) return null;
  const max = session.memoryRounds.length;
  return {
    data: [
      {
        type: 'scatter',
        x: scores.map((item) => jitter(item.teamName, item.correct, 0.16)),
        y: scores.map((item) => jitter(`${item.teamName}:y`, 1, 0.28)),
        mode: 'markers',
        marker: { size: 14, color: '#0b41cd' },
        customdata: scores.map((item) => [item.teamName, item.correct]),
        hovertemplate: '<b>%{customdata[0]}</b><br>%{customdata[1]} richtig<extra></extra>',
      },
    ],
    layout: baseLayout({
      xaxis: { title: 'Richtige Moleküle', dtick: 1, range: [-0.5, max + 0.5] },
      yaxis: { visible: false, range: [0.35, 1.65], fixedrange: true },
      showlegend: false,
      margin: { t: 8, r: 12, b: 40, l: 16 },
    }),
  };
}

function memoryVoteFigure(session: PublicSession): PlotFigure | null {
  const buckets = memoryVoteBuckets(session, session.memoryRound);
  if (!buckets.some((bucket) => bucket.count)) return null;
  return {
    data: [
      {
        type: 'bar',
        x: buckets.map((bucket) => bucket.label),
        y: buckets.map((bucket) => bucket.count),
        marker: {
          color: buckets.map((bucket) => CHOICE_COLORS[bucket.label]),
          line: {
            color: buckets.map((bucket) => (bucket.correct ? '#022366' : 'rgba(0,0,0,0)')),
            width: buckets.map((bucket) => (bucket.correct ? 4 : 0)),
          },
        },
        customdata: buckets.map((bucket) => [
          bucket.teams.join(', ') || 'keine Stimmen',
          bucket.correct ? 'richtig' : '',
        ]),
        hovertemplate: '<b>%{x}</b><br>%{y} Teams<br>%{customdata[0]}<extra></extra>',
        text: buckets.map((bucket) => String(bucket.count)),
        textposition: 'outside',
      },
    ],
    layout: baseLayout({
      yaxis: { title: 'Teams', rangemode: 'tozero', dtick: 1 },
      xaxis: { title: 'Antwort' },
      showlegend: false,
      margin: { t: 8, r: 12, b: 40, l: 44 },
    }),
  };
}

function memoryScoreFigure(session: PublicSession): PlotFigure | null {
  if (!session.memory.length) return null;
  const buckets = memoryScoreBuckets(session);
  return {
    data: [
      {
        type: 'bar',
        x: buckets.map((bucket) => String(bucket.score)),
        y: buckets.map((bucket) => bucket.count),
        marker: { color: '#ff7d29', line: { color: EDGE, width: 2 } },
        customdata: buckets.map((bucket) => [bucket.teams.join(', ') || '—']),
        hovertemplate: '%{y} Teams mit %{x} richtig<br>%{customdata[0]}<extra></extra>',
        text: buckets.map((bucket) => String(bucket.count)),
        textposition: 'outside',
      },
    ],
    layout: baseLayout({
      xaxis: { title: 'Richtige Moleküle', dtick: 1 },
      yaxis: { title: 'Anzahl Teams', rangemode: 'tozero', dtick: 1 },
      showlegend: false,
      margin: { t: 8, r: 12, b: 44, l: 44 },
    }),
  };
}

function studyPanel(
  rows: ReturnType<typeof studyPeople>,
  title: string,
  color: string,
  axis: { x: string; y: string },
): Record<string, unknown>[] {
  const before = rows.map((row) => row.before);
  const after = rows.map((row) => row.after);
  const beforeX = rows.map((row) => jitter(`${row.personId}-vor`, 1));
  const afterX = rows.map((row) => jitter(`${row.personId}-nach`, 2));
  const lineX: (number | null)[] = [];
  const lineY: (number | null)[] = [];
  beforeX.forEach((x, i) => {
    lineX.push(x, afterX[i], null);
    lineY.push(before[i], after[i], null);
  });
  const traces: Record<string, unknown>[] = [
    {
      type: 'scatter',
      x: lineX,
      y: lineY,
      mode: 'lines',
      line: { color: LINK, width: 1.6 },
      hoverinfo: 'skip',
      showlegend: false,
      xaxis: axis.x,
      yaxis: axis.y,
    },
    {
      type: 'scatter',
      x: [...beforeX, ...afterX],
      y: [...before, ...after],
      mode: 'markers',
      marker: { size: 10, color },
      customdata: [
        ...rows.map((row) => [row.teamName, row.personName, 'Vor', row.before]),
        ...rows.map((row) => [row.teamName, row.personName, 'Nach', row.after]),
      ],
      hovertemplate: '<b>%{customdata[0]}</b><br>%{customdata[1]} · %{customdata[2]}: %{customdata[3]}<extra></extra>',
      showlegend: false,
      xaxis: axis.x,
      yaxis: axis.y,
    },
  ];
  for (const group of [
    { values: before, pos: 1 },
    { values: after, pos: 2 },
  ]) {
    const med = median(group.values);
    if (med == null) continue;
    traces.push({
      type: 'scatter',
      x: [group.pos - 0.3, group.pos + 0.3],
      y: [med, med],
      mode: 'lines',
      line: { color: '#ff1f26', width: 5 },
      hoverinfo: 'skip',
      showlegend: false,
      xaxis: axis.x,
      yaxis: axis.y,
      name: title,
    });
  }
  return traces;
}

function studyFigure(session: PublicSession): PlotFigure | null {
  const rows = studyPeople(session);
  if (!rows.length) return null;
  const placebo = rows.filter((row) => row.treatment === 'placebo');
  const drug = rows.filter((row) => row.treatment === 'drug');
  return {
    data: [
      ...studyPanel(placebo, 'Placebo', PLACEBO_POINT, { x: 'x', y: 'y' }),
      ...studyPanel(drug, 'Medikament', DRUG_POINT, { x: 'x2', y: 'y2' }),
    ],
    layout: baseLayout({
      grid: { rows: 1, columns: 2, pattern: 'independent' },
      yaxis: { title: 'Schmerz', range: [-0.4, 10.4], dtick: 1 },
      yaxis2: { matches: 'y', range: [-0.4, 10.4], dtick: 1 },
      xaxis: { title: 'Placebo', tickvals: [1, 2], ticktext: ['Vor', 'Nach'] },
      xaxis2: { title: 'Medikament', tickvals: [1, 2], ticktext: ['Vor', 'Nach'] },
      showlegend: false,
    }),
  };
}

function studyDeltaFigure(session: PublicSession): PlotFigure | null {
  const rows = studyPeople(session);
  if (!rows.length) return null;
  const groups = [
    { key: 'placebo' as const, label: 'Placebo', color: PLACEBO_POINT, pos: 1 },
    { key: 'drug' as const, label: 'Medikament', color: DRUG_POINT, pos: 2 },
  ];
  const traces: Record<string, unknown>[] = [];
  for (const group of groups) {
    const items = rows.filter((row) => row.treatment === group.key);
    if (!items.length) continue;
    const deltas = items.map((item) => item.after - item.before);
    traces.push({
      type: 'box',
      y: deltas,
      x: deltas.map(() => group.pos),
      name: group.label,
      boxpoints: false,
      fillcolor: 'rgba(11, 65, 205, 0.08)',
      line: { color: EDGE, width: 1 },
      hoverinfo: 'skip',
      showlegend: false,
    });
    traces.push({
      type: 'scatter',
      x: items.map((item) => jitter(`${item.personId}-delta`, group.pos)),
      y: deltas,
      mode: 'markers',
      marker: { size: 11, color: group.color },
      customdata: items.map((item) => [item.teamName, item.personName, round1(item.after - item.before)]),
      hovertemplate: '<b>%{customdata[0]}</b><br>%{customdata[1]}: %{customdata[2]}<extra></extra>',
      showlegend: false,
    });
    const med = median(deltas);
    if (med != null) {
      traces.push({
        type: 'scatter',
        x: [group.pos - 0.3, group.pos + 0.3],
        y: [med, med],
        mode: 'lines',
        line: { color: MEDIAN_COLOR, width: 5 },
        hoverinfo: 'skip',
        showlegend: false,
      });
    }
  }
  return {
    data: traces,
    layout: baseLayout({
      yaxis: { title: 'Differenz (Nach − Vor)', zeroline: true, zerolinewidth: 2 },
      xaxis: { tickvals: [1, 2], ticktext: ['Placebo', 'Medikament'], range: [0.4, 2.6] },
      shapes: [
        {
          type: 'line',
          x0: 0,
          x1: 1,
          xref: 'paper',
          y0: 0,
          y1: 0,
          line: { color: '#544f4f', width: 1, dash: 'dot' },
        },
      ],
      showlegend: false,
    }),
  };
}

function feedbackFigure(session: PublicSession): PlotFigure | null {
  if (!session.feedback.length) return null;
  const counts = [1, 2, 3, 4, 5].map(
    (n) => session.feedback.filter((item) => item.rating === n).length,
  );
  return {
    data: [
      {
        type: 'bar',
        x: ['1 Stern', '2 Sterne', '3 Sterne', '4 Sterne', '5 Sterne'],
        y: counts,
        marker: { color: '#ff7d29', line: { color: EDGE, width: 2 } },
        text: counts.map(String),
        textposition: 'outside',
        hovertemplate: '%{x}: %{y} Teams<extra></extra>',
      },
    ],
    layout: baseLayout({
      yaxis: { title: 'Teams', rangemode: 'tozero', dtick: 1 },
      showlegend: false,
      margin: { t: 24, r: 16, b: 56, l: 56 },
    }),
  };
}

function push(charts: ChartSpec[], spec: Omit<ChartSpec, 'figure'> & { figure: PlotFigure | null }): void {
  if (!spec.figure) return;
  charts.push(spec as ChartSpec);
}

export function heightCharts(session: PublicSession): ChartSpec[] {
  const items = heightValues(session);
  const child = roleItems(items, 'child');
  const parent = roleItems(items, 'parent');
  const charts: ChartSpec[] = [];
  push(charts, {
    id: 'height-hist',
    label: 'Histogram',
    group: 'Körpergrösse',
    figure: splitHistogram(
      child,
      parent,
      2,
      'Kind [cm]',
      'Eltern [cm]',
      'Frequenz',
    ),
  });
  push(charts, {
    id: 'height-box',
    label: 'Boxplot',
    group: 'Körpergrösse',
    figure: splitBox(child, parent, 'Körpergrösse [cm]', 'cm'),
  });
  push(charts, {
    id: 'height-scatter',
    label: 'Scatterplot',
    group: 'Körpergrösse',
    figure: scatterPairs(pairByTeam(items), 'Eltern [cm]', 'Kind [cm]', 'cm'),
  });
  return charts;
}

export function umfangCharts(session: PublicSession): ChartSpec[] {
  const items = umfangValues(session);
  const charts: ChartSpec[] = [];
  push(charts, {
    id: 'umfang-hist',
    label: 'Histogram',
    group: 'Zimmerumfang',
    figure: splitHistogram(
      roleItems(items, 'child'),
      roleItems(items, 'parent'),
      3,
      'Kind [m]',
      'Eltern [m]',
      'Frequenz',
    ),
  });
  push(charts, {
    id: 'umfang-delta',
    label: 'Diverging Bar Chart',
    group: 'Zimmerumfang',
    figure: umfangDeltaFigure(pairByTeam(items), session.umfangTruth),
  });
  return charts;
}

export function memoryCharts(session: PublicSession): ChartSpec[] {
  const charts: ChartSpec[] = [];
  const recap = session.game === 'done';
  push(charts, {
    id: recap ? 'memory-score-scatter' : 'memory-vote-scatter',
    label: 'Scatterplot',
    group: 'Molekül Memory',
    figure: recap ? memoryScoreScatterFigure(session) : memoryVoteScatterFigure(session),
  });
  push(charts, {
    id: recap ? 'memory-scores' : 'memory-votes',
    label: 'Balkendiagramm',
    group: 'Molekül Memory',
    figure: recap ? memoryScoreFigure(session) : memoryVoteFigure(session),
  });
  return charts;
}

export function studyCharts(session: PublicSession): ChartSpec[] {
  const charts: ChartSpec[] = [];
  push(charts, {
    id: 'study-slope',
    label: 'Paired Slope Chart',
    group: 'Klinische Studie',
    figure: studyFigure(session),
  });
  push(charts, {
    id: 'study-delta',
    label: 'Differenzen-Plot',
    group: 'Klinische Studie',
    figure: studyDeltaFigure(session),
  });
  return charts;
}

export function feedbackCharts(session: PublicSession): ChartSpec[] {
  const charts: ChartSpec[] = [];
  push(charts, {
    id: 'feedback-stars',
    label: 'Sterne',
    group: 'Feedback',
    figure: feedbackFigure(session),
  });
  return charts;
}

export function chartsForGame(session: PublicSession | HostSession): ChartSpec[] {
  switch (session.game) {
    case 'heights':
      return heightCharts(session);
    case 'circumference':
      return umfangCharts(session);
    case 'memory':
      return memoryCharts(session);
    case 'study':
      return studyCharts(session);
    case 'feedback':
      return feedbackCharts(session);
    case 'done':
      return recapChartGroups(session).flatMap((group) => group.charts);
    default:
      return [];
  }
}

export function recapChartGroups(
  session: PublicSession,
): { title: string; charts: ChartSpec[] }[] {
  return [
    { title: 'Körpergrösse', charts: heightCharts(session) },
    { title: 'Zimmerumfang', charts: umfangCharts(session) },
    { title: 'Molekül Memory', charts: memoryCharts(session) },
    { title: 'Klinische Studie', charts: studyCharts(session) },
    { title: 'Feedback', charts: feedbackCharts(session) },
  ].filter((group) => group.charts.length);
}

