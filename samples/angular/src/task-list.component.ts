import {DatePipe, UpperCasePipe} from '@angular/common';
import {Component, computed, input, signal} from '@angular/core';
import {BadgeComponent} from './badge.component';

export type TaskStatus = 'all' | 'open' | 'done';

export interface TaskItem {
  id: number;
  title: string;
  done: boolean;
  priority: 'low' | 'high';
  dueDate?: string;
}

@Component({
  selector: '[appTaskList]',
  imports: [DatePipe, UpperCasePipe, BadgeComponent],
  host: {
    role: 'article',
    '[aria-busy]': 'loading()',
    '[attr.data-filter]': 'filter()',
  },
  template: `
    @let overdue = tasks().filter((task) => !task.done && task.dueDate != null && task.dueDate < today);
    <header>
      <h1>{{ heading() | uppercase }}</h1>
      <time [attr.datetime]="today" [style.opacity]="loading() ? 0.5 : 1">{{ today | date: 'EEEE, MMM d' }}</time>
      <input
        #search
        type="search"
        placeholder="Filter tasks…"
        [value]="query()"
        (input)="query.set(search.value)"
        (keydown.escape)="search.blur()"
      />
    </header>
    <main>
      @defer (on viewport; prefetch on idle; when !loading()) {
        <app-badge
          label="Overdue"
          suffix="item(s)"
          [count]="overdue.length"
          [(expanded)]="showBadges"
          (dismissed)="filter.set('open')"
        />
      } @placeholder {
        <p>{{ overdue.length }} overdue — scroll for details.</p>
      }
    </main>
  `,
})
export class TaskListComponent {
  readonly compact = input(false);
  readonly filter = signal<TaskStatus>('open');
  readonly heading = input('Task Board');
  readonly loading = input(false);
  readonly query = signal('');
  readonly showBadges = signal(false);
  readonly statuses: readonly TaskStatus[] = ['all', 'open', 'done'];
  readonly tasks = input.required<TaskItem[]>();
  readonly today = new Date().toISOString();
  readonly visible = computed(() =>
    this.tasks().filter((task) => task.title.trim().toLowerCase().includes(this.query().trim().toLowerCase())),
  );
}
