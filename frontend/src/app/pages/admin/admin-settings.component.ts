import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Email Settings</h1><p>Toggle email notifications on or off</p></div>
      </div>

      <div *ngIf="loading" class="loading-wrap"><div class="spinner"></div></div>
      <div *ngIf="error" class="error-box">{{ error }}</div>

      <div *ngIf="!loading" class="settings-grid">

        <div class="setting-card">
          <div class="setting-info">
            <div class="setting-icon new-order">📨</div>
            <div>
              <div class="setting-title">New Order Email</div>
              <div class="setting-desc">Send email to factory when a new order is placed by a retail store</div>
            </div>
          </div>
          <div class="toggle-wrap">
            <span class="toggle-label" [class.on]="getVal('email_new_order_enabled')">{{ getVal('email_new_order_enabled') ? 'ON' : 'OFF' }}</span>
            <button class="toggle" [disabled]="saving['email_new_order_enabled']" [class.active]="getVal('email_new_order_enabled')" (click)="toggle('email_new_order_enabled')">
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>

        <div class="setting-card">
          <div class="setting-info">
            <div class="setting-icon updated">✏️</div>
            <div>
              <div class="setting-title">Order Updated Email</div>
              <div class="setting-desc">Send email to factory when a retail store edits an existing order</div>
            </div>
          </div>
          <div class="toggle-wrap">
            <span class="toggle-label" [class.on]="getVal('email_order_updated_enabled')">{{ getVal('email_order_updated_enabled') ? 'ON' : 'OFF' }}</span>
            <button class="toggle" [disabled]="saving['email_order_updated_enabled']" [class.active]="getVal('email_order_updated_enabled')" (click)="toggle('email_order_updated_enabled')">
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>

        <div class="setting-card">
          <div class="setting-info">
            <div class="setting-icon customer">📬</div>
            <div>
              <div class="setting-title">Customer Ready Email</div>
              <div class="setting-desc">Send email to customer when retail clicks "Order Received" to notify their order is ready</div>
            </div>
          </div>
          <div class="toggle-wrap">
            <span class="toggle-label" [class.on]="getVal('email_customer_ready_enabled')">{{ getVal('email_customer_ready_enabled') ? 'ON' : 'OFF' }}</span>
            <button class="toggle" [disabled]="saving['email_customer_ready_enabled']" [class.active]="getVal('email_customer_ready_enabled')" (click)="toggle('email_customer_ready_enabled')">
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>

      </div>

      <div class="info-box" *ngIf="!loading">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
        <div>
          <strong>Note:</strong> Turning off emails is useful when you're hitting free SMTP limits.
          Orders will still be saved normally — only the email notification is suppressed.
          Customer emails only send if the customer has an email address on their order.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:32px; max-width:800px; }
    .page-header { margin-bottom:28px; }
    .page-header h1 { font-size:26px; font-weight:700; color:#0f172a; margin:0 0 4px; }
    .page-header p { color:#64748b; font-size:14px; margin:0; }
    .loading-wrap { display:flex; justify-content:center; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#7c3aed; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .settings-grid { display:flex; flex-direction:column; gap:16px; margin-bottom:24px; }
    .setting-card { background:white; border:1px solid #e2e8f0; border-radius:16px; padding:24px; display:flex; align-items:center; justify-content:space-between; gap:20px; transition:box-shadow 0.2s; }
    .setting-card:hover { box-shadow:0 2px 8px rgba(0,0,0,0.06); }
    .setting-info { display:flex; align-items:center; gap:16px; flex:1; }
    .setting-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
    .setting-icon.new-order { background:#eff6ff; }
    .setting-icon.updated { background:#fffbeb; }
    .setting-icon.customer { background:#ecfdf5; }
    .setting-title { font-size:15px; font-weight:700; color:#0f172a; margin-bottom:4px; }
    .setting-desc { font-size:13px; color:#64748b; line-height:1.5; }

    .toggle-wrap { display:flex; align-items:center; gap:12px; flex-shrink:0; }
    .toggle-label { font-size:12px; font-weight:700; color:#94a3b8; min-width:28px; }
    .toggle-label.on { color:#059669; }
    .toggle { width:52px; height:28px; border-radius:14px; border:none; background:#e2e8f0; cursor:pointer; position:relative; transition:background 0.2s; padding:0; }
    .toggle.active { background:#7c3aed; }
    .toggle:disabled { cursor:wait; opacity:0.65; }
    .toggle-knob { position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:white; transition:transform 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2); display:block; }
    .toggle.active .toggle-knob { transform:translateX(24px); }

    .info-box { display:flex; gap:12px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:16px 20px; font-size:13px; color:#0369a1; line-height:1.6; }
    .info-box svg { width:18px; height:18px; flex-shrink:0; margin-top:1px; }
    .error-box { margin-bottom:16px; padding:12px 16px; border:1px solid #fecaca; border-radius:10px; background:#fef2f2; color:#b91c1c; font-size:13px; }
  `]
})
export class AdminSettingsComponent implements OnInit {
  settings: any = {};
  saving: Record<string, boolean> = {};
  error = '';
  loading = true;
  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getSettings().subscribe({ next: s => { this.settings = s; this.loading = false; }, error: () => this.loading = false });
  }

  getVal(key: string): boolean { return this.settings[key]?.value === 'true'; }

  toggle(key: string) {
    if (this.saving[key]) return;
    this.error = '';
    const oldVal = this.getVal(key) ? 'true' : 'false';
    const newVal = this.getVal(key) ? 'false' : 'true';
    this.settings[key] = { ...this.settings[key], value: newVal };
    this.saving[key] = true;
    this.adminService.updateSetting(key, newVal).subscribe({
      next: response => {
        this.settings[key] = { ...this.settings[key], value: response.value, updated_at: response.updated_at };
        this.saving[key] = false;
      },
      error: response => {
        this.settings[key] = { ...this.settings[key], value: oldVal };
        this.error = response.error?.message || 'Could not save the email setting.';
        this.saving[key] = false;
      },
    });
  }
}
