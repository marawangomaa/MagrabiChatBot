import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Admin } from './pages/admin/admin';
import { Chat } from './pages/chat/chat';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  { path: 'login', component: Login },

  { path: 'admin', component: Admin, canActivate: [authGuard] },
  { path: 'chat', component: Chat },
  { path: '**', redirectTo: 'chat' }
];