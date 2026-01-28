import { Routes } from '@angular/router';
import { Login } from './admin/login/login';
import { Users } from './pages/users/users';
import { authGuard } from './guards/auth-guard';
import { Projects } from './pages/projects/projects';
import { Signup } from './admin/signup/signup';
import { Landing } from './pages/landing/landing';

export const routes: Routes = [
  { path: '', component: Landing , pathMatch : 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'users', component: Users, canActivate: [authGuard] },
  { path: 'projects', component: Projects, canActivate: [authGuard] },
];
