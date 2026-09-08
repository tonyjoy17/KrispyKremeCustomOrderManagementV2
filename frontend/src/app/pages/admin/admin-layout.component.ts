import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="assets/kk-logo.png" alt="Krispy Kreme" class="kk-logo" />
        </div>
        <div class="store-badge">
          <div class="store-avatar">A</div>
          <div>
            <div class="store-name">Administrator</div>
            <div class="store-code">Full Access</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/new-order" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 012 0v7h7a1 1 0 110 2h-7v7a1 1 0 11-2 0v-7H2a1 1 0 110-2h7V2z"/></svg>
            Create Order
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm2 4a1 1 0 000 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h5a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            All Orders
          </a>
          <a routerLink="/admin/stores" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
            Manage Stores &amp; Users
          </a>
          <a routerLink="/admin/settings" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
            Email Settings
          </a>
          <a routerLink="/admin/activity" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clip-rule="evenodd"/></svg>
            Activity Log
          </a>
          <a routerLink="/admin/change-password" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 8V6a5 5 0 0110 0v2a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2zm8-2v2H7V6a3 3 0 016 0zm-3 5a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            Change Password
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/></svg>
            Sign Out
          </button>
        </div>
      </aside>
      <main class="main-content"><router-outlet></router-outlet></main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; background:#f8fafc; font-family:'DM Sans',system-ui,sans-serif; }
    .sidebar { width:240px; background:white; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; position:fixed; top:0; left:0; height:100vh; z-index:100; }
    .sidebar-brand { display:flex; align-items:center; justify-content:center; padding:16px 20px; border-bottom:1px solid #f1f5f9; background:white; }
    .kk-logo { width:130px; height:auto; }
    .store-badge { display:flex; align-items:center; gap:10px; padding:14px 20px; background:#f5f3ff; margin:12px; border-radius:10px; }
    .store-avatar { width:36px; height:36px; background:#7c3aed; color:white; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; flex-shrink:0; }
    .store-name { font-size:13px; font-weight:600; color:#0f172a; }
    .store-code { font-size:11px; color:#64748b; }
    .sidebar-nav { padding:8px 12px; flex:1; display:flex; flex-direction:column; gap:2px; }
    .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; text-decoration:none; color:#64748b; font-size:14px; font-weight:500; transition:all 0.15s; }
    .nav-item svg { width:18px; height:18px; flex-shrink:0; }
    .nav-item:hover { background:#f1f5f9; color:#0f172a; }
    .nav-item.active { background:#f5f3ff; color:#7c3aed; font-weight:600; }
    .sidebar-footer { padding:12px; border-top:1px solid #f1f5f9; }
    .logout-btn { width:100%; display:flex; align-items:center; gap:10px; padding:10px 12px; border:none; border-radius:8px; background:none; color:#64748b; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.15s; }
    .logout-btn svg { width:18px; height:18px; }
    .logout-btn:hover { background:#fef2f2; color:#dc2626; }
    .main-content { flex:1; margin-left:240px; min-height:100vh; overflow-y:auto; }
    @media print { .sidebar { display:none !important; } .main-content { margin-left:0 !important; } }
  `]
})
export class AdminLayoutComponent {
  constructor(private authService: AuthService) {}
  logout() { this.authService.logout(); }
}
