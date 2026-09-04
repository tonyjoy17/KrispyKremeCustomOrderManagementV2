// pages/retail/new-order/new-order.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrdersService } from '../../../services/orders.service';
import { StoresService } from '../../../services/stores.service';
import { AuthService } from '../../../services/auth.service';
import { CreateOrderRequest } from '../../../models';

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>New Order</h1>
          <p>Fill in the customer order details below</p>
        </div>
      </div>

      <!-- Success State -->
      <div *ngIf="success" class="success-card">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <h3>Order Submitted Successfully!</h3>
          <p>Order <strong>{{ lastOrderNumber }}</strong> has been created and email notification sent to factory.</p>
        </div>
        <div class="success-actions">
          <button class="btn-secondary" (click)="resetForm()">New Order</button>
          <button class="btn-primary" (click)="goDashboard()">Dashboard</button>
        </div>
      </div>

      <!-- Order Form -->
      <div *ngIf="!success" class="form-card">
        <form (ngSubmit)="submitOrder()">

          <!-- Customer Section -->
          <div class="form-section">
            <div class="section-title">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
              Customer Information
            </div>

            <div class="fields-grid">
              <div class="field" [class.has-error]="submitted && !form.customerName">
                <label>Customer Name <span class="req">*</span></label>
                <input type="text" [(ngModel)]="form.customerName" name="customerName"
                  placeholder="Full name" [disabled]="loading" />
                <span class="error-text" *ngIf="submitted && !form.customerName">Required</span>
              </div>

              <div class="field" [class.has-error]="submitted && !form.customerPhone">
                <label>Customer Phone <span class="req">*</span></label>
                <input type="tel" [(ngModel)]="form.customerPhone" name="customerPhone"
                  placeholder="Phone number" [disabled]="loading" />
                <span class="error-text" *ngIf="submitted && !form.customerPhone">Required</span>
              </div>

              <div class="field">
                <label>Customer Email <span class="opt">(optional)</span></label>
                <input type="email" [(ngModel)]="form.customerEmail" name="customerEmail"
                  placeholder="email@example.com" [disabled]="loading" />
              </div>
            </div>
          </div>

          <!-- Order Section -->
          <div class="form-section">
            <div class="section-title">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
              Order Details
            </div>

            <div class="field" [class.has-error]="submitted && !form.orderDetails">
              <label>Order Details <span class="req">*</span></label>
              <textarea [(ngModel)]="form.orderDetails" name="orderDetails"
                rows="5" placeholder="Describe the order in detail..." [disabled]="loading"></textarea>
              <span class="error-text" *ngIf="submitted && !form.orderDetails">Required</span>
            </div>

            <div class="fields-grid two-col">
              <div *ngIf="isAdmin" class="field" [class.has-error]="submitted && !form.orderingStoreId">
                <label>Ordering Store <span class="req">*</span></label>
                <select [(ngModel)]="form.orderingStoreId" name="orderingStoreId" [disabled]="loading">
                  <option value="">Select retail store...</option>
                  <option *ngFor="let s of stores" [value]="s.id">{{ s.name }}</option>
                </select>
                <span class="error-text" *ngIf="submitted && !form.orderingStoreId">Required</span>
              </div>

              <div class="field" [class.has-error]="submitted && !validTotalDozen">
                <label>Total Dozen <span class="req">*</span></label>
                <input type="number" [(ngModel)]="form.totalDozen" name="totalDozen"
                  min="1" step="1" inputmode="numeric" placeholder="e.g. 12" [disabled]="loading" />
                <span class="error-text" *ngIf="submitted && !validTotalDozen">Enter a whole number greater than 0</span>
              </div>

              <div class="field" [class.has-error]="submitted && !form.pickupStoreId">
                <label>Pickup Store <span class="req">*</span></label>
                <select [(ngModel)]="form.pickupStoreId" name="pickupStoreId" [disabled]="loading || !stores.length">
                  <option value="">Select pickup store...</option>
                  <option *ngFor="let s of stores" [value]="s.id">{{ s.name }}</option>
                </select>
                <span class="error-text" *ngIf="submitted && !form.pickupStoreId">Required</span>
              </div>

              <div class="field" [class.has-error]="submitted && !form.pickupDate">
                <label>Pickup Date <span class="req">*</span></label>
                <input type="date" [(ngModel)]="form.pickupDate" name="pickupDate"
                  [min]="minDate" [disabled]="loading" />
                <span class="error-text" *ngIf="submitted && !form.pickupDate">Required</span>
              </div>
            </div>

            <!-- Payment -->
            <div class="field">
              <label>Payment Status <span class="req">*</span></label>
              <div class="payment-toggle">
                <button type="button" class="pay-btn" [class.active-paid]="form.isPaid === true"
                  (click)="form.isPaid = true" [disabled]="loading">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                  Paid
                </button>
                <button type="button" class="pay-btn" [class.active-unpaid]="form.isPaid === false"
                  (click)="form.isPaid = false" [disabled]="loading">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                  Not Paid
                </button>
              </div>
            </div>

            <!-- Reference Image -->
            <div class="field">
              <label>Reference Image <span class="opt">(optional)</span></label>
              <div class="upload-zone" [class.has-file]="imageFile" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
                <input #fileInput type="file" accept="image/*" (change)="onFileSelect($event)" style="display:none" />
                <div *ngIf="!imageFile" class="upload-placeholder">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>
                  <span>Click or drag image here</span>
                  <small>PNG, JPG, GIF up to 5MB</small>
                </div>
                <div *ngIf="imageFile" class="file-preview">
                  <img [src]="imagePreview" alt="Preview" />
                  <div class="file-info">
                    <span>{{ imageFile.name }}</span>
                    <button type="button" class="remove-btn" (click)="removeImage($event)">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="error" class="error-banner">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            {{ error }}
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="goDashboard()" [disabled]="loading">
              Cancel
            </button>
            <button type="submit" class="btn-primary" [disabled]="loading">
              <span *ngIf="!loading">Submit Order</span>
              <span *ngIf="loading" class="spinner-row"><span class="spinner"></span> Submitting...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 800px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.5px; }
    .page-header p { color: #64748b; font-size: 14px; margin: 0; }

    .success-card {
      background: white; border: 1px solid #a7f3d0; border-radius: 16px;
      padding: 32px; display: flex; flex-direction: column; gap: 16px;
    }
    .success-icon { width: 56px; height: 56px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .success-icon svg { width: 28px; height: 28px; color: #10b981; }
    .success-card h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
    .success-card p { font-size: 14px; color: #64748b; margin: 0; }
    .success-actions { display: flex; gap: 12px; }

    .form-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }

    .form-section { padding: 24px; border-bottom: 1px solid #f1f5f9; }
    .form-section:last-of-type { border-bottom: none; }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 18px;
    }
    .section-title svg { width: 18px; height: 18px; color: #2563eb; }

    .fields-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .fields-grid.two-col { grid-template-columns: repeat(2, 1fr); }

    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 600; color: #374151; }
    .req { color: #ef4444; }
    .opt { color: #94a3b8; font-weight: 400; }

    input, select, textarea {
      padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 14px; color: #0f172a; background: #f8fafc;
      transition: all 0.2s; font-family: inherit; resize: vertical;
    }
    input:focus, select:focus, textarea:focus {
      outline: none; border-color: #2563eb; background: white;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
    }
    input:disabled, select:disabled, textarea:disabled { opacity: 0.6; }
    .has-error input, .has-error select, .has-error textarea { border-color: #ef4444; }
    .error-text { font-size: 12px; color: #ef4444; }

    .payment-toggle { display: flex; gap: 12px; }
    .pay-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      background: white; font-size: 14px; font-weight: 600; cursor: pointer;
      color: #64748b; transition: all 0.2s; font-family: inherit;
    }
    .pay-btn svg { width: 18px; height: 18px; }
    .pay-btn.active-paid { background: #ecfdf5; border-color: #10b981; color: #059669; }
    .pay-btn.active-unpaid { background: #fef2f2; border-color: #ef4444; color: #dc2626; }
    .pay-btn:hover:not(:disabled):not(.active-paid):not(.active-unpaid) { border-color: #94a3b8; color: #374151; }

    .upload-zone {
      border: 2px dashed #e2e8f0; border-radius: 10px;
      padding: 24px; cursor: pointer; text-align: center;
      transition: all 0.2s; background: #f8fafc;
    }
    .upload-zone:hover { border-color: #2563eb; background: #f0f7ff; }
    .upload-zone.has-file { border-style: solid; border-color: #a7f3d0; background: #ecfdf5; }
    .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .upload-placeholder svg { width: 32px; height: 32px; color: #94a3b8; }
    .upload-placeholder span { font-size: 14px; color: #64748b; font-weight: 500; }
    .upload-placeholder small { font-size: 12px; color: #94a3b8; }
    .file-preview { display: flex; align-items: center; gap: 16px; text-align: left; }
    .file-preview img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
    .file-info { flex: 1; }
    .file-info span { display: block; font-size: 13px; color: #374151; font-weight: 500; }
    .remove-btn { background: none; border: none; color: #ef4444; font-size: 12px; cursor: pointer; padding: 0; margin-top: 4px; font-family: inherit; }

    .error-banner {
      display: flex; align-items: center; gap: 10px; margin: 0 24px 20px;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
      padding: 12px 16px; font-size: 13px; color: #dc2626;
    }
    .error-banner svg { width: 16px; height: 16px; flex-shrink: 0; }

    .form-actions {
      display: flex; justify-content: flex-end; gap: 12px;
      padding: 20px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9;
    }

    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 24px; background: #2563eb; color: white;
      border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-secondary {
      padding: 10px 24px; background: white; color: #374151;
      border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-secondary:hover:not(:disabled) { border-color: #94a3b8; }
    .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

    .spinner-row { display: flex; align-items: center; gap: 8px; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class NewOrderComponent implements OnInit {
  form: Partial<CreateOrderRequest> = { isPaid: null as any };
  stores: any[] = [];
  imageFile: File | null = null;
  imagePreview: string = '';
  loading = false;
  submitted = false;
  error = '';
  success = false;
  lastOrderNumber = '';
  minDate = new Date().toISOString().split('T')[0];

  constructor(
    public router: Router,
    private ordersService: OrdersService,
    private storesService: StoresService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.storesService.getDropdown().subscribe({
      next: (stores) => this.stores = stores,
    });
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.setImage(input.files[0]);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.setImage(file);
  }

  setImage(file: File) {
    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.imagePreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.imageFile = null;
    this.imagePreview = '';
  }

  submitOrder() {
    this.submitted = true;
    this.error = '';

    if (!this.form.customerName || !this.form.customerPhone || !this.form.orderDetails
      || !this.validTotalDozen || !this.form.pickupStoreId || !this.form.pickupDate
      || (this.isAdmin && !this.form.orderingStoreId)
      || this.form.isPaid === null || this.form.isPaid === undefined) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    const request: CreateOrderRequest = {
      customerName: this.form.customerName!,
      customerPhone: this.form.customerPhone!,
      customerEmail: this.form.customerEmail,
      orderDetails: this.form.orderDetails!,
      totalDozen: this.form.totalDozen!,
      isPaid: this.form.isPaid!,
      pickupStoreId: this.form.pickupStoreId!,
      pickupDate: this.form.pickupDate!,
      referenceImage: this.imageFile || undefined,
      orderingStoreId: this.isAdmin ? this.form.orderingStoreId : undefined,
    };

    this.ordersService.createOrder(request).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = true;
        this.lastOrderNumber = res.order?.orderNumber || '';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to submit order. Please try again.';
      }
    });
  }

  resetForm() {
    this.form = { isPaid: null as any };
    this.imageFile = null;
    this.imagePreview = '';
    this.submitted = false;
    this.error = '';
    this.success = false;
  }

  get isAdmin(): boolean { return this.authService.isAdmin; }
  get validTotalDozen(): boolean {
    return Number.isInteger(Number(this.form.totalDozen)) && Number(this.form.totalDozen) > 0;
  }
  goDashboard() { this.router.navigate([this.isAdmin ? '/factory/dashboard' : '/retail/dashboard']); }
}
