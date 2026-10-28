import { Component, input } from '@angular/core';

@Component({
  selector: 'app-alert',
  template: `
    @if (message()) {
      <div class="alert alert-{{ kind() }}">{{ message() }}</div>
    }
  `,
})
export class Alert {
  readonly kind = input.required<'error' | 'success'>();
  readonly message = input<string>('');
}
