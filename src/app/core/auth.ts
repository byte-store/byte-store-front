import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, Role } from './api';

// Payload que firma el back en auth.service.ts
export interface Session {
  id: number;
  email: string;
  role: Role;
  exp: number;
}

const TOKEN_KEY = 'bytestore_token';

function decodeToken(token: string | null): Session | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const session = JSON.parse(atob(payload)) as Session;
    if (session.exp * 1000 <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(null);
  readonly session = computed(() => decodeToken(this.token()));

  constructor() {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (decodeToken(stored)) this.token.set(stored);
    else localStorage.removeItem(TOKEN_KEY);

    // Cerrar sesión automáticamente cuando vence el JWT
    effect((onCleanup) => {
      const session = this.session();
      if (!session) return;
      const ms = session.exp * 1000 - Date.now();
      const t = setTimeout(() => this.expire(), Math.max(ms, 0));
      onCleanup(() => clearTimeout(t));
    });
  }

  async login(email: string, password: string): Promise<void> {
    const { token } = await this.api.login(email, password);
    this.setToken(token);
  }

  logout(): void {
    this.setToken(null);
  }

  // La sesión venció o el back la rechazó: volver a correr los guards de la ruta actual
  // para que, si es protegida, redirijan a /login
  expire(): void {
    this.logout();
    this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' });
  }

  private setToken(token: string | null): void {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    this.token.set(token);
  }
}
