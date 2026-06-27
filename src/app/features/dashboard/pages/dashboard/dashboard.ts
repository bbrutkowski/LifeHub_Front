import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ThemeToggle } from '../../../../core/components/theme-toggle/theme-toggle';
import { UserService } from '../../../user/user-service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

type UserPreferences = {
  avatarUrl: string;
  timezone: string;
  city: string;
  currency: string;
  dateFormat: string;
  weekStartsOn: string;
};

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ThemeToggle],
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
  isTwoFactorEnabled = false;
  allowMarketingEmails = false;
  allowAnalytics = true;
  userPreferences: UserPreferences = this.createDefaultPreferences();

  readonly editProfileForm;
  readonly passwordForm;
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
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {
    this.editProfileForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      avatarUrl: [''],
      timezone: ['Europe/Warsaw', [Validators.required]],
      city: ['Warsaw', [Validators.required, Validators.minLength(2)]],
      currency: ['PLN', [Validators.required]],
      dateFormat: ['DD.MM.YYYY', [Validators.required]],
      weekStartsOn: ['monday', [Validators.required]],
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(8)]],
      confirmPassword: [''],
    });
  }

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

  submitPasswordChange(): void {
    if (this.isSavingPassword) {
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    const current = currentPassword?.trim() ?? '';
    const next = newPassword?.trim() ?? '';
    const confirm = confirmPassword?.trim() ?? '';

    if (!current || !next || !confirm) {
      this.notificationService.error('Fill all password fields before saving.');
      return;
    }

    if (next.length < 8) {
      this.notificationService.error('New password must be at least 8 characters long.');
      return;
    }

    if (next !== confirm) {
      this.notificationService.error('New password and confirmation do not match.');
      return;
    }

    this.isSavingPassword = true;
    setTimeout(() => {
      this.isSavingPassword = false;
      this.passwordForm.reset();
      this.notificationService.info('Password change endpoint is pending backend implementation.');
    }, 300);
  }

  manageSessions(): void {
    this.notificationService.info('Session management will be available after backend endpoints are connected.');
  }

  toggleTwoFactor(): void {
    this.isTwoFactorEnabled = !this.isTwoFactorEnabled;
    const state = this.isTwoFactorEnabled ? 'enabled' : 'disabled';
    this.notificationService.info(`2FA ${state}. Persist this setting when backend support is ready.`);
  }

  exportUserData(): void {
    this.notificationService.info('Data export request queued. Connect with backend export endpoint to generate file.');
  }

  confirmDeleteAccount(): void {
    this.notificationService.error('Account deletion is a protected action. Connect confirmation flow with backend endpoint.');
  }

  savePrivacySettings(): void {
    try {
      localStorage.setItem(
        'user_privacy_settings',
        JSON.stringify({
          allowMarketingEmails: this.allowMarketingEmails,
          allowAnalytics: this.allowAnalytics,
        }),
      );
      this.notificationService.success('Privacy settings saved locally.');
    } catch {
      this.notificationService.error('Saving privacy settings failed.');
    }
  }

  logout(): void {
    this.isAccountMenuOpen = false;
    this.authService.logout('/login');
  }

  openEditProfileModal(): void {
    this.isAccountMenuOpen = false;
    this.editProfileForm.reset({
      name: this.userName,
      email: this.userEmail,
      avatarUrl: this.userAvatarUrl,
      timezone: this.userPreferences.timezone,
      city: this.userPreferences.city,
      currency: this.userPreferences.currency,
      dateFormat: this.userPreferences.dateFormat,
      weekStartsOn: this.userPreferences.weekStartsOn,
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
    const nextPreferences: UserPreferences = {
      avatarUrl: formValue.avatarUrl?.trim() ?? '',
      timezone: formValue.timezone ?? this.userPreferences.timezone,
      city: formValue.city?.trim() ?? '',
      currency: formValue.currency ?? this.userPreferences.currency,
      dateFormat: formValue.dateFormat ?? this.userPreferences.dateFormat,
      weekStartsOn: formValue.weekStartsOn ?? this.userPreferences.weekStartsOn,
    };

    this.isSavingProfile = true;
    this.userService.updateUserProfile(userId, name, email).subscribe({
      next: (profile) => {
        this.applyUserData(profile.name || name, profile.email || email);
        this.applyUserPreferences(nextPreferences);
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
        const resolvedName = profile.name || storedUsername || this.userName;
        const resolvedEmail = profile.email || storedUserEmail || this.userEmail;
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
