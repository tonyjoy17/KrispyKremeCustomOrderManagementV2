// pages/factory/factory-layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-factory-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#0f172a"/>
              <path d="M6 22l4-8 4 4 4-6 4 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <span class="brand-name">OrderFlow</span>
            <span class="brand-tag">{{ isAdmin ? 'Admin' : 'Factory' }}</span>
          </div>
        </div>

        <div class="store-badge">
          <div class="store-avatar">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
          </div>
          <div>
            <div class="store-name">{{ userName }}</div>
            <div class="store-code">{{ isAdmin ? 'System Administrator' : 'Factory' }}</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/factory/dashboard" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
            Dashboard
          </a>
          <a routerLink="/factory/orders" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clip-rule="evenodd"/>
            </svg>
            All Orders
          </a>
          <a *ngIf="isAdmin" routerLink="/factory/new-order" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
            Create Order
          </a>
          <a routerLink="/factory/stores" routerLinkActive="active" class="nav-item">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/>
            </svg>
            Manage Stores
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex; min-height: 100vh; background: #f8fafc;
      font-family: 'DM Sans', system-ui, sans-serif;
    }
    .sidebar {
      width: 240px; background: #0f172a;
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; height: 100vh; z-index: 100;
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .brand-icon { width: 36px; height: 36px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
    .brand-name { display: block; font-size: 16px; font-weight: 700; color: white; letter-spacing: -0.3px; }
    .brand-tag { display: block; font-size: 11px; color: #f59e0b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

    .store-badge {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; background: rgba(255,255,255,0.06); margin: 12px;
      border-radius: 10px;
    }
    .store-avatar {
      width: 36px; height: 36px; background: rgba(245,158,11,0.2);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      color: #f59e0b; flex-shrink: 0;
    }
    .store-avatar svg { width: 18px; height: 18px; }
    .store-name { font-size: 13px; font-weight: 600; color: white; }
    .store-code { font-size: 11px; color: #64748b; }

    .sidebar-nav { padding: 8px 12px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      border-radius: 8px; text-decoration: none; color: #94a3b8;
      font-size: 14px; font-weight: 500; transition: all 0.15s;
    }
    .nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
    .nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
    .nav-item.active { background: rgba(245,158,11,0.15); color: #f59e0b; font-weight: 600; }

    .sidebar-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .logout-btn {
      width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      border: none; border-radius: 8px; background: none; color: #64748b;
      font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.15s;
    }
    .logout-btn svg { width: 18px; height: 18px; }
    .logout-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

    .main-content { flex: 1; margin-left: 240px; min-height: 100vh; overflow-y: auto; }
  `]
})
export class FactoryLayoutComponent {
  constructor(private authService: AuthService) {}
  get isAdmin(): boolean { return this.authService.isAdmin; }
  get userName(): string { return this.authService.currentUser?.storeName || 'Factory / Production'; }
  logout() { this.authService.logout(); }
}
