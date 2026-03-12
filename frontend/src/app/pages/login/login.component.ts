import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="brand">
          <img src="assets/kk-logo.png" alt="Krispy Kreme" class="kk-logo" />
        </div>
        <h2>Welcome back</h2>
        <p class="sub">Order Management Portal — Sign in to your account</p>
        <div class="error-box" *ngIf="error">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
          {{ error }}
        </div>
        <div class="field">
          <label>Username</label>
          <div class="input-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
            <input type="text" [(ngModel)]="username" placeholder="Enter username" [disabled]="loading" (keyup.enter)="login()" />
          </div>
        </div>
        <div class="field">
          <label>Password</label>
          <div class="input-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
            <input [type]="showPass?'text':'password'" [(ngModel)]="password" placeholder="Enter password" [disabled]="loading" (keyup.enter)="login()" />
            <button class="eye-btn" type="button" (click)="showPass=!showPass">
              <svg *ngIf="!showPass" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
              <svg *ngIf="showPass" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
            </button>
          </div>
        </div>
        <button class="login-btn" (click)="login()" [disabled]="loading">
          <span *ngIf="!loading">Sign In</span>
          <span *ngIf="loading" class="spinner"></span>
        </button>
        <p class="hint">Contact your factory administrator for access</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height:100vh; background:linear-gradient(135deg,#fff5f5 0%,#fff0f0 100%); display:flex; align-items:center; justify-content:center; padding:20px; font-family:'DM Sans',system-ui,sans-serif; }
    .login-card { background:white; border-radius:20px; padding:40px; width:100%; max-width:400px; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .brand { text-align:center; margin-bottom:28px; }
    .kk-logo { width:180px; height:auto; }
    h2 { font-size:22px; font-weight:700; color:#0f172a; margin:0 0 4px; }
    .sub { color:#64748b; font-size:14px; margin:0 0 24px; }
    .error-box { display:flex; align-items:center; gap:8px; background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:12px 14px; margin-bottom:16px; color:#dc2626; font-size:13px; font-weight:500; }
    .error-box svg { width:16px; height:16px; flex-shrink:0; }
    .field { margin-bottom:16px; }
    label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:6px; }
    .input-wrap { display:flex; align-items:center; gap:10px; border:1.5px solid #e2e8f0; border-radius:10px; padding:0 12px; transition:border 0.15s; }
    .input-wrap:focus-within { border-color:#2563eb; }
    .input-wrap svg { width:16px; height:16px; color:#94a3b8; flex-shrink:0; }
    .input-wrap input { flex:1; border:none; outline:none; padding:12px 0; font-size:14px; font-family:inherit; background:transparent; color:#0f172a; }
    .eye-btn { background:none; border:none; cursor:pointer; padding:4px; color:#94a3b8; display:flex; }
    .eye-btn svg { width:16px; height:16px; }
    .login-btn { width:100%; padding:13px; background:#2563eb; color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; margin-top:8px; transition:all 0.2s; display:flex; align-items:center; justify-content:center; min-height:48px; }
    .login-btn:hover:not(:disabled) { background:#1d4ed8; }
    .login-btn:disabled { opacity:0.7; cursor:not-allowed; }
    .spinner { width:20px; height:20px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .hint { text-align:center; color:#94a3b8; font-size:12px; margin:16px 0 0; }
  `]
})
export class LoginComponent {
  username = ''; password = ''; showPass = false; loading = false; error = '';
  constructor(private auth: AuthService, private router: Router) {}
  login() {
    if (!this.username || !this.password) { this.error = 'Enter username and password'; return; }
    this.loading = true; this.error = '';
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        if (res.store.isAdmin) this.router.navigate(['/admin']);
        else if (res.store.isFactory) this.router.navigate(['/factory']);
        else this.router.navigate(['/retail']);
      },
      error: (e) => { this.error = e.error?.message || 'Login failed'; this.loading = false; }
    });
  }
}