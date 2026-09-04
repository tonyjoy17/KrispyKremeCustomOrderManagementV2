import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { Order } from '../../models';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  template: `
    <div class="page">

      <!-- Back + Print bar -->
      <div class="top-bar no-print">
        <button class="back-btn" (click)="goBack()">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
          Back to Orders
        </button>
        <button class="print-btn" (click)="printOrder()">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/></svg>
          Print
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-wrap no-print">
        <div class="spinner"></div>
      </div>

      <!-- Not found -->
      <div *ngIf="!loading && !order" class="not-found no-print">
        <p>Order not found.</p>
      </div>

      <!-- Order Detail Card -->
      <div *ngIf="!loading && order" class="print-page">

        <!-- Print Header -->
        <div class="print-header">
          <div class="header-left">
            <div class="brand">
              <svg viewBox="0 0 24 24" fill="currentColor" class="brand-icon"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <div>
                <h1>OrderFlow</h1>
                <p>Order Details</p>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="order-number">{{ order.order_number || order.orderNumber }}</div>
            <span class="status-badge status-{{ order.status }}">{{ order.status | titlecase }}</span>
            <div class="print-date">Printed: {{ now | date:'d MMM y, h:mm a' }}</div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Main Grid -->
        <div class="detail-grid">

          <!-- Customer Info -->
          <div class="detail-section">
            <div class="section-header">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
              Customer Information
            </div>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="label">Name</span>
                <span class="value bold">{{ order.customer_name || order.customerName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Phone</span>
                <span class="value">{{ order.customer_phone || order.customerPhone }}</span>
              </div>
              <div class="detail-row" *ngIf="order.customer_email || order.customerEmail">
                <span class="label">Email</span>
                <span class="value">{{ order.customer_email || order.customerEmail }}</span>
              </div>
            </div>
          </div>

          <!-- Pickup Info -->
          <div class="detail-section">
            <div class="section-header">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
              Pickup Details
            </div>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="label">Pickup Store</span>
                <span class="value bold">{{ order.pickup_store_name || order.pickupStoreName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Pickup Date</span>
                <span class="value bold highlight">{{ (order.pickup_date || order.pickupDate) | date:'EEEE, d MMMM y' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment</span>
                <span class="value">
                  <span class="pill" [class.paid]="order.is_paid || order.isPaid" [class.unpaid]="!(order.is_paid || order.isPaid)">
                    {{ (order.is_paid || order.isPaid) ? '✓ Paid' : '✗ Unpaid' }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="label">Total Dozen</span>
                <span class="value bold">{{ order.total_dozen || order.totalDozen }}</span>
              </div>
            </div>
          </div>

          <!-- Order From (factory view) -->
          <div class="detail-section" *ngIf="isFactory">
            <div class="section-header">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
              Order Source
            </div>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="label">Placed by Store</span>
                <span class="value bold">{{ order.store_name || order.storeName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Store Code</span>
                <span class="value">{{ order.store_code || order.storeCode }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Order Date</span>
                <span class="value">{{ (order.created_at || order.createdAt) | date:'d MMM y, h:mm a' }}</span>
              </div>
            </div>
          </div>

          <!-- Order Date (retail view) -->
          <div class="detail-section" *ngIf="!isFactory">
            <div class="section-header">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
              Order Info
            </div>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="label">Order Placed</span>
                <span class="value">{{ (order.created_at || order.createdAt) | date:'d MMM y, h:mm a' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email Sent</span>
                <span class="value">{{ (order.email_sent || order.emailSent) ? '✓ Yes' : '✗ No' }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Order Details -->
        <div class="order-details-section">
          <div class="section-header">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
            Order Details
          </div>
          <div class="order-details-text">{{ order.order_details || order.orderDetails }}</div>
        </div>

        <!-- Notes (if any) -->
        <div class="order-details-section" *ngIf="order.notes">
          <div class="section-header">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
            Notes
          </div>
          <div class="order-details-text">{{ order.notes }}</div>
        </div>

        <!-- Reference Image -->
        <div class="image-section" *ngIf="order.reference_image_path || order.referenceImagePath">
          <div class="section-header">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>
            Reference Image
          </div>
          <div class="image-wrap">
            <img [src]="getImageUrl()" alt="Reference image" class="ref-image" />
          </div>
        </div>

        <!-- Status update (factory, no-print) -->
        <div class="status-section no-print" *ngIf="isFactory">
          <div class="section-header">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
            Update Status
          </div>
          <div class="status-controls">
            <select class="status-select status-{{ order.status }}" [(ngModel)]="currentStatus" (ngModelChange)="updateStatus($event)">
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span class="status-saved" *ngIf="statusSaved">✓ Saved</span>
          </div>
        </div>

        <!-- Print Footer -->
        <div class="print-footer">
          <p>OrderFlow Retail Order Management &nbsp;|&nbsp; {{ order.order_number || order.orderNumber }}</p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 32px; max-width: 900px; }

    /* ── TOP BAR ── */
    .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .back-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      background: white; color: #374151; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
    }
    .back-btn svg { width: 16px; height: 16px; }
    .back-btn:hover { border-color: #94a3b8; background: #f8fafc; }
    .print-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 18px; background: #2563eb; color: white;
      border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
    }
    .print-btn svg { width: 16px; height: 16px; }
    .print-btn:hover { background: #1d4ed8; }

    /* ── LOADING ── */
    .loading-wrap { display: flex; justify-content: center; padding: 80px; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .not-found { text-align: center; padding: 60px; color: #94a3b8; }

    /* ── PRINT PAGE ── */
    .print-page {
      background: white; border: 1px solid #e2e8f0; border-radius: 16px;
      padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    /* ── HEADER ── */
    .print-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 36px; height: 36px; color: #2563eb; }
    .brand h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
    .brand p { font-size: 13px; color: #64748b; margin: 2px 0 0; }
    .header-right { text-align: right; }
    .order-number { font-family: monospace; font-size: 20px; font-weight: 700; color: #2563eb; margin-bottom: 6px; }
    .print-date { font-size: 11px; color: #94a3b8; margin-top: 6px; }

    .status-badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; display: inline-block; }
    .status-pending { background: #fffbeb; color: #b45309; }
    .status-in_progress { background: #eff6ff; color: #1d4ed8; }
    .status-ready { background: #ecfdf5; color: #059669; }
    .status-completed { background: #f0fdf4; color: #16a34a; }
    .status-cancelled { background: #fef2f2; color: #dc2626; }

    .divider { height: 1px; background: #e2e8f0; margin: 0 0 24px; }

    /* ── DETAIL GRID ── */
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }

    .detail-section {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;
    }
    .section-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 14px;
    }
    .section-header svg { width: 15px; height: 15px; color: #2563eb; flex-shrink: 0; }

    .detail-rows { display: flex; flex-direction: column; gap: 10px; }
    .detail-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .label { font-size: 12px; color: #94a3b8; flex-shrink: 0; }
    .value { font-size: 14px; color: #0f172a; text-align: right; }
    .value.bold { font-weight: 700; }
    .value.highlight { color: #2563eb; }

    .pill { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
    .pill.paid { background: #ecfdf5; color: #059669; }
    .pill.unpaid { background: #fef2f2; color: #dc2626; }

    /* ── ORDER DETAILS ── */
    .order-details-section {
      border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;
    }
    .order-details-text {
      font-size: 15px; color: #1e293b; line-height: 1.7; white-space: pre-wrap;
      background: #f8fafc; border-radius: 8px; padding: 14px;
    }

    /* ── IMAGE ── */
    .image-section { border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .image-wrap { display: flex; justify-content: center; margin-top: 8px; }
    .ref-image { max-width: 100%; max-height: 320px; border-radius: 8px; border: 1px solid #e2e8f0; object-fit: contain; }

    /* ── STATUS UPDATE ── */
    .status-section { border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .status-controls { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
    .status-select {
      padding: 8px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      background: white; outline: none;
    }
    .status-select.status-pending { color: #b45309; border-color: #fcd34d; }
    .status-select.status-in_progress { color: #1d4ed8; border-color: #93c5fd; }
    .status-select.status-ready { color: #059669; border-color: #6ee7b7; }
    .status-select.status-completed { color: #16a34a; border-color: #86efac; }
    .status-select.status-cancelled { color: #dc2626; border-color: #fca5a5; }
    .status-saved { font-size: 13px; color: #059669; font-weight: 600; }

    /* ── PRINT FOOTER ── */
    .print-footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; margin-top: 8px; }
    .print-footer p { font-size: 11px; color: #94a3b8; margin: 0; }

    /* ── PRINT STYLES ── */
    @media print {
      .no-print { display: none !important; }
      .page { padding: 0; }
      .print-page { border: none; border-radius: 0; box-shadow: none; padding: 16px; }
      .detail-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  isFactory = false;
  currentStatus = '';
  statusSaved = false;
  now = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isFactory = this.authService.currentUser?.isFactory ?? false;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ordersService.getOrder(id).subscribe({
        next: (order) => {
          this.order = order;
          this.currentStatus = order.status;
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    }
  }

  getImageUrl(): string {
    const path = this.order?.reference_image_url || this.order?.reference_image_path || this.order?.referenceImagePath || '';
    return this.ordersService.getImageUrl(path);
  }

  updateStatus(status: string) {
    if (!this.order) return;
    const id = this.order.id;
    this.ordersService.updateOrderStatus(id, status).subscribe({
      next: () => {
        this.order!.status = status as any;
        this.statusSaved = true;
        setTimeout(() => this.statusSaved = false, 2000);
      }
    });
  }

  printOrder() { window.print(); }

  goBack() {
    if (this.isFactory) this.router.navigate(['/factory/orders']);
    else this.router.navigate(['/retail/orders']);
  }
}
