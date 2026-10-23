import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth';
import { Alert } from '../../shared/alert';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink, Alert],
  templateUrl: './register.html',
})
export class RegisterPage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly isAdmin = signal(false);
  protected readonly secretKey = signal('');
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  protected async onSubmit() {
    this.error.set('');
    this.loading.set(true);
    try {
      if (this.isAdmin()) {
        await this.api.createAdmin(this.name(), this.email(), this.password(), this.secretKey());
      } else {
        await this.api.register(this.name(), this.email(), this.password());
      }
      // Después de registrarse, iniciar sesión directamente
      await this.auth.login(this.email(), this.password());
      this.router.navigateByUrl('/');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
}
