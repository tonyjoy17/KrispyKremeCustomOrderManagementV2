import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header"><h1>Change Password</h1><p>Update the password for your administrator account.</p></div>
      <div class="card">
        <div class="field">
          <label>Current Password</label>
          <input type="password" [(ngModel)]="currentPassword" autocomplete="current-password" [disabled]="saving" />
        </div>
        <div class="field">
          <label>New Password</label>
          <input type="password" [(ngModel)]="newPassword" autocomplete="new-password" [disabled]="saving" />
          <small>Minimum 4 characters.</small>
        </div>
        <div class="field">
          <label>Confirm New Password</label>
          <input type="password" [(ngModel)]="confirmPassword" autocomplete="new-password" [disabled]="saving" (keyup.enter)="save()" />
        </div>
        <div class="error" *ngIf="error">{{ error }}</div>
        <div class="success" *ngIf="success">{{ success }}</div>
        <button (click)="save()" [disabled]="saving">{{ saving ? 'Updating...' : 'Change Password' }}</button>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:32px;max-width:650px}.page-header{margin-bottom:24px}.page-header h1{margin:0 0 4px;color:#0f172a;font-size:26px}.page-header p{margin:0;color:#64748b;font-size:14px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:26px;max-width:480px}.field{display:flex;flex-direction:column;gap:6px;margin-bottom:18px}label{font-size:13px;font-weight:700;color:#374151}input{padding:11px 12px;border:1.5px solid #dbe3ec;border-radius:9px;font:inherit;outline:none}input:focus{border-color:#7c3aed}small{color:#64748b;font-size:12px}.error,.success{padding:11px 13px;border-radius:8px;margin-bottom:16px;font-size:13px}.error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}.success{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}button{padding:11px 18px;border:0;border-radius:9px;background:#7c3aed;color:#fff;font:inherit;font-weight:700;cursor:pointer}button:disabled{opacity:.6;cursor:not-allowed}
  `]
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  saving = false;
  error = '';
  success = '';

  constructor(private auth: AuthService) {}

  save() {
    this.error = ''; this.success = '';
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) { this.error = 'Complete all password fields.'; return; }
    if (this.newPassword.length < 4) { this.error = 'New password must be at least 4 characters.'; return; }
    if (this.newPassword !== this.confirmPassword) { this.error = 'New passwords do not match.'; return; }
    if (this.newPassword === this.currentPassword) { this.error = 'New password must be different from the current password.'; return; }
    this.saving = true;
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: response => {
        this.success = response.message || 'Password updated successfully.';
        this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = ''; this.saving = false;
      },
      error: response => { this.error = response.error?.message || 'Could not update password.'; this.saving = false; },
    });
  }
}
