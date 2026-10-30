import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { PlotFigure } from '../../core/models/charts';

type PlotlyApi = typeof import('plotly.js-cartesian-dist-min').default;

@Component({
  selector: 'app-plotly',
  template: `<div class="plot" #plot></div>`,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 12em;
    }
    .plot {
      width: 100%;
      height: 100%;
      min-height: inherit;
    }
  `,
  host: { ngSkipHydration: 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotlyChart {
  readonly figure = input.required<PlotFigure>();
  private readonly plotEl = viewChild<ElementRef<HTMLDivElement>>('plot');
  private readonly destroyRef = inject(DestroyRef);
  private plotly: PlotlyApi | null = null;
  private observer: ResizeObserver | null = null;
  private lastKey = '';
  private drawn = false;

  constructor() {
    afterNextRender(() => {
      void this.boot();
    });

    effect(() => {
      const figure = this.figure();
      if (this.plotly) void this.draw(figure);
    });

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      const el = this.plotEl()?.nativeElement;
      if (el && this.plotly) this.plotly.purge(el);
    });
  }

  private async boot(): Promise<void> {
    if (typeof document === 'undefined') return;
    const mod = await import('plotly.js-cartesian-dist-min');
    this.plotly = mod.default;
    const el = this.plotEl()?.nativeElement;
    if (!el) return;
    this.observer = new ResizeObserver(() => {
      if (this.drawn) this.plotly?.Plots.resize(el);
    });
    this.observer.observe(el);
    await this.draw(this.figure());
  }

  private async draw(figure: PlotFigure): Promise<void> {
    const plotly = this.plotly;
    if (!plotly) return;
    const key = JSON.stringify(figure);
    if (key === this.lastKey) return;
    this.lastKey = key;
    const el = this.plotEl()?.nativeElement;
    if (!el) return;
    await plotly.react(el, figure.data, { autosize: true, ...figure.layout }, {
      responsive: true,
      displayModeBar: false,
      displaylogo: false,
    });
    this.drawn = true;
  }
}
