import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ApiService,
  Cart,
  CartItem,
  errorMessage,
  formatPrice,
  PaymentMethod,
  Product,
} from '../../core/api';
import { AuthService } from '../../core/auth';
import { Alert } from '../../shared/alert';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'MERCADO_PAGO', label: 'Mercado Pago' },
  { value: 'NARANJA_X', label: 'Naranja X' },
  { value: 'TARJETA', label: 'Tarjeta de crédito o débito' },
];

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, Alert],
  templateUrl: './cart.html',
})
export class CartPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly userId = inject(AuthService).session()!.id;

  protected readonly formatPrice = formatPrice;
  protected readonly paymentOptions = PAYMENT_OPTIONS;

  protected readonly cart = signal<Cart | null>(null);
  protected readonly products = signal<Product[]>([]);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly loading = signal(true);
  protected readonly buying = signal(false);
  protected readonly paymentMethod = signal<PaymentMethod | null>(null);

  private pending: Promise<void> = Promise.resolve();

  protected readonly productsById = computed(() => new Map(this.products().map((p) => [p.id, p])));
  protected readonly items = computed(() => this.cart()?.items ?? []);
  protected readonly units = computed(() => this.items().reduce((n, item) => n + item.quantity, 0));
  protected readonly total = computed(() =>
    this.items().reduce(
      (sum, item) => sum + (this.productsById().get(item.productId)?.price ?? 0) * item.quantity,
      0,
    ),
  );

  async ngOnInit() {
    try {
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

  protected shortage(item: CartItem): number | null {
    const p = this.productsById().get(item.productId);
    return p && item.quantity > p.stock ? p.stock : null;
  }

  protected paymentLabel(method: PaymentMethod): string {
    return PAYMENT_OPTIONS.find((o) => o.value === method)?.label ?? method;
  }

  protected step(item: CartItem, delta: number) {
    const q = item.quantity + delta;
    if (q >= 1) this.run(() => this.api.updateCartItem(this.userId, item.productId, q));
  }

  protected updateQuantity(item: CartItem, input: HTMLInputElement) {
    const q = Number(input.value);
    if (!Number.isInteger(q) || q < 1) {
      input.value = String(item.quantity);
      return;
    }
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

  protected hideImage(e: Event) {
    (e.target as HTMLElement).style.display = 'none';
  }

  protected async checkout() {
    const method = this.paymentMethod();
    if (!method) return;

    this.buying.set(true);
    try {
      await this.pending;
      if (this.items().length === 0) return;
      if (
        !confirm(
          `¿Confirmar la compra por ${formatPrice(this.total())} con ${this.paymentLabel(method)}?`,
        )
      ) {
        return;
      }

      this.error.set('');
      this.notice.set('');
      const order = await this.api.checkout(method);
      this.cart.set({ userId: this.userId, items: [] });
      this.paymentMethod.set(null);
      this.notice.set(
        `Compra confirmada. Orden #${order.id} por ${formatPrice(order.totalAmount)}, ` +
          `pagada con ${this.paymentLabel(order.paymentMethod)}.`,
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.buying.set(false);
    }
  }
}