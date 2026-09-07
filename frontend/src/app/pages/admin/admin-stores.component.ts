import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-stores',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Manage Stores &amp; Users</h1><p>{{ stores.length }} accounts registered</p></div>
        <button class="btn-primary" (click)="showForm=!showForm">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
          {{ showForm ? 'Cancel' : 'Add Account' }}
        </button>
      </div>

      <!-- Register Form -->
      <div class="form-card" *ngIf="showForm">
        <h3>Register New Account</h3>
        <div class="form-grid">
          <div class="field"><label>Account Name *</label><input [(ngModel)]="form.name" placeholder="e.g. KK West Croydon or Production Admin" /></div>
          <div class="field"><label>Account Code *</label><input [(ngModel)]="form.storeCode" placeholder="e.g. KKWC or ADMIN2" style="text-transform:uppercase" /></div>
          <div class="field"><label>Username *</label><input [(ngModel)]="form.username" placeholder="login username" /></div>
          <div class="field"><label>Password *</label><input [(ngModel)]="form.password" placeholder="initial password" /></div>
          <div class="field"><label>Email</label><input [(ngModel)]="form.email" placeholder="account email" type="email" /></div>
          <div class="field"><label>Phone</label><input [(ngModel)]="form.phone" placeholder="phone number" /></div>
          <div class="field full"><label>Address</label><input [(ngModel)]="form.address" placeholder="account or store address" /></div>
          <div class="field">
            <label>Account Type</label>
            <select [(ngModel)]="form.accountType">
              <option value="retail">Retail Store</option>
              <option value="factory">Factory</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>
        <div class="error-msg" *ngIf="formError">{{ formError }}</div>
        <div class="success-msg" *ngIf="formSuccess">{{ formSuccess }}</div>
        <button class="btn-primary" (click)="registerStore()" [disabled]="formLoading">
          {{ formLoading ? 'Registering...' : 'Register Account' }}
        </button>
      </div>

      <!-- Reset Password Modal -->
      <div class="modal-overlay" *ngIf="resetTarget" (click)="resetTarget=null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Reset Password</h3>
          <p>Resetting password for <strong>{{ resetTarget.name }}</strong></p>
          <div class="field"><label>New Password</label><input [(ngModel)]="resetPassword" placeholder="new password" /></div>
          <div class="error-msg" *ngIf="resetError">{{ resetError }}</div>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="resetTarget=null">Cancel</button>
            <button class="btn-primary" (click)="doReset()" [disabled]="resetLoading">{{ resetLoading ? 'Saving...' : 'Save Password' }}</button>
          </div>
        </div>
      </div>

      <!-- Stores Table -->
      <div class="table-card">
        <div *ngIf="loading" class="loading-wrap"><div class="spinner"></div></div>
        <div *ngIf="!loading && stores.length === 0" class="empty">No stores registered yet.</div>
        <div *ngIf="!loading && stores.length > 0">
          <div class="table-head">
            <span>Account</span><span>Account Code</span><span>Username</span><span>Type</span><span>Status</span><span>Created</span><span>Actions</span>
          </div>
          <div class="table-row" *ngFor="let s of stores">
            <span class="store-name">{{ s.name }}</span>
            <span class="code-tag">{{ s.store_code }}</span>
            <span class="mono">{{ s.username }}</span>
            <span>
              <span class="type-badge" [class.admin]="s.is_admin" [class.factory]="s.is_factory && !s.is_admin" [class.retail]="!s.is_factory && !s.is_admin">
                {{ s.is_admin ? 'Admin' : s.is_factory ? 'Factory' : 'Retail' }}
              </span>
            </span>
            <span>
              <span class="status-pill" [class.active]="s.is_active" [class.inactive]="!s.is_active">
                {{ s.is_active ? 'Active' : 'Inactive' }}
              </span>
            </span>
            <span class="date-text">{{ s.created_at | date:'d MMM y' }}</span>
            <span class="actions">
              <button class="act-btn reset" (click)="openReset(s)" title="Reset Password">🔑</button>
              <button class="act-btn toggle" (click)="toggleStore(s)" [disabled]="s.is_admin" [title]="s.is_active?'Deactivate':'Activate'">
                {{ s.is_active ? '🔒' : '🔓' }}
              </button>
              <button class="act-btn delete" (click)="confirmDelete(s)" [disabled]="s.is_admin||s.is_factory" title="Delete">🗑</button>
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:32px; max-width:1100px; }
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
    .page-header h1 { font-size:26px; font-weight:700; color:#0f172a; margin:0 0 4px; }
    .page-header p { color:#64748b; font-size:14px; margin:0; }
    .btn-primary { display:flex; align-items:center; gap:8px; padding:10px 18px; background:#7c3aed; color:white; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; }
    .btn-primary svg { width:18px; height:18px; }
    .btn-primary:hover { background:#6d28d9; }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
    .btn-secondary { padding:9px 16px; border:1.5px solid #e2e8f0; border-radius:10px; background:white; color:#374151; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }

    .form-card { background:white; border:1px solid #e2e8f0; border-radius:16px; padding:24px; margin-bottom:24px; }
    .form-card h3 { font-size:16px; font-weight:700; color:#0f172a; margin:0 0 20px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    .field { display:flex; flex-direction:column; gap:6px; }
    .field.full { grid-column:1/-1; }
    label { font-size:13px; font-weight:600; color:#374151; }
    input, select { padding:10px 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:14px; font-family:inherit; outline:none; color:#0f172a; transition:border 0.15s; }
    input:focus, select:focus { border-color:#7c3aed; }
    .error-msg { color:#dc2626; font-size:13px; margin-bottom:12px; }
    .success-msg { color:#059669; font-size:13px; margin-bottom:12px; }

    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:white; border-radius:16px; padding:28px; width:400px; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
    .modal h3 { font-size:18px; font-weight:700; color:#0f172a; margin:0 0 8px; }
    .modal p { color:#64748b; font-size:14px; margin:0 0 20px; }
    .modal .field { margin-bottom:16px; }
    .modal-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:20px; }

    .table-card { background:white; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; }
    .loading-wrap { display:flex; justify-content:center; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#7c3aed; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty { text-align:center; padding:60px; color:#94a3b8; font-size:14px; }

    .table-head { display:grid; grid-template-columns:1fr 80px 130px 80px 80px 90px 110px; padding:10px 20px; background:#f8fafc; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; }
    .table-row { display:grid; grid-template-columns:1fr 80px 130px 80px 80px 90px 110px; padding:14px 20px; align-items:center; border-top:1px solid #f1f5f9; font-size:13px; color:#374151; transition:background 0.1s; }
    .table-row:hover { background:#fafbfc; }
    .store-name { font-weight:600; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .code-tag { font-size:12px; background:#f1f5f9; padding:3px 8px; border-radius:6px; font-weight:600; white-space:nowrap; }
    .mono { font-family:monospace; font-size:12px; color:#2563eb; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .date-text { font-size:12px; color:#94a3b8; white-space:nowrap; }

    .type-badge { font-size:11px; font-weight:700; padding:3px 8px; border-radius:20px; }
    .type-badge.admin { background:#f5f3ff; color:#7c3aed; }
    .type-badge.factory { background:#fffbeb; color:#b45309; }
    .type-badge.retail { background:#eff6ff; color:#2563eb; }

    .status-pill { font-size:11px; font-weight:600; padding:3px 8px; border-radius:20px; }
    .status-pill.active { background:#ecfdf5; color:#059669; }
    .status-pill.inactive { background:#fef2f2; color:#dc2626; }

    .actions { display:flex; gap:6px; }
    .act-btn { background:none; border:1px solid #e2e8f0; border-radius:6px; padding:5px 8px; cursor:pointer; font-size:14px; transition:all 0.15s; }
    .act-btn:hover:not(:disabled) { background:#f1f5f9; }
    .act-btn:disabled { opacity:0.3; cursor:not-allowed; }
    .act-btn.delete:hover:not(:disabled) { background:#fef2f2; border-color:#fca5a5; }
  `]
})
export class AdminStoresComponent implements OnInit {
  stores: any[] = [];
  loading = true;
  showForm = false;
  formLoading = false;
  formError = '';
  formSuccess = '';
  resetTarget: any = null;
  resetPassword = '';
  resetError = '';
  resetLoading = false;

  form = { name: '', storeCode: '', username: '', password: '', email: '', phone: '', address: '', accountType: 'retail' };

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.loadStores(); }

  loadStores() {
    this.loading = true;
    this.adminService.getAllStores().subscribe({ next: s => { this.stores = s; this.loading = false; }, error: () => this.loading = false });
  }

  registerStore() {
    this.formError = ''; this.formSuccess = '';
    if (!this.form.name || !this.form.storeCode || !this.form.username || !this.form.password) { this.formError = 'All required fields must be filled'; return; }
    this.formLoading = true;
    this.adminService.registerStore(this.form).subscribe({
      next: () => { this.formSuccess = 'Account registered successfully!'; this.form = { name:'',storeCode:'',username:'',password:'',email:'',phone:'',address:'',accountType:'retail' }; this.loadStores(); this.formLoading = false; },
      error: (e) => { this.formError = e.error?.message || 'Failed to register'; this.formLoading = false; }
    });
  }

  toggleStore(store: any) {
    if (store.is_admin) return;
    this.adminService.toggleStore(store.id).subscribe({ next: () => this.loadStores(), error: () => {} });
  }

  confirmDelete(store: any) {
    if (store.is_admin || store.is_factory) return;
    if (confirm(`Delete "${store.name}"? This cannot be undone.`)) {
      this.adminService.deleteStore(store.id).subscribe({ next: () => this.loadStores(), error: (e) => alert(e.error?.message || 'Failed to delete') });
    }
  }

  openReset(store: any) { this.resetTarget = store; this.resetPassword = ''; this.resetError = ''; }

  doReset() {
    this.resetError = '';
    if (!this.resetPassword || this.resetPassword.length < 4) { this.resetError = 'Min 4 characters'; return; }
    this.resetLoading = true;
    this.adminService.resetPassword(this.resetTarget.id, this.resetPassword).subscribe({
      next: () => { this.resetTarget = null; this.resetLoading = false; alert('Password reset successfully'); },
      error: (e) => { this.resetError = e.error?.message || 'Failed'; this.resetLoading = false; }
    });
  }
}
