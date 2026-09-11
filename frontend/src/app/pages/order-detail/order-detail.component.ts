import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { Order, OrderHistory } from '../../models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header no-print">
        <button class="back-btn" (click)="goBack()">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
          Back
        </button>
        <div class="header-actions">
          <a *ngIf="canEdit" [routerLink]="editLink" class="btn-edit">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
            Edit Order
          </a>
          <button *ngIf="canMarkReceived" class="btn-received" (click)="markReceived()" [disabled]="markingReceived">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            {{ markingReceived ? 'Processing...' : 'Order Received' }}
          </button>
          <button *ngIf="canUpdateStatus" class="btn-status" (click)="showStatusMenu=!showStatusMenu">
            Update Status ▾
          </button>
          <div class="status-menu" *ngIf="showStatusMenu">
            <button *ngFor="let s of statuses" (click)="updateStatus(s.val)" [disabled]="order?.status===s.val">{{ s.label }}</button>
          </div>
          <button *ngIf="isAdmin && order" class="btn-delete" (click)="deleteOrder()">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            Delete
          </button>
          <button class="btn-print" (click)="print()">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9v-2h8v2H6zm8-4a1 1 0 110 2 1 1 0 010-2z" clip-rule="evenodd"/></svg>
            Print
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-wrap"><div class="spinner"></div></div>

      <div *ngIf="!loading && !order" class="not-found">Order not found.</div>

      <div *ngIf="order" class="content-grid">
        <!-- Main order detail -->
        <div class="detail-card">
          <div class="order-header">
            <div>
              <h2>{{ order.order_number }}</h2>
              <span class="placed-by">Placed by {{ order.store_name }} &bull; {{ (order.created_at || order.createdAt) | date:'d MMM y, h:mm a' }}</span>
            </div>
            <span class="status-badge status-{{ order.status }}">{{ getStatusLabel(order.status) }}</span>
          </div>

          <div class="sections">
            <div class="section">
              <div class="sec-title">Customer</div>
              <div class="info-row"><span class="label">Name</span><span class="val">{{ order.customer_name }}</span></div>
              <div class="info-row"><span class="label">Phone</span><span class="val">{{ order.customer_phone }}</span></div>
              <div class="info-row" *ngIf="order.customer_email"><span class="label">Email</span><span class="val">{{ order.customer_email }}</span></div>
              <div class="info-row"><span class="label">Payment</span>
                <span class="val" [class.paid]="order.is_paid" [class.unpaid]="!order.is_paid">{{ order.is_paid ? '✓ Paid' : '✗ Not Paid' }}</span>
              </div>
              <div class="info-row" *ngIf="order.customer_notified">
                <span class="label">Notified</span>
                <span class="val notified">✉ Customer emailed {{ (order.customer_notified_at || order.customerNotifiedAt) | date:'d MMM y' }}</span>
              </div>
            </div>

            <div class="section">
              <div class="sec-title">Pickup</div>
              <div class="info-row"><span class="label">Date</span><span class="val pickup-date">{{ (order.pickup_date || order.pickupDate) | date:'EEEE, d MMMM y' }}</span></div>
              <div class="info-row" *ngIf="order.pickup_time || order.pickupTime"><span class="label">Time</span><span class="val">{{ formatPickupTime(order.pickup_time || order.pickupTime) }}</span></div>
              <div class="info-row"><span class="label">Store</span><span class="val">{{ order.pickup_store_name }}</span></div>
              <div class="info-row" *ngIf="order.total_price !== null && order.total_price !== undefined"><span class="label">Total Price</span><span class="val">{{ order.total_price | currency:'AUD':'symbol':'1.2-2' }}</span></div>
            </div>

            <div class="section">
              <div class="sec-title">Order Details</div>
              <div class="info-row"><span class="label">Total Dozen</span><span class="val">{{ order.total_dozen ?? order.totalDozen }}</span></div>
              <div class="details-box">{{ order.order_details }}</div>
            </div>

            <div class="section" *ngIf="order.notes">
              <div class="sec-title">Notes</div>
              <div class="notes-box">{{ order.notes }}</div>
            </div>

            <div class="section" *ngIf="order.reference_image_path">
              <div class="sec-title">Reference Image</div>
              <img [src]="getImageUrl(order.reference_image_path)" class="ref-image" alt="Reference" />
            </div>
          </div>
        </div>

        <!-- History sidebar -->
        <div class="history-card no-print">
          <h3>Order History</h3>
          <div *ngIf="historyLoading" class="hist-loading"><div class="small-spinner"></div></div>
          <div *ngIf="!historyLoading && history.length === 0" class="hist-empty">No history yet.</div>
          <div class="hist-list" *ngIf="!historyLoading">
            <div class="hist-item" *ngFor="let h of history">
              <div class="hist-dot" [class]="'dot-' + h.action"></div>
              <div class="hist-body">
                <div class="hist-desc">{{ h.description }}</div>
                <div class="hist-meta">{{ h.changed_by_name }} &bull; {{ h.created_at | date:'d MMM y, h:mm a' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:32px; font-family:'DM Sans',system-ui,sans-serif; }
    .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
    .back-btn { display:flex; align-items:center; gap:6px; padding:8px 14px; border:1.5px solid #e2e8f0; border-radius:8px; background:white; color:#374151; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.15s; }
    .back-btn svg { width:16px; height:16px; }
    .back-btn:hover { background:#f1f5f9; }
    .header-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; position:relative; }
    .btn-edit { display:flex; align-items:center; gap:6px; padding:9px 16px; background:#eff6ff; color:#2563eb; border:1.5px solid #bfdbfe; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; text-decoration:none; transition:all 0.15s; }
    .btn-edit svg { width:15px; height:15px; }
    .btn-edit:hover { background:#dbeafe; }
    .btn-received { display:flex; align-items:center; gap:6px; padding:9px 16px; background:#059669; color:white; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; }
    .btn-received svg { width:16px; height:16px; }
    .btn-received:hover:not(:disabled) { background:#047857; }
    .btn-received:disabled { opacity:0.6; cursor:not-allowed; }
    .btn-status { display:flex; align-items:center; gap:6px; padding:9px 16px; background:#fffbeb; color:#b45309; border:1.5px solid #fde68a; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
    .status-menu { position:absolute; top:calc(100% + 4px); right:0; background:white; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.12); z-index:100; min-width:160px; }
    .status-menu button { display:block; width:100%; padding:10px 16px; text-align:left; border:none; background:none; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; color:#374151; }
    .status-menu button:hover:not(:disabled) { background:#f1f5f9; }
    .status-menu button:disabled { opacity:0.4; cursor:not-allowed; }
    .btn-delete { display:flex; align-items:center; gap:6px; padding:9px 14px; background:#fef2f2; color:#dc2626; border:1.5px solid #fecaca; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.15s; }
    .btn-delete svg { width:15px; height:15px; }
    .btn-delete:hover { background:#fee2e2; }
    .btn-print { display:flex; align-items:center; gap:6px; padding:9px 16px; background:white; color:#374151; border:1.5px solid #e2e8f0; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
    .btn-print svg { width:16px; height:16px; }
    .loading-wrap { display:flex; justify-content:center; padding:80px; }
    .spinner { width:40px; height:40px; border:3px solid #e2e8f0; border-top-color:#2563eb; border-radius:50%; animation:spin 0.8s linear infinite; }
    .small-spinner { width:24px; height:24px; border:2px solid #e2e8f0; border-top-color:#2563eb; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .not-found { text-align:center; padding:80px; color:#94a3b8; font-size:16px; }
    .content-grid { display:grid; grid-template-columns:1fr 300px; gap:24px; align-items:start; }
    .detail-card { background:white; border:1px solid #dbe3ec; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(15,23,42,.06); }
    .order-header { display:flex; align-items:flex-start; justify-content:space-between; padding:28px; border-bottom:0; background:linear-gradient(135deg,#8b0017,#d7193f); }
    .order-header h2 { font-size:26px; font-weight:800; color:white; margin:0 0 7px; font-family:monospace; letter-spacing:.3px; }
    .placed-by { font-size:13px; color:#ffe4e9; }
    .status-badge { font-size:12px; font-weight:700; padding:5px 12px; border-radius:20px; text-transform:capitalize; flex-shrink:0; }
    .status-pending { background:#fff7d6; color:#92400e; }
    .status-in_progress { background:#eff6ff; color:#2563eb; }
    .status-ready { background:#ecfdf5; color:#059669; }
    .status-completed { background:#f0fdf4; color:#15803d; }
    .status-cancelled { background:#fef2f2; color:#dc2626; }
    .sections { padding:24px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; background:#f8fafc; }
    .section { background:white; border:1px solid #e2e8f0; border-radius:13px; padding:20px; }
    .section:nth-child(n+3) { grid-column:1/-1; }
    .sec-title { font-size:11px; font-weight:800; color:#9f1239; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:12px; padding-bottom:9px; border-bottom:2px solid #ffe4e6; }
    .info-row { display:flex; gap:12px; padding:10px 0; border-bottom:1px solid #edf2f7; }
    .info-row:last-child { border-bottom:none; }
    .label { width:100px; font-size:12px; color:#64748b; font-weight:600; flex-shrink:0; }
    .val { font-size:14px; color:#172033; font-weight:650; }
    .val.paid { color:#059669; font-weight:700; }
    .val.unpaid { color:#ef4444; font-weight:700; }
    .val.notified { color:#7c3aed; font-size:13px; }
    .val.pickup-date { font-weight:700; color:#0f172a; }
    .section:nth-child(3) .info-row { display:inline-flex; align-items:center; background:#fff1f2; border:1px solid #fecdd3; border-radius:10px; padding:9px 14px; margin-bottom:12px; }
    .section:nth-child(3) .info-row .label { width:auto; text-transform:uppercase; letter-spacing:.5px; }
    .section:nth-child(3) .info-row .val { font-size:22px; color:#be123c; font-weight:800; }
    .details-box { background:#fff; border:2px solid #cbd5e1; border-left:5px solid #d7193f; border-radius:10px; padding:18px; font-size:15px; color:#1e293b; line-height:1.7; white-space:pre-wrap; min-height:48px; }
    .notes-box { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:14px; font-size:13px; color:#92400e; line-height:1.6; white-space:pre-wrap; }
    .ref-image { max-width:100%; border-radius:8px; border:1px solid #e2e8f0; }
    .history-card { background:white; border:1px solid #e2e8f0; border-radius:16px; padding:20px; box-shadow:0 8px 30px rgba(15,23,42,.04); }
    .history-card h3 { font-size:14px; font-weight:700; color:#0f172a; margin:0 0 16px; }
    .hist-loading, .hist-empty { display:flex; justify-content:center; padding:20px; color:#94a3b8; font-size:13px; }
    .hist-list { display:flex; flex-direction:column; gap:0; }
    .hist-item { display:flex; gap:12px; padding:10px 0; border-bottom:1px solid #f1f5f9; }
    .hist-item:last-child { border-bottom:none; }
    .hist-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:4px; }
    .dot-created { background:#059669; }
    .dot-edited { background:#2563eb; }
    .dot-status_changed { background:#b45309; }
    .dot-received { background:#7c3aed; }
    .hist-body { flex:1; }
    .hist-desc { font-size:13px; color:#374151; line-height:1.4; margin-bottom:3px; }
    .hist-meta { font-size:11px; color:#94a3b8; }
    @media (max-width: 900px) { .content-grid { grid-template-columns:1fr; } }
    @media (max-width: 620px) { .page{padding:16px}.sections{grid-template-columns:1fr;padding:14px}.section:nth-child(n+1){grid-column:1}.order-header{padding:22px}.order-header h2{font-size:21px}.info-row{flex-direction:column;gap:3px}.label{width:auto} }
    @media print {
      .no-print { display:none !important; }
      .page { padding:0; }
      .content-grid { grid-template-columns:1fr; }
      .detail-card { border:0; border-radius:0; box-shadow:none; }
      .order-header { background:#c8102e !important; padding:18px 20px; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
      .sections { padding:16px 20px; gap:12px; background:white; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
      .section { padding:14px; break-inside:avoid; }
      .details-box { min-height:0; padding:13px; }
      .ref-image { max-height:280px; }
      @page { size:A4 portrait; margin:10mm; }
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  history: OrderHistory[] = [];
  loading = true;
  historyLoading = true;
  markingReceived = false;
  showStatusMenu = false;

  // Factory status rules:
  // - No completed (only retail via "Order Received")
  // - Once ready, cannot go back — only cancelled allowed
  get statuses() {
    const current = this.order?.status;
    if (current === 'ready') {
      return [
        { val: 'cancelled', label: 'Cancelled' },
      ];
    }
    return [
      { val: 'pending', label: 'Pending' },
      { val: 'in_progress', label: 'In Progress' },
      { val: 'ready', label: 'Ready for Pickup' },
      { val: 'cancelled', label: 'Cancelled' },
    ];
  }

  get canUpdateStatus(): boolean {
    const s = this.order?.status;
    // Cannot update if completed or cancelled
    return this.isFactory && s !== 'completed' && s !== 'cancelled';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
    private authService: AuthService
  ) {}

  get isFactory() { return this.authService.isFactory; }
  get isAdmin() { return this.authService.isAdmin; }
  get userStoreId() { return this.authService.currentUser?.storeId || (this.authService.currentUser as any)?.id; }

  get canEdit(): boolean {
    if (!this.order) return false;
    if (this.isAdmin || this.isFactory || this.order.store_id !== this.userStoreId) return false;
    const s = this.order.status;
    return s !== 'completed' && s !== 'cancelled';
  }

  get canMarkReceived(): boolean {
    if (!this.order) return false;
    if (this.isFactory || this.order.pickup_store_id !== this.userStoreId) return false;
    const s = this.order.status;
    return s === 'ready' && !this.order.customer_notified;
  }

  get editLink(): string {
    const id = this.order?.id;
    return `/retail/orders/${id}/edit`;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ordersService.getOrder(id).subscribe({
      next: o => { this.order = o; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.ordersService.getOrderHistory(id).subscribe({
      next: h => { this.history = h; this.historyLoading = false; },
      error: () => { this.historyLoading = false; }
    });
  }

  getStatusLabel(s: string): string {
    const map: any = { pending: 'Pending', in_progress: 'In Progress', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };
    return map[s] || s;
  }

  formatPickupTime(value?: string): string {
    if (!value) return '';
    const [hours, minutes] = value.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${String(minutes || 0).padStart(2, '0')} ${suffix}`;
  }

  getImageUrl(fn: string): string { return this.ordersService.getImageUrl(fn); }

  markReceived() {
    if (!confirm('Mark this order as received and email the customer?')) return;
    this.markingReceived = true;
    this.ordersService.markOrderReceived(this.order!.id).subscribe({
      next: () => {
        this.markingReceived = false;
        if (this.order) { this.order.status = 'completed'; this.order.customer_notified = true; }
        this.ordersService.getOrderHistory(this.order!.id).subscribe({ next: h => this.history = h });
      },
      error: (e) => { alert(e.error?.message || 'Failed'); this.markingReceived = false; }
    });
  }

  updateStatus(status: string) {
    this.showStatusMenu = false;
    this.ordersService.updateOrderStatus(this.order!.id, status).subscribe({
      next: () => {
        if (this.order) this.order.status = status as any;
        this.ordersService.getOrderHistory(this.order!.id).subscribe({ next: h => this.history = h });
      },
      error: (e) => alert(e.error?.message || 'Failed')
    });
  }

  deleteOrder() {
    if (!confirm(`Delete order ${this.order?.order_number}? This cannot be undone.`)) return;
    this.ordersService.deleteOrder(this.order!.id).subscribe({
      next: () => this.goBack(),
      error: (e) => alert(e.error?.message || 'Failed to delete')
    });
  }

  print() { window.print(); }
  goBack() { window.history.back(); }
}
