import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoresService } from '../../../services/stores.service';
import { Store } from '../../../models';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Stores</h1>
          <p>{{ stores.length }} retail stores registered</p>
        </div>
      </div>

      <div *ngIf="loading" class="loading-wrap"><div class="loading-spinner"></div></div>

      <div *ngIf="!loading && stores.length === 0" class="empty-state">
        <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="24" fill="#f1f5f9"/>
          <path d="M16 18h16M16 24h10M16 30h13" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>No stores registered yet. Ask your admin to add stores.</p>
      </div>

      <div *ngIf="!loading && stores.length > 0" class="table-card">
        <div class="table-head">
          <span>Store</span><span>Code</span><span>Username</span><span>Contact</span><span>Status</span><span>Created</span>
        </div>
        <div class="table-row" *ngFor="let s of stores">
          <span class="store-name-cell">
            <span class="store-avatar">{{ s.name[0] }}</span>
            {{ s.name }}
          </span>
          <span class="code-tag">{{ s.store_code || s.storeCode }}</span>
          <span class="username">{{ s.username }}</span>
          <span class="meta">{{ s.email || s.phone || '—' }}</span>
          <span>
            <span class="pill" [class.pill-green]="s.is_active" [class.pill-gray]="!s.is_active">
              {{ s.is_active ? 'Active' : 'Inactive' }}
            </span>
          </span>
          <span class="meta">{{ (s.created_at || s.createdAt) | date:'d MMM y' }}</span>
        </div>
      </div>

      <div class="admin-note">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
        Store registration and password management is handled by the Master Admin.
      </div>
    </div>
  `,
  styles: [`
    .page { padding:32px; max-width:900px; font-family:'DM Sans',system-ui,sans-serif; }
    .page-header { margin-bottom:24px; }
    .page-header h1 { font-size:26px; font-weight:700; color:#0f172a; margin:0 0 4px; }
    .page-header p { color:#64748b; font-size:14px; margin:0; }
    .loading-wrap { display:flex; justify-content:center; padding:60px; }
    .loading-spinner { width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#d97706; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty-state { display:flex; flex-direction:column; align-items:center; padding:60px; color:#94a3b8; gap:10px; }
    .empty-state p { font-size:14px; margin:0; text-align:center; }
    .table-card { background:white; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; margin-bottom:16px; }
    .table-head { display:grid; grid-template-columns:1fr 90px 120px 160px 90px 100px; padding:10px 20px; background:#f8fafc; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; }
    .table-row { display:grid; grid-template-columns:1fr 90px 120px 160px 90px 100px; padding:14px 20px; align-items:center; border-top:1px solid #f1f5f9; font-size:13px; color:#374151; }
    .table-row:hover { background:#fafbfc; }
    .store-name-cell { display:flex; align-items:center; gap:8px; font-weight:600; color:#0f172a; }
    .store-avatar { width:28px; height:28px; background:#d97706; color:white; border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; flex-shrink:0; }
    .code-tag { font-family:monospace; font-size:12px; background:#f1f5f9; padding:3px 8px; border-radius:6px; font-weight:600; }
    .username { font-size:13px; color:#374151; font-family:monospace; }
    .meta { font-size:12px; color:#64748b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .pill { font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px; }
    .pill-green { background:#ecfdf5; color:#059669; }
    .pill-gray { background:#f1f5f9; color:#64748b; }
    .admin-note { display:flex; align-items:center; gap:10px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:12px 16px; font-size:13px; color:#92400e; }
    .admin-note svg { width:18px; height:18px; flex-shrink:0; }
  `]
})
export class StoresComponent implements OnInit {
  stores: Store[] = [];
  loading = true;
  constructor(private storesService: StoresService) {}
  ngOnInit() { this.loadStores(); }
  loadStores() {
    this.loading = true;
    this.storesService.getAllStores().subscribe({
      next: s => { this.stores = s; this.loading = false; },
      error: () => this.loading = false
    });
  }
}