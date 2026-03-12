import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../../services/orders.service';
import { StoresService } from '../../../services/stores.service';
import { Order } from '../../../models';

@Component({
  selector: 'app-edit-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
          Back
        </button>
        <div>
          <h1>Edit Order</h1>
          <span class="order-num" *ngIf="order">{{ order.order_number }}</span>
        </div>
      </div>

      <div *ngIf="loadingOrder" class="loading-wrap"><div class="spinner"></div><p>Loading order...</p></div>

      <div *ngIf="!loadingOrder && order" class="form-card">
        <div class="notice">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
          Changes will be saved and the factory will be notified by email.
        </div>

        <div class="form-section">
          <div class="section-title">Customer Information</div>
          <div class="form-grid">
            <div class="field">
              <label>Customer Name *</label>
              <input type="text" [(ngModel)]="form.customerName" placeholder="Full name" />
            </div>
            <div class="field">
              <label>Phone Number *</label>
              <input type="tel" [(ngModel)]="form.customerPhone" placeholder="Phone" />
            </div>
            <div class="field">
              <label>Email <span class="opt">(optional — for pickup notification)</span></label>
              <input type="email" [(ngModel)]="form.customerEmail" placeholder="customer@email.com" />
            </div>
            <div class="field">
              <label>Payment Status</label>
              <select [(ngModel)]="form.isPaid">
                <option [ngValue]="false">Not Paid</option>
                <option [ngValue]="true">Paid</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">Order Details</div>
          <div class="field">
            <label>Order Details *</label>
            <textarea [(ngModel)]="form.orderDetails" rows="5" placeholder="Describe the order..."></textarea>
          </div>
          <div class="field">
            <label>Internal Notes <span class="opt">(not sent to customer)</span></label>
            <textarea [(ngModel)]="form.notes" rows="2" placeholder="Any notes for the factory..."></textarea>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">Pickup Details</div>
          <div class="form-grid">
            <div class="field">
              <label>Pickup Store *</label>
              <select [(ngModel)]="form.pickupStoreId">
                <option value="">Select store</option>
                <option *ngFor="let s of stores" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div class="field">
              <label>Pickup Date *</label>
              <input type="date" [(ngModel)]="form.pickupDate" [min]="today" />
            </div>
          </div>
        </div>

        <div class="error-msg" *ngIf="error">{{ error }}</div>
        <div class="success-msg" *ngIf="success">{{ success }}</div>

        <div class="form-actions">
          <button class="btn-secondary" (click)="goBack()">Cancel</button>
          <button class="btn-primary" (click)="saveOrder()" [disabled]="saving">
            <svg *ngIf="!saving" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            <span *ngIf="saving" class="btn-spinner"></span>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:32px; max-width:800px; font-family:'DM Sans',system-ui,sans-serif; }
    .page-header { display:flex; align-items:flex-start; gap:16px; margin-bottom:28px; }
    .back-btn { display:flex; align-items:center; gap:6px; padding:8px 14px; border:1.5px solid #e2e8f0; border-radius:8px; background:white; color:#374151; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.15s; margin-top:2px; }
    .back-btn svg { width:16px; height:16px; }
    .back-btn:hover { background:#f1f5f9; }
    h1 { font-size:24px; font-weight:700; color:#0f172a; margin:0 0 4px; }
    .order-num { font-size:14px; color:#64748b; font-family:monospace; }
    .loading-wrap { display:flex; flex-direction:column; align-items:center; gap:16px; padding:60px; }
    .loading-wrap p { color:#64748b; font-size:14px; margin:0; }
    .spinner { width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#2563eb; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .form-card { background:white; border:1px solid #e2e8f0; border-radius:16px; padding:28px; }
    .notice { display:flex; align-items:center; gap:10px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:12px 16px; font-size:13px; color:#1d4ed8; margin-bottom:28px; }
    .notice svg { width:18px; height:18px; flex-shrink:0; }
    .form-section { margin-bottom:28px; padding-bottom:28px; border-bottom:1px solid #f1f5f9; }
    .form-section:last-of-type { border-bottom:none; }
    .section-title { font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .field { display:flex; flex-direction:column; gap:6px; }
    label { font-size:13px; font-weight:600; color:#374151; }
    .opt { font-weight:400; color:#94a3b8; font-size:12px; }
    input, select, textarea { padding:10px 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:14px; font-family:inherit; outline:none; color:#0f172a; transition:border 0.15s; resize:vertical; }
    input:focus, select:focus, textarea:focus { border-color:#2563eb; }
    .error-msg { color:#dc2626; font-size:13px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px 14px; margin-bottom:16px; }
    .success-msg { color:#059669; font-size:13px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:10px 14px; margin-bottom:16px; }
    .form-actions { display:flex; gap:12px; justify-content:flex-end; }
    .btn-primary { display:flex; align-items:center; gap:8px; padding:11px 20px; background:#2563eb; color:white; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; }
    .btn-primary svg { width:16px; height:16px; }
    .btn-primary:hover:not(:disabled) { background:#1d4ed8; }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
    .btn-secondary { padding:11px 20px; border:1.5px solid #e2e8f0; border-radius:10px; background:white; color:#374151; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }
    .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.8s linear infinite; }
  `]
})
export class EditOrderComponent implements OnInit {
  order: Order | null = null;
  stores: any[] = [];
  loadingOrder = true;
  saving = false;
  error = '';
  success = '';
  today = new Date().toISOString().split('T')[0];

  form = {
    customerName: '', customerPhone: '', customerEmail: '',
    orderDetails: '', notes: '', isPaid: false,
    pickupStoreId: '', pickupDate: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
    private storesService: StoresService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ordersService.getOrder(id).subscribe({
      next: (o) => {
        this.order = o;
        this.form = {
          customerName: o.customer_name || o.customerName || '',
          customerPhone: o.customer_phone || o.customerPhone || '',
          customerEmail: o.customer_email || o.customerEmail || '',
          orderDetails: o.order_details || o.orderDetails || '',
          notes: o.notes || '',
          isPaid: o.is_paid ?? o.isPaid ?? false,
          pickupStoreId: o.pickup_store_id || o.pickupStoreId || '',
          pickupDate: this.formatDate(o.pickup_date || o.pickupDate || '')
        };
        this.loadingOrder = false;
      },
      error: () => { this.error = 'Order not found'; this.loadingOrder = false; }
    });
    this.storesService.getStoresForDropdown().subscribe({ next: s => this.stores = s, error: () => {} });
  }

  formatDate(d: string): string {
    if (!d) return '';
    return d.split('T')[0];
  }

  saveOrder() {
    this.error = ''; this.success = '';
    if (!this.form.customerName || !this.form.customerPhone || !this.form.orderDetails || !this.form.pickupStoreId || !this.form.pickupDate) {
      this.error = 'Please fill all required fields'; return;
    }
    this.saving = true;
    this.ordersService.editOrder(this.order!.id, this.form).subscribe({
      next: (r) => {
        this.saving = false;
        if (r.changes?.length > 0) {
          this.success = `Saved! ${r.changes.length} change(s) recorded and factory notified.`;
        } else {
          this.success = 'No changes detected.';
        }
        setTimeout(() => this.goBack(), 1500);
      },
      error: (e) => { this.error = e.error?.message || 'Failed to save'; this.saving = false; }
    });
  }

  goBack() { this.router.navigate(['..'], { relativeTo: this.route }); }
}
