import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserSession } from '../../../../core/services/user-service';

export type UserProfilePreferences = {
  avatarUrl: string;
  timezone: string;
  city: string;
  currency: string;
  dateFormat: string;
  weekStartsOn: string;
};

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-profile-modal.html',
  styleUrl: './user-profile-modal.css',
  host: {
    class: 'user-profile-modal-host',
  },
})
export class UserProfileModal implements OnChanges {
    @Input() isOpen = false;
    @Input() userName = 'Użytkownik';
    @Input() userEmail = '';
    @Input() userAvatarUrl = '';
    @Input() allowMarketingEmails = false;
    @Input() allowAnalytics = true;
    @Input() userPreferences: UserProfilePreferences = {
        avatarUrl: '',
        timezone: 'Europe/Warsaw',
        city: 'Warsaw',
        currency: 'PLN',
        dateFormat: 'DD.MM.YYYY',
        weekStartsOn: 'monday',
    };
    @Input() timezoneOptions: Array<{ value: string; label: string }> = [];
    @Input() currencyOptions: string[] = [];
    @Input() dateFormatOptions: Array<{ value: string; label: string }> = [];
    @Input() weekStartOptions: Array<{ value: string; label: string }> = [];
    @Input() isSavingProfile = false;
    @Input() isSavingPassword = false;
    @Input() sessions: UserSession[] = [];
    @Input() isLoadingSessions = false;

    @Output() close = new EventEmitter<void>();
    @Output() saveProfile = new EventEmitter<any>();
    @Output() savePassword = new EventEmitter<any>();
    @Output() savePrivacy = new EventEmitter<{ allowMarketingEmails: boolean; allowAnalytics: boolean }>();
    @Output() manageSessions = new EventEmitter<void>();
    @Output() exportUserData = new EventEmitter<void>();
    @Output() deleteAccount = new EventEmitter<string>();
    @Output() revokeSession = new EventEmitter<string>();
    @Output() revokeOtherSessions = new EventEmitter<void>();

    readonly editProfileForm: FormGroup;
    readonly passwordForm: FormGroup;
    avatarFile: File | null = null;
    avatarPreviewUrl = '';
    avatarError = '';
    removeAvatar = false;
    showDeleteConfirmation = false;
    deletePassword = '';
    showSessions = false;
    passwordError = '';

    constructor(private readonly formBuilder: FormBuilder) {
        this.editProfileForm = this.formBuilder.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        timezone: ['Europe/Warsaw', [Validators.required]],
        city: ['Warsaw', [Validators.required, Validators.minLength(2)]],
        currency: ['PLN', [Validators.required]],
        dateFormat: ['DD.MM.YYYY', [Validators.required]],
        weekStartsOn: ['monday', [Validators.required]],
    });

        this.passwordForm = this.formBuilder.group({
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
    });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen']) {
            this.applyBodyScrollLock(this.isOpen);
        }

        const profileChanged = changes['userName'] || changes['userEmail'] || changes['userAvatarUrl'] || changes['userPreferences'];
        if (changes['isOpen']?.currentValue === true || (this.isOpen && profileChanged)) {
            this.resetForm();
        }
  }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.isOpen) {
            this.closeModal();
        }
    }

    ngOnDestroy(): void {
        this.applyBodyScrollLock(false);
    }

    closeModal(): void {
        this.applyBodyScrollLock(false);
        this.close.emit();
    }

    submitProfileForm(): void {
        if (this.editProfileForm.invalid || this.isSavingProfile || this.avatarError) {
            this.editProfileForm.markAllAsTouched();
            return;
        }

        this.saveProfile.emit({
            ...this.editProfileForm.getRawValue(),
            avatarFile: this.avatarFile,
            removeAvatar: this.removeAvatar,
        });
    }

    onAvatarSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        this.avatarError = '';
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            this.avatarError = 'Choose a JPEG, PNG or WebP image up to 5 MB.';
            input.value = '';
            return;
        }

        this.clearAvatarPreview();
        this.avatarFile = file;
        this.avatarPreviewUrl = URL.createObjectURL(file);
        this.removeAvatar = false;
    }

    clearSelectedAvatar(): void {
        this.clearAvatarPreview();
        this.avatarFile = null;
        this.removeAvatar = true;
    }

    submitPasswordChange(): void {
        const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
        const current = currentPassword ?? '';
        const next = newPassword ?? '';
        const confirm = confirmPassword ?? '';

        if (!current || !next || !confirm) {
            this.passwordError = 'Fill all password fields.';
            return;
        }

        if (next.length < 8) {
            this.passwordError = 'New password must be at least 8 characters.';
            return;
        }
        if (next !== confirm) {
            this.passwordError = 'New passwords do not match.';
            return;
        }

        this.passwordError = '';
        this.savePassword.emit({ currentPassword: current, newPassword: next, confirmPassword: confirm });
        this.passwordForm.reset();
    }

    confirmAccountDeactivation(): void {
        if (!this.deletePassword.trim()) return;
        this.deleteAccount.emit(this.deletePassword);
    }

    toggleSessionList(): void {
        this.showSessions = !this.showSessions;
        if (this.showSessions) this.manageSessions.emit();
    }

    private clearAvatarPreview(): void {
        if (this.avatarPreviewUrl) URL.revokeObjectURL(this.avatarPreviewUrl);
        this.avatarPreviewUrl = '';
    }

    savePrivacySettings(): void {
        this.savePrivacy.emit({
            allowMarketingEmails: this.allowMarketingEmails,
            allowAnalytics: this.allowAnalytics,
        });
    }

    private resetForm(): void {
        this.editProfileForm.reset({
            name: this.userName || 'User',
            email: this.userEmail || '',
            timezone: this.userPreferences.timezone || 'Europe/Warsaw',
            city: this.userPreferences.city || 'Warsaw',
            currency: this.userPreferences.currency || 'PLN',
            dateFormat: this.userPreferences.dateFormat || 'DD.MM.YYYY',
            weekStartsOn: this.userPreferences.weekStartsOn || 'monday',
        });

        this.passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        });
        this.clearAvatarPreview();
        this.avatarFile = null;
        this.avatarError = '';
        this.removeAvatar = false;
        this.showDeleteConfirmation = false;
        this.deletePassword = '';
        this.showSessions = false;
    }

    private applyBodyScrollLock(isOpen: boolean): void {
        if (typeof document === 'undefined') {
            return;
        }

        document.documentElement.style.overflow = isOpen ? 'hidden' : '';
        document.body.style.overflow = isOpen ? 'hidden' : '';
        document.body.style.margin = '0';
    }
}
