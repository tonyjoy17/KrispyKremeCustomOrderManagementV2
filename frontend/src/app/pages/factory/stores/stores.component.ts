// pages/factory/stores/stores.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoresService } from '../../../services/stores.service';
import { Store, RegisterStoreRequest } from '../../../models';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Manage Stores</h1>
          <p>Register and manage retail store accounts</p>
        </div>
        <button class="btn-primary" (click)="showForm = !showForm">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" [attr.d]="showForm
              ? 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
              : 'M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'"
              clip-rule="evenodd"/>
          </svg>
          {{ showForm ? 'Cancel' : 'Register New Store' }}
        </button>
      </div>

      <!-- Registration Form -->
      <div *ngIf="showForm" class="form-card">
        <h3>New Retail Store</h3>
        <form (ngSubmit)="registerStore()">
          <div class="fields-grid">
            <div class="field" [class.has-error]="submitted && !form.name">
              <label>Store Name <span class="req">*</span></label>
              <input type="text" [(ngModel)]="form.name" name="name" placeholder="e.g. CBD Store" />
              <span class="error-text" *ngIf="submitted && !form.name">Required</span>
            </div>
            <div class="field" [class.has-error]="submitted && !form.storeCode">
              <label>Store Code <span class="req">*</span></label>
              <input type="text" [(ngModel)]="form.storeCode" name="storeCode" placeholder="e.g. CBD01" style="text-transform:uppercase" />
              <span class="error-text" *ngIf="submitted && !form.storeCode">Required</span>
            </div>
            <div class="field" [class.has-error]="submitted && !form.username">
              <label>Login Username <span class="req">*</span></label>
              <input type="text" [(ngModel)]="form.username" name="username" placeholder="e.g. cbdstore" />
              <span class="error-text" *ngIf="submitted && !form.username">Required</span>
            </div>
            <div class="field" [class.has-error]="submitted && !form.password">
              <label>Password <span class="req">*</span></label>
              <input type="text" [(ngModel)]="form.password" name="password" placeholder="Min 6 characters" />
              <span class="error-text" *ngIf="submitted && !form.password">Required</span>
            </div>
            <div class="field">
              <label>Email <span class="opt">(optional)</span></label>
              <input type="email" [(ngModel)]="form.email" name="email" placeholder="store@example.com" />
            </div>
            <div class="field">
              <label>Phone <span class="opt">(optional)</span></label>
              <input type="tel" [(ngModel)]="form.phone" name="phone" placeholder="Phone number" />
            </div>
            <div class="field full-width">
              <label>Address <span class="opt">(optional)</span></label>
              <input type="text" [(ngModel)]="form.address" name="address" placeholder="Store address" />
            </div>
          </div>

          <div *ngIf="formError" class="error-banner">{{ formError }}</div>
          <div *ngIf="formSuccess" class="success-banner">{{ formSuccess }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="saving">
              <span *ngIf="!saving">Register Store</span>
              <span *ngIf="saving" class="spinner-row"><span class="spinner"></span> Saving...</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Stores List -->
      <div *ngIf="loading" class="loading-wrap">
        <div class="loading-spinner"></div>
      </div>

      <div *ngIf="!loading" class="table-card">
        <div *ngIf="stores.length === 0" class="empty-state">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
          <p>No retail stores registered yet</p>
        </div>

        <div *ngIf="stores.length > 0">
          <div class="table-head">
            <span>Store Name</span>
            <span>Code</span>
            <span>Username</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Registered</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          <div class="table-row" *ngFor="let store of stores">
            <span class="store-name-cell">
              <span class="store-avatar">{{ store.name.charAt(0) }}</span>
              {{ store.name }}
            </span>
            <span class="code-tag">{{ store.store_code || store.storeCode }}</span>
            <span class="username">{{ store.username }}</span>
            <span class="meta">{{ store.email || '—' }}</span>
            <span class="meta">{{ store.phone || '—' }}</span>
            <span class="meta">{{ (store.created_at || store.createdAt) | date:'d MMM y' }}</span>
            <span>
              <span class="pill" [class.pill-green]="store.is_active || store.isActive" [class.pill-gray]="!(store.is_active || store.isActive)">
                {{ (store.is_active || store.isActive) ? 'Active' : 'Inactive' }}
              </span>
            </span>
            <span class="actions">
              <button class="action-btn" (click)="toggleStatus(store)" [title]="(store.is_active || store.isActive) ? 'Deactivate' : 'Activate'">
                <svg *ngIf="store.is_active || store.isActive" viewBox="0 0 20 20" fill="currentColor"><path d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"/></svg>
                <svg *ngIf="!(store.is_active || store.isActive)" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              </button>
              <button class="action-btn reset" (click)="promptResetPassword(store)" title="Reset Password">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div *ngIf="resetStore" class="modal-overlay" (click)="resetStore = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Reset Password</h3>
          <p>Set a new password for <strong>{{ resetStore.name }}</strong></p>
          <div class="field">
            <label>New Password</label>
            <input type="text" [(ngModel)]="newPassword" placeholder="Min 6 characters" />
          </div>
          <div *ngIf="resetError" class="error-banner">{{ resetError }}</div>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="resetStore = null">Cancel</button>
            <button class="btn-primary" (click)="doResetPassword()" [disabled]="resetting">
              {{ resetting ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1100px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-header h1 { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.5px; }
    .page-header p { color: #64748b; font-size: 14px; margin: 0; }

    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; background: #0f172a; color: white;
      border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-primary svg { width: 18px; height: 18px; }
    .btn-primary:hover:not(:disabled) { background: #1e293b; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-secondary {
      padding: 10px 20px; background: white; color: #374151;
      border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-secondary:hover { border-color: #94a3b8; }

    .form-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .form-card h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 20px; }

    .fields-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 600; color: #374151; }
    .req { color: #ef4444; }
    .opt { color: #94a3b8; font-weight: 400; }
    input {
      padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 14px; color: #0f172a; background: #f8fafc;
      transition: all 0.2s; font-family: inherit;
    }
    input:focus { outline: none; border-color: #0f172a; background: white; box-shadow: 0 0 0 3px rgba(15,23,42,0.08); }
    .has-error input { border-color: #ef4444; }
    .error-text { font-size: 12px; color: #ef4444; }

    .error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #dc2626; margin-top: 12px; }
    .success-banner { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #059669; margin-top: 12px; }
    .form-actions { display: flex; justify-content: flex-end; margin-top: 20px; }

    .loading-wrap { display: flex; justify-content: center; padding: 60px; }
    .loading-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #0f172a; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #94a3b8; gap: 10px; }
    .empty-state svg { width: 40px; height: 40px; }
    .empty-state p { font-size: 14px; margin: 0; }

    .table-head {
      display: grid; grid-template-columns: 200px 90px 120px 160px 120px 100px 80px 100px;
      padding: 10px 20px; background: #f8fafc;
      font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .table-row {
      display: grid; grid-template-columns: 200px 90px 120px 160px 120px 100px 80px 100px;
      padding: 13px 20px; align-items: center;
      border-top: 1px solid #f1f5f9; font-size: 13px; color: #374151;
    }
    .table-row:hover { background: #fafbfc; }

    .store-name-cell { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #0f172a; }
    .store-avatar {
      width: 28px; height: 28px; background: #0f172a; color: white;
      border-radius: 6px; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 12px; flex-shrink: 0;
    }
    .code-tag { font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; }
    .username { font-size: 13px; color: #374151; }
    .meta { font-size: 12px; color: #64748b; }

    .pill { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
    .pill-green { background: #ecfdf5; color: #059669; }
    .pill-gray { background: #f1f5f9; color: #64748b; }

    .actions { display: flex; gap: 6px; }
    .action-btn {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      border: 1px solid #e2e8f0; border-radius: 8px; background: white;
      cursor: pointer; color: #64748b; transition: all 0.15s;
    }
    .action-btn svg { width: 15px; height: 15px; }
    .action-btn:hover { border-color: #94a3b8; color: #374151; }
    .action-btn.reset:hover { border-color: #f59e0b; color: #b45309; background: #fffbeb; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: white; border-radius: 16px; padding: 28px;
      width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .modal h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
    .modal p { font-size: 14px; color: #64748b; margin: 0 0 20px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }

    .spinner-row { display: flex; align-items: center; gap: 8px; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
  `]
})
export class StoresComponent implements OnInit {
  stores: Store[] = [];
  loading = true;
  showForm = false;
  submitted = false;
  saving = false;
  formError = '';
  formSuccess = '';
  resetStore: Store | null = null;
  newPassword = '';
  resetting = false;
  resetError = '';

  form: Partial<RegisterStoreRequest> = {};

  constructor(private storesService: StoresService) {}

  ngOnInit() { this.loadStores(); }

  loadStores() {
    this.loading = true;
    this.storesService.getAllStores().subscribe({
      next: (s) => { this.stores = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  registerStore() {
    this.submitted = true;
    this.formError = '';
    this.formSuccess = '';

    if (!this.form.name || !this.form.storeCode || !this.form.username || !this.form.password) {
      this.formError = 'Please fill in all required fields';
      return;
    }

    this.saving = true;
    this.storesService.registerStore(this.form as RegisterStoreRequest).subscribe({
      next: (res) => {
        this.saving = false;
        this.formSuccess = `Store "${res.store.name}" registered successfully! Username: ${res.store.username}`;
        this.form = {};
        this.submitted = false;
        this.loadStores();
        setTimeout(() => { this.showForm = false; this.formSuccess = ''; }, 3000);
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Failed to register store';
      }
    });
  }

  toggleStatus(store: Store) {
    this.storesService.toggleStatus(store.id).subscribe({
      next: (res) => { store.isActive = res.store.is_active ?? res.store.isActive; this.loadStores(); }
    });
  }

  promptResetPassword(store: Store) {
    this.resetStore = store;
    this.newPassword = '';
    this.resetError = '';
  }

  doResetPassword() {
    this.resetError = '';
    if (!this.newPassword || this.newPassword.length < 6) {
      this.resetError = 'Password must be at least 6 characters';
      return;
    }
    this.resetting = true;
    this.storesService.resetPassword(this.resetStore!.id, this.newPassword).subscribe({
      next: () => { this.resetting = false; this.resetStore = null; },
      error: (err) => { this.resetting = false; this.resetError = err.error?.message || 'Failed to reset password'; }
    });
  }
}
