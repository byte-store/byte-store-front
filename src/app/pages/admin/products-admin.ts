import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, errorMessage, formatPrice, Product } from '../../core/api';
import { Alert } from '../../shared/alert';

@Component({
  selector: 'app-products-admin',
  imports: [FormsModule, Alert],
  templateUrl: './products-admin.html',
})
export class ProductsAdmin implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly formatPrice = formatPrice;
  protected readonly products = signal<Product[]>([]);
  protected readonly error = signal('');
  protected readonly notice = signal('');

  protected readonly editingId = signal<number | null>(null);

  // Campos del formulario de alta. Los numéricos quedan en null cuando están vacíos.
  protected readonly brand = signal('');
  protected readonly model = signal('');
  protected readonly description = signal('');
  protected readonly price = signal<number | null>(null);
  protected readonly stock = signal<number | null>(null);
  protected readonly imageUrl = signal('');
  protected readonly categoryId = signal<number | null>(null);

  async ngOnInit() {
    try {
      this.products.set(await this.api.getProducts());
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }

  protected resetForm() {
    this.editingId.set(null);
    this.brand.set('');
    this.model.set('');
    this.description.set('');
    this.price.set(null);
    this.stock.set(null);
    this.imageUrl.set('');
    this.categoryId.set(null);
  }

  protected onEdit(p: Product) {
    this.error.set('');
    this.notice.set('');
    this.editingId.set(p.id);
    this.brand.set(p.brand);
    this.model.set(p.model);
    this.description.set(p.description ?? '');
    this.price.set(p.price);
    this.stock.set(p.stock);
    this.imageUrl.set(p.imageUrl ?? '');
    this.categoryId.set(p.categoryId);
    window.scrollTo({ top: 0 });
  }

  protected async onSubmit() {
    this.error.set('');
    this.notice.set('');
    const data = {
      brand: this.brand().trim(),
      model: this.model().trim(),
      description: this.description().trim() || null,
      price: Number(this.price()),
      stock: Number(this.stock()),
      imageUrl: this.imageUrl().trim() || null,
      categoryId: this.categoryId() ?? null,
    };
    const id = this.editingId();
    try {
      if (id === null) {
        const product = await this.api.createProduct(data);
        this.products.update((list) => [product, ...list]);
        this.notice.set(`Producto "${product.brand} ${product.model}" creado`);
      } else {
        const product = await this.api.updateProduct(id, data);
        this.products.update((list) => list.map((x) => (x.id === id ? product : x)));
        this.notice.set(`Producto "${product.brand} ${product.model}" actualizado`);
      }
      this.resetForm();
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }

  protected async onDelete(p: Product) {
    if (!confirm(`¿Eliminar ${p.brand} ${p.model}?`)) return;
    this.error.set('');
    this.notice.set('');
    try {
      await this.api.deleteProduct(p.id);
      this.products.update((list) => list.filter((x) => x.id !== p.id));
      if (this.editingId() === p.id) this.resetForm();
      this.notice.set('Producto eliminado');
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
}
