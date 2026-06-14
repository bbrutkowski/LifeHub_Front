import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
	},
	{
		path: 'dashboard',
		loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
	},
	{
		path: '**',
		redirectTo: 'login',
	},
];
