import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  district: string;
  bio: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterLink],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
})
export class ProfileSettingsComponent implements OnInit {
  currentUser = signal<User | null>(null);
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // UI State
  activeTab = signal<'profile' | 'password' | 'preferences'>('profile');
  isEditingProfile = signal(false);
  isSavingProfile = signal(false);
  isChangingPassword = signal(false);

  // Messages
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Preferences
  emailNotifications = signal(true);
  smsNotifications = signal(false);
  weeklyReports = signal(true);
  appointmentReminders = signal(true);

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Load current user
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser.set(user);

    // Initialize forms
    this.initializeForms();

    // Load preferences from localStorage
    this.loadPreferences();
  }

  private initializeForms(): void {
    const user = this.currentUser();

    // Profile form
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.minLength(2)]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{9,15}$/)]],
      district: [''],
      bio: ['', [Validators.maxLength(500)]],
    });

    // Password form
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );

    // Disable profile form initially
    this.profileForm.disable();
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private loadPreferences(): void {
    const prefs = localStorage.getItem('userPreferences');
    if (prefs) {
      try {
        const preferences = JSON.parse(prefs);
        this.emailNotifications.set(preferences.emailNotifications ?? true);
        this.smsNotifications.set(preferences.smsNotifications ?? false);
        this.weeklyReports.set(preferences.weeklyReports ?? true);
        this.appointmentReminders.set(preferences.appointmentReminders ?? true);
      } catch (e) {
        console.error('Error loading preferences', e);
      }
    }
  }

  private savePreferences(): void {
    const preferences = {
      emailNotifications: this.emailNotifications(),
      smsNotifications: this.smsNotifications(),
      weeklyReports: this.weeklyReports(),
      appointmentReminders: this.appointmentReminders(),
    };
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }

  // Tab navigation
  setActiveTab(tab: 'profile' | 'password' | 'preferences'): void {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  // Profile editing
  toggleEditProfile(): void {
    if (this.isEditingProfile()) {
      // Cancel editing
      this.profileForm.reset();
      this.initializeForms();
      this.isEditingProfile.set(false);
    } else {
      // Start editing
      this.profileForm.enable();
      this.isEditingProfile.set(true);
    }
    this.clearMessages();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isSavingProfile.set(true);
    this.clearMessages();

    // Simulate API call
    setTimeout(() => {
      const formData = this.profileForm.value;

      // Update user in localStorage
      const users = this.getStoredUsers();
      const userIndex = users.findIndex((u: any) => u.id === this.currentUser()?.id);

      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          district: formData.district,
          bio: formData.bio,
        };

        localStorage.setItem('users', JSON.stringify(users));

        // Update current user
        const updatedUser = {
          id: users[userIndex].id,
          email: formData.email,
          name: formData.name,
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUser.set(updatedUser);

        this.successMessage.set('Profile updated successfully!');
        this.isEditingProfile.set(false);
        this.profileForm.disable();
      } else {
        this.errorMessage.set('Error updating profile. Please try again.');
      }

      this.isSavingProfile.set(false);
    }, 1000);
  }

  // Password change
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isChangingPassword.set(true);
    this.clearMessages();

    // Simulate API call
    setTimeout(() => {
      const formData = this.passwordForm.value;

      // Verify current password
      const users = this.getStoredUsers();
      const user = users.find((u: any) => u.id === this.currentUser()?.id);

      if (user && user.password === formData.currentPassword) {
        // Update password
        user.password = formData.newPassword;
        localStorage.setItem('users', JSON.stringify(users));

        this.successMessage.set('Password changed successfully!');
        this.passwordForm.reset();
      } else {
        this.errorMessage.set('Current password is incorrect.');
      }

      this.isChangingPassword.set(false);
    }, 1000);
  }

  // Preferences
  togglePreference(preference: 'email' | 'sms' | 'weekly' | 'appointments'): void {
    switch (preference) {
      case 'email':
        this.emailNotifications.set(!this.emailNotifications());
        break;
      case 'sms':
        this.smsNotifications.set(!this.smsNotifications());
        break;
      case 'weekly':
        this.weeklyReports.set(!this.weeklyReports());
        break;
      case 'appointments':
        this.appointmentReminders.set(!this.appointmentReminders());
        break;
    }

    this.savePreferences();
    this.successMessage.set('Preferences updated successfully!');

    // Clear message after 3 seconds
    setTimeout(() => this.clearMessages(), 3000);
  }

  // Helper methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private getStoredUsers(): any[] {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string | null {
    const field = formGroup.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['minlength'])
        return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
      if (field.errors['maxlength'])
        return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
      if (field.errors['pattern']) return 'Invalid format';
    }
    return null;
  }

  getPasswordMismatchError(): boolean {
    return (
      (this.passwordForm.errors?.['passwordMismatch'] &&
        this.passwordForm.get('confirmPassword')?.touched) ||
      false
    );
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Remove user from users array
      const users = this.getStoredUsers();
      const filteredUsers = users.filter((u: any) => u.id !== this.currentUser()?.id);
      localStorage.setItem('users', JSON.stringify(filteredUsers));

      // Logout and redirect
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
