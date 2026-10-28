import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth.guards';
import { AccountPage } from './pages/account/account';
import { AdminPage } from './pages/admin/admin';
import { CartPage } from './pages/cart/cart';
import { CatalogPage } from './pages/catalog/catalog';
import { LoginPage } from './pages/login/login';
import { RegisterPage } from './pages/register/register';

// runGuardsAndResolvers: 'always' hace que los guards vuelvan a correr cuando
// AuthService.expire() recarga la URL actual al vencer la sesión
export const routes: Routes = [
  { path: '', component: CatalogPage },
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'registro', component: RegisterPage, canActivate: [guestGuard] },
  {
    path: 'carrito',
    component: CartPage,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'cuenta',
    component: AccountPage,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'admin',
    component: AdminPage,
    canActivate: [adminGuard],
    runGuardsAndResolvers: 'always',
  },
  { path: '**', redirectTo: '' },
];
