// pages/login/login.component.ts
import { Component, OnInit } from '@angular/core';
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
      <div class="login-bg">
        <div class="bg-circle c1"></div>
        <div class="bg-circle c2"></div>
        <div class="bg-circle c3"></div>
      </div>

      <div class="login-container">
        <div class="login-card">
          <div class="brand">
            <div class="brand-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#2563eb"/>
                <path d="M8 10h16M8 16h10M8 22h13" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <h1>OrderFlow</h1>
              <p>Retail Order Management</p>
            </div>
          </div>

          <h2>Welcome back</h2>
          <p class="subtitle">Sign in to your store account</p>

          <form (ngSubmit)="onLogin()" class="login-form">
            <div class="field-group" [class.error]="fieldError('username')">
              <label>Username</label>
              <div class="input-wrap">
                <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
                <input
                  type="text"
                  [(ngModel)]="username"
                  name="username"
                  placeholder="Enter your username"
                  autocomplete="username"
                  [disabled]="loading"
                />
              </div>
            </div>

            <div class="field-group" [class.error]="fieldError('password')">
              <label>Password</label>
              <div class="input-wrap">
                <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                </svg>
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  [disabled]="loading"
                />
                <button type="button" class="eye-btn" (click)="showPassword = !showPassword">
                  <svg *ngIf="!showPassword" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                  </svg>
                  <svg *ngIf="showPassword" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="error-msg" *ngIf="error">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ error }}
            </div>

            <button type="submit" class="btn-login" [disabled]="loading">
              <span *ngIf="!loading">Sign In</span>
              <span *ngIf="loading" class="spinner-wrap">
                <span class="spinner"></span>
                Signing in...
              </span>
            </button>
          </form>

          <div class="login-footer">
            <p>Contact your factory administrator for access</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: #f0f4ff;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      font-family: 'DM Sans', system-ui, sans-serif;
    }

    .login-bg { position: absolute; inset: 0; pointer-events: none; }
    .bg-circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.08;
    }
    .c1 { width: 600px; height: 600px; background: #2563eb; top: -200px; right: -100px; }
    .c2 { width: 400px; height: 400px; background: #3b82f6; bottom: -100px; left: -100px; }
    .c3 { width: 200px; height: 200px; background: #1d4ed8; top: 40%; left: 20%; }

    .login-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(37, 99, 235, 0.12), 0 4px 16px rgba(0,0,0,0.06);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }
    .brand-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .brand h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand p {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }

    h2 {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #64748b;
      font-size: 14px;
      margin: 0 0 28px;
    }

    .field-group { margin-bottom: 18px; }
    .field-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }
    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 12px;
      width: 18px;
      height: 18px;
      color: #94a3b8;
    }
    input {
      width: 100%;
      padding: 11px 44px 11px 40px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 14px;
      color: #0f172a;
      background: #f8fafc;
      transition: all 0.2s;
      box-sizing: border-box;
      font-family: inherit;
    }
    input:focus {
      outline: none;
      border-color: #2563eb;
      background: white;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    input:disabled { opacity: 0.6; }
    .field-group.error input { border-color: #ef4444; }

    .eye-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #94a3b8;
      display: flex;
    }
    .eye-btn svg { width: 16px; height: 16px; }
    .eye-btn:hover { color: #64748b; }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #dc2626;
      margin-bottom: 16px;
    }
    .error-msg svg { width: 16px; height: 16px; flex-shrink: 0; }

    .btn-login {
      width: 100%;
      padding: 13px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .btn-login:hover:not(:disabled) {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
    }
    .btn-login:active:not(:disabled) { transform: translateY(0); }
    .btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

    .spinner-wrap { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .login-footer {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
    }
    .login-footer p { font-size: 12px; color: #94a3b8; margin: 0; }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.authService.isLoggedIn) {
      this.redirect();
    }
  }

  fieldError(field: string): boolean {
    return !!this.error && (field === 'username' ? !this.username : !this.password);
  }

  onLogin() {
    this.error = '';
    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Please enter your username and password';
      return;
    }

    this.loading = true;
    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => this.redirect(),
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed. Please try again.';
      },
    });
  }

  private redirect() {
    if (this.authService.isFactory) {
      this.router.navigate(['/factory/dashboard']);
    } else {
      this.router.navigate(['/retail/dashboard']);
    }
  }
}
