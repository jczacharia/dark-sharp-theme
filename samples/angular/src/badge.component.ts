import {TitleCasePipe} from '@angular/common';
import {Component, ElementRef, computed, input, model, output, viewChild} from '@angular/core';

export type BadgeTone = 'info' | 'success' | 'warning';

@Component({
  selector: 'app-badge',
  imports: [TitleCasePipe],
  host: {
    '[class.expanded]': 'expanded()',
  },
  template: `
    <section class="badges" [attr.aria-label]="label()">
      <header>
        <h2>{{ label() }}</h2>
        <button type="button" [attr.aria-expanded]="expanded()" (click)="expanded.set(!expanded())">
          {{ expanded() ? 'Collapse' : 'Expand' }}
        </button>
        <button type="button" (click)="dismissed.emit()">Dismiss</button>
      </header>
      @if (expanded()) {
        <ul #list [class.compact]="count() > 5.0">
          @for (tone of tones(); track tone) {
            <li [attr.data-tone]="tone" [title]="tone">
              <strong>{{ tone | titlecase }}</strong>
              <output>{{ count() }} active</output>
            </li>
          }
        </ul>
      } @else {
        <p>{{ count() }} hidden badges.</p>
      }
    </section>
  `,
})
export class BadgeComponent {
  readonly label = input.required<string>();
  readonly count = input(0);
  readonly expanded = model(false);
  readonly dismissed = output<void>();
  readonly list = viewChild<ElementRef<HTMLUListElement>>('list');
  readonly tones = computed<BadgeTone[]>(() => (this.count() > 3 ? ['warning', 'info'] : ['success']));
}
