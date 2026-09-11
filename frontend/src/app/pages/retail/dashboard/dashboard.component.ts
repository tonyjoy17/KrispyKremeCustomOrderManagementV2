// pages/retail/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../../services/orders.service';
import { AuthService } from '../../../services/auth.service';
import { RetailDashboardData, Order } from '../../../models';

@Component({
  selector: 'app-retail-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>{{ today | date:'EEEE, MMMM d, y' }}</p>
        </div>
        <a routerLink="/retail/new-order" class="btn-primary">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
          New Order
        </a>
      </div>

      <div *ngIf="loading" class="loading-wrap">
        <div class="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <div *ngIf="!loading && data">
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
            </div>
            <div class="stat-value">{{ data.stats.todayPickups }}</div>
            <div class="stat-label">Today's Pickups</div>
          </div>
          <div class="stat-card amber">
            <div class="stat-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            </div>
            <div class="stat-value">{{ data.stats.upcoming }}</div>
            <div class="stat-label">Upcoming Orders</div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            </div>
            <div class="stat-value">{{ data.stats.thisWeek }}</div>
            <div class="stat-label">This Week's Orders</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
            </div>
            <div class="stat-value">{{ data.stats.total }}</div>
            <div class="stat-label">Total Orders</div>
          </div>
        </div>

        <!-- Today's pickups -->
        <div class="section">
          <div class="section-header">
            <h2>
              <span class="today-dot"></span>
              Today's Pickups
            </h2>
            <span class="badge blue">{{ data.todayOrders.length }} orders</span>
          </div>

          <div *ngIf="data.todayOrders.length === 0" class="empty-state">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <p>No pickups scheduled for today</p>
          </div>

          <div class="orders-table" *ngIf="data.todayOrders.length > 0">
            <div class="table-head">
              <span>Order #</span>
              <span>Customer</span>
              <span>Phone</span>
              <span>From Store</span>
              <span>Payment</span>
              <span>Status</span>
            </div>
            <div class="table-row" *ngFor="let order of data.todayOrders">
              <a class="order-num" [routerLink]="['/retail/orders', order.id]">{{ order.order_number || order.orderNumber }}</a>
              <span class="customer-name">{{ order.customer_name || order.customerName }}</span>
              <span class="phone">{{ order.customer_phone || order.customerPhone }}</span>
              <span class="store-tag">{{ order.store_name || order.storeName }}</span>
              <span>
                <span class="pill" [class.pill-green]="order.is_paid || order.isPaid" [class.pill-red]="!(order.is_paid || order.isPaid)">
                  {{ (order.is_paid || order.isPaid) ? 'Paid' : 'Unpaid' }}
                </span>
              </span>
              <span>
                <span class="status-badge status-{{ order.status }}">{{ order.status | titlecase }}</span>
              </span>
            </div>
          </div>
          <div class="pagination" *ngIf="totalPages > 1">
            <button [disabled]="currentPage === 1 || loading" (click)="changePage(currentPage - 1)">Previous</button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button [disabled]="currentPage === totalPages || loading" (click)="changePage(currentPage + 1)">Next</button>
          </div>
        </div>

        <!-- Quick links -->
        <div class="quick-links">
          <a routerLink="/retail/orders" [queryParams]="{filter: 'upcoming'}" class="ql-card">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            View Upcoming Orders
          </a>
          <a routerLink="/retail/orders" [queryParams]="{filter: 'past'}" class="ql-card">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
            View Past Orders
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1100px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .page-header h1 { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.5px; }
    .page-header p { color: #64748b; font-size: 14px; margin: 0; }

    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; background: #2563eb; color: white;
      border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600;
      transition: all 0.2s;
    }
    .btn-primary svg { width: 18px; height: 18px; }
    .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }

    .loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 16px; color: #64748b; }
    .loading-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card {
      background: white; border-radius: 14px; padding: 20px;
      border: 1px solid #e2e8f0; position: relative; overflow: hidden;
    }
    .stat-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    }
    .stat-card.blue::before { background: #2563eb; }
    .stat-card.amber::before { background: #f59e0b; }
    .stat-card.green::before { background: #10b981; }
    .stat-card.purple::before { background: #8b5cf6; }

    .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .stat-icon svg { width: 20px; height: 20px; }
    .stat-card.blue .stat-icon { background: #eff6ff; color: #2563eb; }
    .stat-card.amber .stat-icon { background: #fffbeb; color: #f59e0b; }
    .stat-card.green .stat-icon { background: #ecfdf5; color: #10b981; }
    .stat-card.purple .stat-icon { background: #f5f3ff; color: #8b5cf6; }

    .stat-value { font-size: 32px; font-weight: 700; color: #0f172a; line-height: 1; margin-bottom: 4px; }
    .stat-label { font-size: 13px; color: #64748b; font-weight: 500; }

    .section { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f1f5f9; }
    .section-header h2 { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; }
    .today-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; }

    .badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
    .badge.blue { background: #eff6ff; color: #2563eb; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #94a3b8; gap: 10px; }
    .empty-state svg { width: 40px; height: 40px; color: #10b981; }
    .empty-state p { font-size: 14px; margin: 0; }

    .orders-table { width: 100%; }
    .table-head {
      display: grid; grid-template-columns: 160px 1fr 140px 160px 90px 110px;
      padding: 10px 20px; background: #f8fafc;
      font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .table-row {
      display: grid; grid-template-columns: 160px 1fr 140px 160px 90px 110px;
      padding: 14px 20px; align-items: center;
      border-top: 1px solid #f1f5f9; font-size: 13px; color: #374151;
      transition: background 0.1s;
    }
    .table-row:hover { background: #fafbfc; }
    .order-num { font-family: monospace; font-size: 12px; color: #2563eb; font-weight: 600; }
    .customer-name { font-weight: 600; color: #0f172a; }
    .phone { color: #64748b; }
    .store-tag { font-size: 12px; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; color: #374151; }

    .pill { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
    .pill-green { background: #ecfdf5; color: #059669; }
    .pill-red { background: #fef2f2; color: #dc2626; }

    .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; text-transform: capitalize; }
    .status-pending { background: #fffbeb; color: #b45309; }
    .status-in_progress { background: #eff6ff; color: #1d4ed8; }
    .status-ready { background: #ecfdf5; color: #059669; }
    .status-completed { background: #f0fdf4; color: #16a34a; }
    .status-cancelled { background: #fef2f2; color: #dc2626; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; padding:16px; border-top:1px solid #f1f5f9; }
    .pagination button { padding:8px 16px; border:1px solid #e2e8f0; border-radius:8px; background:white; cursor:pointer; font-family:inherit; font-size:13px; }
    .pagination button:disabled { opacity:.5; cursor:not-allowed; }
    .pagination span { font-size:13px; color:#64748b; }

    .quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .ql-card {
      display: flex; align-items: center; gap: 12px;
      background: white; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 18px 20px; text-decoration: none; color: #374151; font-size: 14px; font-weight: 600;
      transition: all 0.2s;
    }
    .ql-card svg { width: 20px; height: 20px; color: #2563eb; flex-shrink: 0; }
    .ql-card:hover { border-color: #2563eb; color: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  `]
})
export class RetailDashboardComponent implements OnInit {
  data: RetailDashboardData | null = null;
  loading = true;
  today = new Date();
  currentPage = 1;
  get totalPages() { return Math.max(1, Math.ceil((this.data?.stats.todayPickups || 0) / 25)); }

  constructor(private ordersService: OrdersService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  changePage(page: number) { this.currentPage = page; this.loadDashboard(); }

  loadDashboard() {
    this.loading = true;
    this.ordersService.getRetailDashboard(this.currentPage).subscribe({
      next: (data) => { this.data = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
