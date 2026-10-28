import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { boxStats, HistogramBin } from '../../core/models/stats';

@Component({
  selector: 'app-histogram',
  template: `
    <div class="hist">
      @for (bin of bins(); track bin.start) {
        <div class="col">
          <div class="stack">
            <div class="bar child" [style.height.%]="pct(bin.child)"></div>
            <div class="bar parent" [style.height.%]="pct(bin.parent)"></div>
          </div>
          <small>{{ bin.label }}</small>
        </div>
      }
    </div>
    <div class="legend">
      <span class="dot parent"></span> Eltern
      <span class="dot child"></span> Kinder
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .hist {
      display: flex;
      align-items: flex-end;
      gap: 0.35em;
      width: 100%;
      padding: 0.3em 0 0;
    }
    .col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35em;
      min-width: 0;
    }
    .stack {
      width: 72%;
      height: 10em;
      display: flex;
      flex-direction: column-reverse;
      justify-content: flex-start;
    }
    .bar {
      width: 100%;
      min-height: 0;
    }
    .parent {
      background: #022366;
    }
    .child {
      background: #ff7d29;
    }
    small {
      font-size: 0.72em;
      color: #706b69;
      white-space: nowrap;
    }
    .legend {
      display: flex;
      gap: 0.8em;
      align-items: center;
      justify-content: center;
      margin-top: 0.4em;
      color: #706b69;
      font-size: 1em;
    }
    .dot {
      width: 0.7em;
      height: 0.7em;
      display: inline-block;
      margin-right: 0.3em;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistogramChart {
  readonly bins = input.required<HistogramBin[]>();

  protected pct(count: number): number {
    const max = Math.max(1, ...this.bins().map((bin) => bin.parent + bin.child));
    return (count / max) * 100;
  }
}

@Component({
  selector: 'app-bars',
  template: `
    <div class="bars">
      @for (row of rows(); track row.label) {
        <div class="row">
          <div class="label">{{ row.label }}</div>
          <div class="track">
            <div class="fill" [style.width.%]="pct(row.value)" [class]="row.tone"></div>
          </div>
          <b>{{ row.value }}</b>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .row {
      display: grid;
      grid-template-columns: minmax(6em, 1.4fr) 3fr auto;
      gap: 0.5em;
      align-items: center;
      margin-bottom: 0.45em;
      font-size: 1.1em;
    }
    .track {
      background: #f5f5f2;
      overflow: hidden;
      height: 0.85em;
    }
    .fill {
      height: 100%;
      background: #0b41cd;
    }
    .fill.gold {
      background: #ff7d29;
    }
    .label {
      font-weight: 700;
      color: #022366;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarList {
  readonly rows = input.required<{ label: string; value: number; tone?: string }[]>();

  protected pct(value: number): number {
    const max = Math.max(1, ...this.rows().map((row) => row.value));
    return (value / max) * 100;
  }
}

@Component({
  selector: 'app-boxplot',
  template: `
    <svg viewBox="0 0 420 220" class="plot">
      @for (box of boxes(); track box.label; let i = $index) {
        @if (stats()[i]; as s) {
          <g [attr.transform]="'translate(' + (70 + i * 160) + ' 20)'">
            <text x="50" y="190" text-anchor="middle" fill="#022366">{{ box.label }}</text>
            <line [attr.x1]="50" [attr.x2]="50" [attr.y1]="y(s.max)" [attr.y2]="y(s.min)" stroke="#022366" />
            <rect
              x="20"
              [attr.y]="y(s.q3)"
              width="60"
              [attr.height]="Math.max(2, y(s.q1) - y(s.q3))"
              fill="#bde3ff"
              stroke="#0b41cd"
            />
            <line [attr.x1]="20" [attr.x2]="80" [attr.y1]="y(s.median)" [attr.y2]="y(s.median)" stroke="#ff1f26" stroke-width="3" />
            @for (value of s.values; track $index) {
              <circle [attr.cx]="50 + jitter($index)" [attr.cy]="y(value)" r="3.5" fill="#ff7d29" opacity="0.85" />
            }
          </g>
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .plot {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 420 / 220;
    }
    .plot text {
      font-size: 14px;
      font-family: inherit;
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxPlot {
  readonly boxes = input.required<{ label: string; values: number[] }[]>();
  protected readonly Math = Math;
  protected readonly stats = computed(() => this.boxes().map((box) => boxStats(box.values)));

  protected y(value: number): number {
    const all = this.boxes().flatMap((box) => box.values);
    const min = Math.min(...all, 0);
    const max = Math.max(...all, 1);
    const pad = (max - min) * 0.1 || 1;
    const top = min - pad;
    const bottom = max + pad;
    return 170 - ((value - top) / (bottom - top)) * 170;
  }

  protected jitter(index: number): number {
    return ((index * 17) % 21) - 10;
  }
}

@Component({
  selector: 'app-strip',
  template: `
    <svg viewBox="0 0 420 170" class="plot">
      <line x1="28" y1="110" x2="400" y2="110" stroke="#022366" />
      @for (tick of ticks(); track tick) {
        <line [attr.x1]="x(tick)" [attr.x2]="x(tick)" y1="104" y2="116" stroke="#022366" />
        <text [attr.x]="x(tick)" y="138" text-anchor="middle" fill="#706b69">{{ tick }}</text>
      }
      @if (mark() != null) {
        <line
          [attr.x1]="x(mark()!)"
          [attr.x2]="x(mark()!)"
          y1="24"
          y2="110"
          stroke="#ff1f26"
          stroke-width="3"
        />
        <text [attr.x]="x(mark()!)" y="18" text-anchor="middle" fill="#ff1f26">
          {{ markLabel() }} {{ mark() }}
        </text>
      }
      @for (point of points(); track $index) {
        <circle
          [attr.cx]="x(point.value)"
          [attr.cy]="dotY($index)"
          r="8"
          [attr.fill]="point.role === 'parent' ? '#022366' : '#ff7d29'"
        />
      }
    </svg>
    <div class="legend">
      <span class="dot parent"></span> Eltern
      <span class="dot child"></span> Kinder
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .plot {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 420 / 170;
    }
    .plot text {
      font-size: 14px;
      font-family: inherit;
      font-weight: 700;
    }
    .legend {
      display: flex;
      gap: 0.8em;
      align-items: center;
      justify-content: center;
      margin-top: 0.2em;
      color: #706b69;
      font-size: 1em;
    }
    .dot {
      width: 0.7em;
      height: 0.7em;
      display: inline-block;
      margin-right: 0.3em;
    }
    .dot.parent {
      background: #022366;
    }
    .dot.child {
      background: #ff7d29;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StripPlot {
  readonly points = input.required<{ value: number; role: string }[]>();
  readonly mark = input<number | null>(null);
  readonly markLabel = input('Wahrheit');

  private domain(): [number, number] {
    const values = this.points().map((point) => point.value);
    const mark = this.mark();
    if (mark != null) values.push(mark);
    if (!values.length) return [0, 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) return [min - 1, max + 1];
    const pad = (max - min) * 0.12 || 1;
    return [min - pad, max + pad];
  }

  protected readonly ticks = computed(() => {
    const [min, max] = this.domain();
    const span = max - min || 1;
    const rough = span / 4;
    const mag = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 5, 10].map((n) => n * mag).find((n) => n >= rough) ?? mag * 10;
    const start = Math.floor(min / step) * step;
    const end = Math.ceil(max / step) * step;
    const out: number[] = [];
    for (let value = start; value <= end + step / 2; value += step) {
      out.push(Math.round(value * 10) / 10);
    }
    return out;
  });

  protected x(value: number): number {
    const [min, max] = this.domain();
    return 28 + ((value - min) / (max - min)) * 372;
  }

  protected dotY(index: number): number {
    return 98 - (index % 6) * 12;
  }
}

