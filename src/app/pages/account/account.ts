import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, errorMessage, User } from '../../core/api';
import { AuthService } from '../../core/auth';
import { Alert } from '../../shared/alert';

@Component({
  selector: 'app-account-page',
  imports: [FormsModule, Alert],
  templateUrl: './account.html',
})
export class AccountPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  // authGuard garantiza que hay sesión
  private readonly userId = this.auth.session()!.id;

  protected readonly user = signal<User | null>(null);
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly notice = signal('');

  async ngOnInit() {
    try {
      this.setUser(await this.api.getUser(this.userId));
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }

  private setUser(u: User) {
    this.user.set(u);
    this.name.set(u.name);
    this.email.set(u.email);
  }

  protected async onSubmit() {
    const user = this.user();
    if (!user) return;
    this.error.set('');
    this.notice.set('');
    // Solo mandamos los campos que cambiaron
    const changes: { name?: string; email?: string; password?: string } = {};
    if (this.name() !== user.name) changes.name = this.name();
    if (this.email() !== user.email) changes.email = this.email();
    if (this.password()) changes.password = this.password();
    if (Object.keys(changes).length === 0) {
      this.notice.set('No hay cambios para guardar');
      return;
    }
    try {
      this.setUser(await this.api.updateUser(this.userId, changes));
      this.password.set('');
      this.notice.set('Datos actualizados');
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }

  protected async onDelete() {
    if (!confirm('¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await this.api.deleteUser(this.userId);
      this.auth.logout();
      this.router.navigateByUrl('/');
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
}
