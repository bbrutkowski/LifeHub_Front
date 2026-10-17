import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
	},
	{
		path: 'finances',
		redirectTo: 'dashboard/finances',
	},
	{
		path: 'dashboard',
		canActivate: [AuthGuard],
		loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
		children: [
			{
				path: 'finances',
				loadComponent: () => import('./features/finance/pages/finance/finance').then((m) => m.Finance),
			},
			{
				path: 'tasks',
				loadComponent: () => import('./features/dashboard/pages/section/section').then((m) => m.WorkspaceSection),
				data: { title: 'Zadania', description: 'Tutaj znajdziesz swoje zadania i plany dnia.' },
			},
			{
				path: 'travel',
				loadComponent: () => import('./features/dashboard/pages/section/section').then((m) => m.WorkspaceSection),
				data: { title: 'Podróże', description: 'Tutaj zaplanujesz podróże i zapiszesz ważne informacje.' },
			},
			{
				path: 'habits',
				loadComponent: () => import('./features/dashboard/pages/section/section').then((m) => m.WorkspaceSection),
				data: { title: 'Nawyki', description: 'Tutaj będziesz śledzić swoje nawyki i postępy.' },
			},
			{
				path: 'calendar',
				loadComponent: () => import('./features/dashboard/pages/section/section').then((m) => m.WorkspaceSection),
				data: { title: 'Kalendarz', description: 'Tutaj zobaczysz wydarzenia i nadchodzące terminy.' },
			},
			{
				path: 'notes',
				loadComponent: () => import('./features/dashboard/pages/section/section').then((m) => m.WorkspaceSection),
				data: { title: 'Notatki', description: 'Tutaj zapiszesz swoje notatki i pomysły.' },
			},
			{
				path: 'analytics',
				loadComponent: () => import('./features/dashboard/pages/section/section').then((m) => m.WorkspaceSection),
				data: { title: 'Analizy', description: 'Tutaj zobaczysz podsumowania i trendy swoich danych.' },
			},
		],
	},
	{
		path: '**',
		redirectTo: 'dashboard',
	},
];
