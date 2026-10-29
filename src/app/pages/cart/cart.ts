import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Cart, CartItem, errorMessage, formatPrice, Product } from '../../core/api';
import { AuthService } from '../../core/auth';
import { Alert } from '../../shared/alert';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, Alert],
  templateUrl: './cart.html',
})
export class CartPage implements OnInit {
  private readonly api = inject(ApiService);
  // authGuard garantiza que hay sesión
  private readonly userId = inject(AuthService).session()!.id;

  protected readonly formatPrice = formatPrice;
  protected readonly cart = signal<Cart | null>(null);
  protected readonly products = signal<Product[]>([]);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly loading = signal(true);
  protected readonly buying = signal(false);

  private pending: Promise<void> = Promise.resolve();

  protected readonly productsById = computed(() => new Map(this.products().map((p) => [p.id, p])));
  protected readonly items = computed(() => this.cart()?.items ?? []);
  protected readonly total = computed(() =>
    this.items().reduce(
      (sum, item) => sum + (this.productsById().get(item.productId)?.price ?? 0) * item.quantity,
      0,
    ),
  );

  async ngOnInit() {
    try {
      // El carrito solo trae productId, así que cruzamos con el catálogo
      const [cart, products] = await Promise.all([
        this.api.getCart(this.userId),
        this.api.getProducts(),
      ]);
      this.cart.set(cart);
      this.products.set(products);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  private run(action: () => Promise<Cart>): Promise<void> {
    this.error.set('');
    this.notice.set('');
    this.pending = this.pending.then(async () => {
      try {
        this.cart.set(await action());
      } catch (e) {
        this.error.set(errorMessage(e));
      }
    });
    return this.pending;
  }

  protected updateQuantity(item: CartItem, value: string) {
    const q = Number(value);
    if (q !== item.quantity) {
      this.run(() => this.api.updateCartItem(this.userId, item.productId, q));
    }
  }

  protected remove(item: CartItem) {
    this.run(() => this.api.removeCartItem(this.userId, item.productId));
  }

  protected clear() {
    if (confirm('¿Vaciar el carrito?')) this.run(() => this.api.clearCart(this.userId));
  }

  protected async checkout() {
    this.buying.set(true);
    try {
      await this.pending;
      if (this.items().length === 0) return;
      if (!confirm(`¿Confirmar la compra por ${formatPrice(this.total())}?`)) return;

      this.error.set('');
      this.notice.set('');
      const order = await this.api.checkout();
      this.cart.set({ userId: this.userId, items: [] });
      this.notice.set(
        `¡Compra confirmada! Orden #${order.id} por ${formatPrice(order.totalAmount)}`,
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.buying.set(false);
    }
  }
}