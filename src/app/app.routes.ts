import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
	},
	{
		path: 'dashboard',
		canActivate: [AuthGuard],
		loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
	},
	{
		path: '**',
		redirectTo: 'login',
	},
];
