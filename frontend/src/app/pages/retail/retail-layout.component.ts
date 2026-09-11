import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-retail-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="assets/kk-logo.png" alt="Krispy Kreme" class="kk-logo" />
        </div>
        <div class="store-badge">
          <div class="store-avatar">{{ storeInitial }}</div>
          <div class="store-info">
            <div class="store-name">{{ storeName }}</div>
            <div class="store-code" *ngIf="storeCode !== storeName">{{ storeCode }}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/retail/dashboard" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
            Dashboard
          </a>
          <a routerLink="/retail/new-order" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
            New Order
          </a>
          <a routerLink="/retail/orders" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
            My Orders
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
    .store-badge { display:flex; align-items:center; gap:10px; padding:14px 20px; background:#fff5f5; margin:12px; border-radius:10px; }
    .store-avatar { width:36px; height:36px; background:#E4002B; color:white; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; flex-shrink:0; }
    .store-name { font-size:13px; font-weight:600; color:#0f172a; }
    .store-code { font-size:11px; color:#64748b; }
    .sidebar-nav { padding:8px 12px; flex:1; display:flex; flex-direction:column; gap:2px; }
    .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; text-decoration:none; color:#64748b; font-size:14px; font-weight:500; transition:all 0.15s; }
    .nav-item svg { width:18px; height:18px; flex-shrink:0; }
    .nav-item:hover { background:#f1f5f9; color:#0f172a; }
    .nav-item.active { background:#eff6ff; color:#2563eb; font-weight:600; }
    .sidebar-footer { padding:12px; border-top:1px solid #f1f5f9; }
    .logout-btn { width:100%; display:flex; align-items:center; gap:10px; padding:10px 12px; border:none; border-radius:8px; background:none; color:#64748b; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.15s; }
    .logout-btn svg { width:18px; height:18px; }
    .logout-btn:hover { background:#fef2f2; color:#dc2626; }
    .main-content { flex:1; margin-left:240px; min-height:100vh; overflow-y:auto; }
    @media print { .sidebar { display:none !important; } .main-content { margin-left:0 !important; } }
  `]
})
export class RetailLayoutComponent {
  constructor(private authService: AuthService) {}
  get storeName() { return this.authService.currentUser?.storeName || this.authService.currentUser?.storeCode || ''; }
  get storeCode() { return this.authService.currentUser?.storeCode || ''; }
  get storeInitial() { return (this.storeName || 'S')[0].toUpperCase(); }
  logout() { this.authService.logout(); }
}
