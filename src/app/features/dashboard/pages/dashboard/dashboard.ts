import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ThemeToggle } from '../../../../core/components/theme-toggle/theme-toggle';
import { UserProfile, UserService, UserSession } from '../../../../core/services/user-service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserProfileModal, UserProfilePreferences } from '../../components/user-profile-modal/user-profile-modal';
import { environment } from '../../../../../environments/environment';
import { Observable, of, switchMap } from 'rxjs';

type UserPreferences = UserProfilePreferences;

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ThemeToggle, UserProfileModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly userPreferencesKey = 'user_preferences';

  userName = 'Użytkownik';
  userEmail = '';
  userInitials = 'U';
  userAvatarUrl = '';
  isEditProfileModalOpen = false;
  isSavingProfile = false;
  isAccountMenuOpen = false;
  isSavingPassword = false;
  isLoadingSessions = false;
  sessions: UserSession[] = [];
  allowMarketingEmails = false;
  allowAnalytics = true;
  userPreferences: UserPreferences = this.createDefaultPreferences();

  readonly timezoneOptions = [
    { value: 'Europe/Warsaw', label: 'Europe/Warsaw' },
    { value: 'Europe/London', label: 'Europe/London' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin' },
    { value: 'America/New_York', label: 'America/New_York' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  ];
  readonly currencyOptions = ['PLN', 'EUR', 'USD', 'GBP'];
  readonly dateFormatOptions = [
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  ];
  readonly weekStartOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadUserSummary();
  }

  get hasUserEmail(): boolean {
    return !!this.userEmail;
  }

  get userEmailDisplay(): string {
    return this.userEmail || 'Email address unavailable';
  }

  get userCityDisplay(): string {
    return this.userPreferences.city || 'Set your city';
  }

  get hasAvatar(): boolean {
    return !!this.userAvatarUrl;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isAccountMenuOpen = false;
  }

  toggleAccountMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  openAccountSettings(event: MouseEvent): void {
    event.stopPropagation();
    this.isAccountMenuOpen = false;
    this.openEditProfileModal();
  }

  manageSessions(): void {
    this.isLoadingSessions = true;
    this.userService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.isLoadingSessions = false;
      },
      error: () => {
        this.isLoadingSessions = false;
        this.notificationService.error('Could not load active sessions.');
      },
    });
  }

  exportUserData(): void {
    this.userService.exportData().subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'lifehub-account-export.json';
        link.click();
        URL.revokeObjectURL(url);
        this.notificationService.success('Your data export has been downloaded.');
      },
      error: () => this.notificationService.error('Could not export your account data.'),
    });
  }

  confirmDeleteAccount(currentPassword: string): void {
    this.userService.deactivateAccount(currentPassword).subscribe({
      next: () => {
        this.notificationService.success('Your account has been deactivated.');
        this.authService.logout('/login');
      },
      error: () => this.notificationService.error('Account deactivation failed. Check your password and try again.'),
    });
  }

  revokeSession(sessionId: string): void {
    const session = this.sessions.find((item) => item.id === sessionId);
    this.userService.revokeSession(sessionId).subscribe({
      next: () => {
        if (session?.isCurrent) {
          this.authService.logout('/login');
          return;
        }
        this.notificationService.success('Session revoked.');
        this.manageSessions();
      },
      error: () => this.notificationService.error('Could not revoke this session.'),
    });
  }

  revokeOtherSessions(): void {
    this.userService.revokeOtherSessions().subscribe({
      next: () => {
        this.notificationService.success('Other sessions have been revoked.');
        this.manageSessions();
      },
      error: () => this.notificationService.error('Could not revoke other sessions.'),
    });
  }

  submitPasswordChange(payload: { currentPassword: string; newPassword: string; confirmPassword: string }): void {
    const { currentPassword, newPassword, confirmPassword } = payload;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.notificationService.error('Fill all password fields before saving.');
      return;
    }

    if (newPassword.length < 8) {
      this.notificationService.error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.notificationService.error('New password and confirmation do not match.');
      return;
    }

    this.isSavingPassword = true;
    this.userService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isSavingPassword = false;
        this.notificationService.success('Password changed. Please sign in again.');
        this.authService.logout('/login');
      },
      error: () => {
        this.isSavingPassword = false;
        this.notificationService.error('Password change failed. Check your current password and try again.');
      },
    });
  }

  logout(): void {
    this.isAccountMenuOpen = false;
    this.userService.logoutCurrentSession().subscribe({
      next: () => this.authService.logout('/login'),
      error: () => this.authService.logout('/login'),
    });
  }

  openEditProfileModal(): void {
    this.isAccountMenuOpen = false;
    this.isEditProfileModalOpen = true;
  }

  closeEditProfileModal(): void {
    if (this.isSavingProfile) {
      return;
    }
    this.isEditProfileModalOpen = false;
  }

  submitEditProfile(formValue: {
    name: string;
    email: string;
    timezone: string;
    city: string;
    currency: string;
    dateFormat: string;
    weekStartsOn: string;
    avatarFile: File | null;
    removeAvatar: boolean;
  }): void {
    if (this.isSavingProfile) {
      return;
    }

    const userId = this.getStoredValue('userId');
    if (!userId) {
      return;
    }

    const name = formValue.name?.trim() ?? '';
    const email = formValue.email?.trim() ?? '';
    const profilePayload = {
      name,
      email,
      timezone: formValue.timezone ?? this.userPreferences.timezone,
      city: formValue.city?.trim() ?? '',
      currency: formValue.currency ?? this.userPreferences.currency,
      dateFormat: formValue.dateFormat ?? this.userPreferences.dateFormat,
      weekStartsOn: formValue.weekStartsOn ?? this.userPreferences.weekStartsOn,
    };

    this.isSavingProfile = true;
    let avatarRequest: Observable<unknown>;
    if (formValue.avatarFile) {
      avatarRequest = this.userService.uploadAvatar(formValue.avatarFile);
    } else if (formValue.removeAvatar) {
      avatarRequest = this.userService.deleteAvatar();
    } else {
      avatarRequest = of(null);
    }

    avatarRequest.pipe(
      switchMap(() => this.userService.updateUserProfile(userId, profilePayload)),
    ).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        localStorage.setItem('username', this.userName);
        localStorage.setItem('email', this.userEmail);
        this.isEditProfileModalOpen = false;
        this.isSavingProfile = false;
        this.notificationService.success('Profile updated successfully.');
      },
      error: () => {
        this.isSavingProfile = false;
        this.notificationService.error('Saving profile changes failed.');
      },
    });
  }

  private loadUserSummary(): void {
    const storedUserId = this.getStoredValue('userId');
    const storedUsername = this.getStoredValue('username');
    const storedUserEmail = this.getStoredValue('email');
    this.applyUserPreferences(this.readStoredPreferences());

    if (storedUsername) {
      this.applyUserData(storedUsername, storedUserEmail || this.userEmail);
    }

    if (!storedUserId) {
      return;
    }

    this.userService.getUser(storedUserId).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        localStorage.setItem('username', this.userName);
        localStorage.setItem('email', this.userEmail);
      },
      error: () => {
        if (!storedUsername) {
          this.applyUserData(this.userName, this.userEmail);
        }
      },
    });
  }

  private applyProfile(profile: UserProfile): void {
    this.applyUserData(profile.name, profile.email);
    this.applyUserPreferences({
      avatarUrl: this.resolveAvatarUrl(profile.avatarUrl),
      timezone: profile.timezone,
      city: profile.city,
      currency: profile.currency,
      dateFormat: profile.dateFormat,
      weekStartsOn: profile.weekStartsOn,
    });
  }

  private resolveAvatarUrl(url: string | null): string {
    if (!url) return '';
    return url.startsWith('/') ? `${environment.apiBaseUrl}${url}` : url;
  }

  private applyUserData(name: string, email: string): void {
    this.userName = this.normalizeName(name);
    this.userEmail = email?.trim() ?? '';
    this.userInitials = this.createInitials(this.userName);
  }

  private applyUserPreferences(preferences: UserPreferences): void {
    this.userPreferences = {
      ...this.createDefaultPreferences(),
      ...preferences,
      avatarUrl: preferences.avatarUrl?.trim() ?? '',
      city: preferences.city?.trim() || 'Warsaw',
    };
    this.userAvatarUrl = this.userPreferences.avatarUrl;
    this.storeUserPreferences(this.userPreferences);
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

  private createDefaultPreferences(): UserPreferences {
    return {
      avatarUrl: '',
      timezone: 'Europe/Warsaw',
      city: 'Warsaw',
      currency: 'PLN',
      dateFormat: 'DD.MM.YYYY',
      weekStartsOn: 'monday',
    };
  }

  private readStoredPreferences(): UserPreferences {
    try {
      const raw = localStorage.getItem(this.userPreferencesKey);
      if (!raw) {
        return this.createDefaultPreferences();
      }

      const parsed = JSON.parse(raw) as Partial<UserPreferences>;
      return {
        ...this.createDefaultPreferences(),
        ...parsed,
      };
    } catch {
      return this.createDefaultPreferences();
    }
  }

  private storeUserPreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.userPreferencesKey, JSON.stringify(preferences));
    } catch {
      // Ignore storage failures and keep app running.
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
