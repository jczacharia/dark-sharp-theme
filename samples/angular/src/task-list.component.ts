import { Component, computed, input, output, signal } from '@angular/core';
import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { InlineBadgeComponent } from './inline-badge.component';

export type TaskStatus = 'all' | 'open' | 'done';

export interface TaskItem {
  id: number;
  title: string;
  done: boolean;
  priority: 'low' | 'high';
  dueDate?: string;
}

@Component({
  selector: 'app-task-list',
  imports: [DatePipe, TitleCasePipe, UpperCasePipe, InlineBadgeComponent],
  templateUrl: './task-list.component.html',
})
export class TaskListComponent {
  tasks = input.required<TaskItem[]>();
  heading = input('Task Board');
  compact = input(false);
  loading = input(false);
  toggled = output<TaskItem>();

  query = signal('');
  filter = signal<TaskStatus>('open');
  showBadges = signal(false);
  today = signal(new Date().toISOString());
  statuses: readonly TaskStatus[] = ['all', 'open', 'done'];

  isOverdue = (task: TaskItem): boolean =>
    !task.done && task.dueDate != null && task.dueDate < this.today();

  visible = computed(() => {
    const query = this.query().toLowerCase();
    return this.tasks()
      .filter((task) => this.filter() === 'all' || task.done === (this.filter() === 'done'))
      .filter((task) => task.title.toLowerCase().includes(query));
  });
}
