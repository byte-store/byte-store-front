import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService, errorMessage, Role, User } from '../../core/api';
import { AuthService } from '../../core/auth';
import { Alert } from '../../shared/alert';

@Component({
  selector: 'app-users-admin',
  imports: [Alert],
  templateUrl: './users-admin.html',
})
export class UsersAdmin implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly users = signal<User[]>([]);
  protected readonly error = signal('');
  protected readonly notice = signal('');

  async ngOnInit() {
    try {
      this.users.set(await this.api.getUsers());
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }

  protected async changeRole(u: User, select: HTMLSelectElement) {
    this.error.set('');
    this.notice.set('');
    try {
      const updated = await this.api.updateUser(u.id, { role: select.value as Role });
      this.users.update((list) => list.map((x) => (x.id === u.id ? updated : x)));
      this.notice.set(`Rol de ${updated.name} actualizado`);
    } catch (e) {
      // El select no está atado al estado, así que lo volvemos al rol real
      select.value = u.role;
      this.error.set(errorMessage(e));
    }
  }

  protected async onDelete(u: User) {
    if (!confirm(`¿Eliminar al usuario ${u.name}?`)) return;
    this.error.set('');
    this.notice.set('');
    try {
      await this.api.deleteUser(u.id);
      this.users.update((list) => list.filter((x) => x.id !== u.id));
      this.notice.set('Usuario eliminado');
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
}
