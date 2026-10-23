import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, errorMessage, formatPrice, Product } from '../../core/api';
import { AuthService } from '../../core/auth';
import { Alert } from '../../shared/alert';

@Component({
  selector: 'app-catalog-page',
  imports: [Alert],
  templateUrl: './catalog.html',
})
export class CatalogPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly formatPrice = formatPrice;
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly search = signal('');
  protected readonly quantities = signal<Record<number, number>>({});

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.products();
    return this.products().filter((p) =>
      `${p.brand} ${p.model} ${p.description ?? ''}`.toLowerCase().includes(q),
    );
  });

  async ngOnInit() {
    try {
      this.products.set(await this.api.getProducts());
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected quantity(p: Product): number {
    return this.quantities()[p.id] ?? 1;
  }

  protected setQuantity(p: Product, value: string) {
    const qty = Math.max(1, Math.floor(Number(value)) || 1);
    this.quantities.update((q) => ({ ...q, [p.id]: qty }));
  }

  protected hideImage(e: Event) {
    (e.target as HTMLElement).style.display = 'none';
  }

  protected async addToCart(p: Product) {
    const session = this.auth.session();
    if (!session) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.error.set('');
    this.notice.set('');
    try {
      const qty = this.quantity(p);
      await this.api.addToCart(session.id, p.id, qty);
      this.notice.set(`Agregaste ${qty} × ${p.brand} ${p.model} al carrito`);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
}
