import { Component, signal } from '@angular/core';
import { ProductsAdmin } from './products-admin';
import { UsersAdmin } from './users-admin';

@Component({
  selector: 'app-admin-page',
  imports: [ProductsAdmin, UsersAdmin],
  template: `
    <section>
      <h1>Panel de administración</h1>
      <div class="tabs">
        <button [class.active]="tab() === 'products'" (click)="tab.set('products')">
          Productos
        </button>
        <button [class.active]="tab() === 'users'" (click)="tab.set('users')">Usuarios</button>
      </div>
      @if (tab() === 'products') {
        <app-products-admin />
      } @else {
        <app-users-admin />
      }
    </section>
  `,
})
export class AdminPage {
  protected readonly tab = signal<'products' | 'users'>('products');
}
