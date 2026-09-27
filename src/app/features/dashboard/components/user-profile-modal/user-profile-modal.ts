import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

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
    @Input() isTwoFactorEnabled = false;

    @Output() close = new EventEmitter<void>();
    @Output() saveProfile = new EventEmitter<any>();
    @Output() savePassword = new EventEmitter<any>();
    @Output() savePrivacy = new EventEmitter<{ allowMarketingEmails: boolean; allowAnalytics: boolean }>();
    @Output() manageSessions = new EventEmitter<void>();
    @Output() toggleTwoFactor = new EventEmitter<void>();
    @Output() exportUserData = new EventEmitter<void>();
    @Output() deleteAccount = new EventEmitter<void>();

    readonly editProfileForm: FormGroup;
        readonly passwordForm: FormGroup;

    constructor(private readonly formBuilder: FormBuilder) {
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

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isOpen']) {
            this.applyBodyScrollLock(this.isOpen);
        }

        if (this.isOpen) {
            this.resetForm();
        }

        if (changes['userName'] || changes['userEmail'] || changes['userAvatarUrl'] || changes['userPreferences']) {
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
        if (this.editProfileForm.invalid || this.isSavingProfile) {
            this.editProfileForm.markAllAsTouched();
            return;
        }

        this.saveProfile.emit(this.editProfileForm.getRawValue());
    }

    submitPasswordChange(): void {
        const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
        const current = currentPassword?.trim() ?? '';
        const next = newPassword?.trim() ?? '';
        const confirm = confirmPassword?.trim() ?? '';

        if (!current || !next || !confirm) {
            return;
        }

        if (next.length < 8 || next !== confirm) {
            return;
        }

        this.savePassword.emit({ currentPassword: current, newPassword: next, confirmPassword: confirm });
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
            avatarUrl: this.userAvatarUrl || '',
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
