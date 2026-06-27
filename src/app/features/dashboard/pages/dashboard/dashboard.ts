import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ThemeToggle } from '../../../../core/components/theme-toggle/theme-toggle';
import { UserService } from '../../../user/user-service';
import { AuthService } from '../../../../core/services/auth.service';

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
  imports: [CommonModule, ReactiveFormsModule, ThemeToggle],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  userName = 'Użytkownik';
  userEmail = '';
  userInitials = 'U';
  isEditProfileModalOpen = false;
  isSavingProfile = false;

  readonly editProfileForm;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {
    this.editProfileForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.loadUserSummary();
  }

  get hasUserEmail(): boolean {
    return !!this.userEmail;
  }

  get userEmailDisplay(): string {
    return this.userEmail || 'Adres e-mail niedostępny';
  }

  logout(): void {
    this.authService.logout('/login');
  }

  openEditProfileModal(): void {
    this.editProfileForm.reset({
      name: this.userName,
      email: this.userEmail,
    });
    this.isEditProfileModalOpen = true;
  }

  closeEditProfileModal(): void {
    if (this.isSavingProfile) {
      return;
    }
    this.isEditProfileModalOpen = false;
  }

  submitEditProfile(): void {
    if (this.editProfileForm.invalid || this.isSavingProfile) {
      this.editProfileForm.markAllAsTouched();
      return;
    }

    const userId = this.getStoredValue('userId');
    if (!userId) {
      return;
    }

    const formValue = this.editProfileForm.getRawValue();
    const name = formValue.name?.trim() ?? '';
    const email = formValue.email?.trim() ?? '';

    this.isSavingProfile = true;
    this.userService.updateUserProfile(userId, name, email).subscribe({
      next: (profile) => {
        this.applyUserData(profile.name || name, profile.email || email);
        localStorage.setItem('username', this.userName);
        this.isEditProfileModalOpen = false;
        this.isSavingProfile = false;
      },
      error: () => {
        this.isSavingProfile = false;
      },
    });
  }

  private loadUserSummary(): void {
    const storedUserId = this.getStoredValue('userId');
    const storedUsername = this.getStoredValue('username');

    if (storedUsername) {
      this.applyUserData(storedUsername, this.userEmail);
    }

    if (!storedUserId) {
      return;
    }

    this.userService.getUser(storedUserId).subscribe({
      next: (profile) => {
        const resolvedName = profile.name || storedUsername || this.userName;
        const resolvedEmail = profile.email || this.userEmail;
        this.applyUserData(resolvedName, resolvedEmail);
        localStorage.setItem('username', resolvedName);
      },
      error: () => {
        if (!storedUsername) {
          this.applyUserData(this.userName, this.userEmail);
        }
      },
    });
  }

  private applyUserData(name: string, email: string): void {
    this.userName = this.normalizeName(name);
    this.userEmail = email?.trim() ?? '';
    this.userInitials = this.createInitials(this.userName);
  }

  private normalizeName(name: string): string {
    const normalized = name?.trim();
    return normalized || 'Użytkownik';
  }

  private createInitials(name: string): string {
    const parts = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase());

    return parts.join('') || 'U';
  }

  private getStoredValue(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

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
