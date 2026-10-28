import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-roche-header',
  template: `
    <header class="roche-header">
      <div class="brand">
        <div>
          <strong>WissensZukunft</strong>
          <span>{{ subtitle() }}</span>
        </div>
      </div>
      <div>
        <ng-content />
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RocheHeader {
  readonly subtitle = input('Mathe Macht Medikamente');
}
