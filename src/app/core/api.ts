// Cliente para la API de ByteStore. Los tipos replican las entidades del back.
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type Role = 'user' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Product {
  id: number;
  categoryId: number | null;
  brand: string;
  model: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  categoryId: number | null;
  brand: string;
  model: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  createdAt: string;
}

export interface Cart {
  userId: number;
  items: CartItem[];
}

export type PaymentMethod = 'MERCADO_PAGO' | 'NARANJA_X' | 'TARJETA';
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: 'COMPLETED' | 'CANCELLED';
  paymentMethod: PaymentMethod;
  createdAt: string;
  items: OrderItem[];
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function toApiError(e: unknown): ApiError {
  if (!(e instanceof HttpErrorResponse)) return new ApiError(0, 'Ocurrió un error inesperado');
  if (e.status === 0) return new ApiError(0, 'No se pudo conectar con el servidor');
  // Si el body no era JSON (por ejemplo, el proxy sin back), HttpClient lo deja como string
  const data = e.error && typeof e.error === 'object' ? (e.error as { message?: string }) : null;
  if (e.status >= 500 && !data) {
    return new ApiError(e.status, 'No se pudo conectar con el back (¿está levantado?)');
  }
  return new ApiError(e.status, data?.message ?? `Error ${e.status}`);
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // El token y el manejo de 401 los agrega authInterceptor
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.http.request<T>(method, `/api${path}`, { body }));
    } catch (e) {
      throw toApiError(e);
    }
  }

  login(email: string, password: string) {
    return this.request<{ token: string }>('POST', '/auth/login', { email, password });
  }

  // Usuarios
  register(name: string, email: string, password: string) {
    return this.request<User>('POST', '/users', { name, email, password });
  }
  createAdmin(name: string, email: string, password: string, secretKey: string) {
    return this.request<User>('POST', '/users/admin', { name, email, password, secretKey });
  }
  getUsers() {
    return this.request<User[]>('GET', '/users');
  }
  getUser(id: number) {
    return this.request<User>('GET', `/users/${id}`);
  }
  updateUser(
    id: number,
    data: Partial<{ name: string; email: string; password: string; role: Role }>,
  ) {
    return this.request<User>('PUT', `/users/${id}`, data);
  }
  deleteUser(id: number) {
    return this.request<{ message: string }>('DELETE', `/users/${id}`);
  }

  // Productos
  getProducts() {
    return this.request<Product[]>('GET', '/products');
  }
  createProduct(data: CreateProductDto) {
    return this.request<Product>('POST', '/products', data);
  }
  updateProduct(id: number, data: Partial<CreateProductDto>) {
    return this.request<Product>('PUT', `/products/${id}`, data);
  }
  deleteProduct(id: number) {
    return this.request<{ message: string; product: Product }>('DELETE', `/products/${id}`);
  }

  // Carrito
  getCart(userId: number) {
    return this.request<Cart>('GET', `/carts/${userId}`);
  }
  addToCart(userId: number, productId: number, quantity: number) {
    return this.request<Cart>('POST', `/carts/${userId}/items`, { productId, quantity });
  }
  updateCartItem(userId: number, productId: number, quantity: number) {
    return this.request<Cart>('PATCH', `/carts/${userId}/items/${productId}`, { quantity });
  }
  removeCartItem(userId: number, productId: number) {
    return this.request<Cart>('DELETE', `/carts/${userId}/items/${productId}`);
  }
  clearCart(userId: number) {
    return this.request<Cart>('DELETE', `/carts/${userId}/items`);
  }
  
  // Órdenes
  checkout(paymentMethod: PaymentMethod) {
    return this.request<Order>('POST', '/orders', { paymentMethod });
  }
} 

export function formatPrice(n: number): string {
  return n.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  });
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Ocurrió un error inesperado';
}
