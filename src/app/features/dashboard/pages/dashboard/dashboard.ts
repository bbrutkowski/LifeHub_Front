import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ThemeToggle } from '../../../../core/components/theme-toggle/theme-toggle';

type NavItem = {
  label: string;
  icon: string;
  active?: boolean;
};

type StatCard = {
  title: string;
  value: string;
  subtitle: string;
  accent: string;
  icon: string;
};

type TaskItem = {
  title: string;
  category: string;
  time: string;
  done?: boolean;
};

type HabitItem = {
  title: string;
  progress: string;
  icon: string;
  accent: string;
};

type ReminderItem = {
  title: string;
  time: string;
  tag: string;
};

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, ThemeToggle],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: '⌂', active: true },
    { label: 'Finanse', icon: '$' },
    { label: 'Zadania', icon: '☑' },
    { label: 'Podróże', icon: '✈' },
    { label: 'Nawyki', icon: '◔' },
    { label: 'Kalendarz', icon: '☰' },
    { label: 'Notatki', icon: '✎' },
    { label: 'Analizy', icon: '⌘' },
  ];

  readonly statCards: StatCard[] = [
    { title: 'Stan konta', value: '12 458,60 zł', subtitle: '+1 234,50 zł w tym miesiącu', accent: 'blue', icon: '◫' },
    { title: 'Zadania', value: '8 / 12', subtitle: '4 do zrobienia dzisiaj', accent: 'green', icon: '✓' },
    { title: 'Streak', value: '12 dni', subtitle: 'Świetna robota!', accent: 'purple', icon: '🔥' },
    { title: 'Następna podróż', value: '3 dni', subtitle: 'Rzym, Włochy', accent: 'orange', icon: '✈' },
  ];

  readonly tasks: TaskItem[] = [
    { title: 'Dokończyć raport projektowy', category: 'Praca', time: '2h' },
    { title: 'Trening na siłowni', category: 'Zdrowie', time: '1h', done: true },
    { title: 'Nauka Angular', category: 'Rozwój', time: '1.5h', done: true },
    { title: 'Przeczytać 20 stron książki', category: 'Relaks', time: '30m' },
  ];

  readonly habits: HabitItem[] = [
    { title: 'Woda', progress: '7/8 szklanek', icon: '💧', accent: 'blue' },
    { title: 'Trening', progress: '4/5 w tygodniu', icon: '🏋', accent: 'green' },
    { title: 'Czytanie', progress: '12/20 stron', icon: '📖', accent: 'purple' },
    { title: 'Medytacja', progress: '5/10 minut', icon: '🧘', accent: 'orange' },
  ];

  readonly reminders: ReminderItem[] = [
    { title: 'Spotkanie z zespołem', time: 'Jutro, 10:00 - 11:00', tag: 'Praca' },
    { title: 'Lekarz - badania kontrolne', time: 'Piątek, 14:30', tag: 'Zdrowie' },
    { title: 'Spakuj się na wyjazd', time: 'Sobota', tag: 'Podróże' },
  ];
}
