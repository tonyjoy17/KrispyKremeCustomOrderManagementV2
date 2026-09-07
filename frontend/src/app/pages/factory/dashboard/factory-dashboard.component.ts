// pages/factory/dashboard/factory-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../../services/orders.service';
import { FactoryDashboardData, Order } from '../../../models';

@Component({
  selector: 'app-factory-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Factory Dashboard</h1>
          <p>{{ today | date:'EEEE, MMMM d, y' }}</p>
        </div>
        <div class="header-badges">
          <span class="tomorrow-badge">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            Preparing for {{ tomorrow | date:'EEE, MMM d' }}
          </span>
        </div>
      </div>

      <div *ngIf="loading" class="loading-wrap">
        <div class="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <div *ngIf="!loading && data">
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card amber">
            <div class="stat-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            </div>
            <div class="stat-value">{{ data.stats.tomorrowPickups }}</div>
            <div class="stat-label">Tomorrow's Pickups</div>
            <div class="stat-sub">Need to prepare today</div>
          </div>
          <div class="stat-card blue">
            <div class="stat-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
            </div>
            <div class="stat-value">{{ data.stats.upcoming }}</div>
            <div class="stat-label">Upcoming Orders</div>
            <div class="stat-sub">After tomorrow</div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            </div>
            <div class="stat-value">{{ data.stats.thisWeek }}</div>
            <div class="stat-label">This Week's Orders</div>
            <div class="stat-sub">Mon — Sun</div>
          </div>
          <div class="stat-card gray">
            <div class="stat-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clip-rule="evenodd"/></svg>
            </div>
            <div class="stat-value">{{ data.stats.total }}</div>
            <div class="stat-label">Total Orders</div>
            <div class="stat-sub">All time</div>
          </div>
        </div>

        <!-- Tomorrow's Pickups -->
        <div class="section">
          <div class="section-header">
            <div>
              <h2>
                <span class="tomorrow-dot"></span>
                Tomorrow's Pickups — Prepare Today
              </h2>
              <p>Orders due for pickup on {{ tomorrow | date:'EEEE, MMMM d' }}</p>
            </div>
            <span class="badge amber">{{ data.tomorrowOrders.length }} orders</span>
          </div>

          <div *ngIf="data.tomorrowOrders.length === 0" class="empty-state">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <p>No orders to prepare for tomorrow</p>
          </div>

          <div *ngIf="data.tomorrowOrders.length > 0">
            <div class="table-head">
              <span>Order #</span>
              <span>Customer</span>
              <span>Phone</span>
              <span>Order Details</span>
              <span>From Store</span>
              <span>Pickup Store</span>
              <span>Payment</span>
              <span>Status</span>
            </div>
            <div class="table-row" *ngFor="let order of data.tomorrowOrders">
              <span class="order-num">{{ order.order_number || order.orderNumber }}</span>
              <span class="customer-name">{{ order.customer_name || order.customerName }}</span>
              <span class="phone">{{ order.customer_phone || order.customerPhone }}</span>
              <span class="details-preview" [title]="(order.order_details || order.orderDetails) || ''">
                {{ (order.order_details || order.orderDetails) | slice:0:50 }}{{ ((order.order_details || order.orderDetails) || '').length > 50 ? '...' : '' }}
              </span>
              <span class="store-tag">{{ order.store_name || order.storeName }}</span>
              <span class="store-tag pickup">{{ order.pickup_store_name || order.pickupStoreName }}</span>
              <span>
                <span class="pill" [class.pill-green]="order.is_paid || order.isPaid" [class.pill-red]="!(order.is_paid || order.isPaid)">
                  {{ (order.is_paid || order.isPaid) ? 'Paid' : 'Unpaid' }}
                </span>
              </span>
              <span>
                <select class="status-select status-{{ order.status }}" [ngModel]="order.status"
                  (ngModelChange)="updateStatus(order, $event)">
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="quick-links">
          <a routerLink="/factory/orders" [queryParams]="{filter: 'upcoming'}" class="ql-card">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            View Upcoming Orders
          </a>
          <a routerLink="/factory/orders" [queryParams]="{filter: 'past'}" class="ql-card">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
            View Past Orders
          </a>
          <a routerLink="/factory/production-sheet" class="ql-card">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/></svg>
            Print Production Sheet
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
    .page-header h1 { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.5px; }
    .page-header p { color: #64748b; font-size: 14px; margin: 0; }
    .header-badges { display: flex; gap: 8px; }
    .tomorrow-badge {
      display: flex; align-items: center; gap: 6px;
      background: #fffbeb; border: 1px solid #fde68a;
      padding: 8px 14px; border-radius: 8px;
      font-size: 13px; font-weight: 600; color: #92400e;
    }
    .tomorrow-badge svg { width: 16px; height: 16px; }

    .loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 80px; gap: 16px; color: #64748b; }
    .loading-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card {
      background: white; border-radius: 14px; padding: 20px;
      border: 1px solid #e2e8f0; position: relative; overflow: hidden;
    }
    .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .stat-card.amber::before { background: #f59e0b; }
    .stat-card.blue::before { background: #2563eb; }
    .stat-card.green::before { background: #10b981; }
    .stat-card.gray::before { background: #94a3b8; }
    .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .stat-icon svg { width: 20px; height: 20px; }
    .stat-card.amber .stat-icon { background: #fffbeb; color: #f59e0b; }
    .stat-card.blue .stat-icon { background: #eff6ff; color: #2563eb; }
    .stat-card.green .stat-icon { background: #ecfdf5; color: #10b981; }
    .stat-card.gray .stat-icon { background: #f1f5f9; color: #64748b; }
    .stat-value { font-size: 32px; font-weight: 700; color: #0f172a; line-height: 1; margin-bottom: 4px; }
    .stat-label { font-size: 13px; color: #0f172a; font-weight: 600; }
    .stat-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }

    .section { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f1f5f9; }
    .section-header h2 { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 2px; display: flex; align-items: center; gap: 8px; }
    .section-header p { font-size: 12px; color: #64748b; margin: 0; }
    .tomorrow-dot { width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; display: inline-block; }

    .badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; flex-shrink: 0; }
    .badge.amber { background: #fffbeb; color: #b45309; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #94a3b8; gap: 10px; }
    .empty-state svg { width: 40px; height: 40px; color: #10b981; }
    .empty-state p { font-size: 14px; margin: 0; }

    .table-head {
      display: grid; grid-template-columns: 140px 130px 110px 1fr 130px 130px 80px 120px;
      padding: 10px 20px; background: #f8fafc;
      font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .table-row {
      display: grid; grid-template-columns: 140px 130px 110px 1fr 130px 130px 80px 120px;
      padding: 13px 20px; align-items: center;
      border-top: 1px solid #f1f5f9; font-size: 13px; color: #374151;
    }
    .table-row:hover { background: #fafbfc; }
    .order-num { font-family: monospace; font-size: 12px; color: #2563eb; font-weight: 600; }
    .customer-name { font-weight: 600; color: #0f172a; }
    .phone { color: #64748b; }
    .details-preview { color: #64748b; font-size: 12px; }
    .store-tag { font-size: 11px; background: #f1f5f9; padding: 3px 7px; border-radius: 6px; display: inline-block; }
    .store-tag.pickup { background: #eff6ff; color: #1d4ed8; }

    .pill { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
    .pill-green { background: #ecfdf5; color: #059669; }
    .pill-red { background: #fef2f2; color: #dc2626; }

    .status-select {
      padding: 4px 8px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
      background: white; transition: all 0.15s;
    }
    .status-select.status-pending { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .status-select.status-in_progress { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .status-select.status-ready { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
    .status-select.status-completed { background: #f0fdf4; color: #16a34a; border-color: #86efac; }
    .status-select.status-cancelled { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

    .quick-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .ql-card {
      display: flex; align-items: center; gap: 12px;
      background: white; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 18px 20px; text-decoration: none; color: #374151; font-size: 14px; font-weight: 600;
      transition: all 0.2s;
    }
    .ql-card svg { width: 20px; height: 20px; color: #f59e0b; flex-shrink: 0; }
    .ql-card:hover { border-color: #f59e0b; color: #b45309; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  `]
})
export class FactoryDashboardComponent implements OnInit {
  data: FactoryDashboardData | null = null;
  loading = true;
  today = new Date();
  tomorrow = new Date(Date.now() + 86400000);

  constructor(private ordersService: OrdersService) {}

  ngOnInit() {
    this.ordersService.getFactoryDashboard().subscribe({
      next: (data) => { this.data = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  updateStatus(order: Order, status: string) {
    this.ordersService.updateOrderStatus(order.id, status).subscribe({
      next: () => { (order as any).status = status; },
    });
  }
}
