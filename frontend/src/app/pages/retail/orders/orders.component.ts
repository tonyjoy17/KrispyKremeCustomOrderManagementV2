import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../../services/orders.service';
import { Order } from '../../../models';

@Component({
  selector: 'app-retail-orders',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Orders</h1>
          <p>{{ total }} orders found</p>
        </div>
        <button class="btn-primary" (click)="router.navigate(['/retail/new-order'])">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
          New Order
        </button>
      </div>

      <!-- Search + Date bar -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
          <input type="text" placeholder="Search by name or phone..." [(ngModel)]="searchText" (ngModelChange)="onSearchChange()" />
          <button *ngIf="searchText" class="clear-btn" (click)="clearSearch()">✕</button>
        </div>
        <div class="date-input-wrap">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
          <input type="date" [(ngModel)]="selectedDate" (ngModelChange)="onDateChange()" placeholder="Filter by date" />
          <button *ngIf="selectedDate" class="clear-btn" (click)="clearDate()">✕</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <button *ngFor="let f of filters" class="filter-btn" [class.active]="activeFilter === f.value"
          (click)="setFilter(f.value)">{{ f.label }}</button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-wrap">
        <div class="loading-spinner"></div>
      </div>

      <!-- Orders Table -->
      <div *ngIf="!loading" class="table-card">
        <div *ngIf="orders.length === 0" class="empty-state">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clip-rule="evenodd"/></svg>
          <p>No orders found</p>
        </div>

        <div *ngIf="orders.length > 0">
          <div class="table-head">
            <span>Order #</span>
            <span>Customer</span>
            <span>Phone</span>
            <span>Order Details</span>
            <span>Pickup Date</span>
            <span>Pickup Store</span>
            <span>Payment</span>
            <span>Status</span>
          </div>
          <div class="table-row" *ngFor="let order of orders" (click)="viewOrder(order.id)">
            <span class="order-num">{{ order.order_number || order.orderNumber }}</span>
            <span class="customer-name">{{ order.customer_name || order.customerName }}</span>
            <span class="phone">{{ order.customer_phone || order.customerPhone }}</span>
            <span class="details-preview" [title]="(order.order_details || order.orderDetails) || ''">
              {{ (order.order_details || order.orderDetails) | slice:0:55 }}{{ ((order.order_details || order.orderDetails) || '').length > 55 ? '...' : '' }}
            </span>
            <span class="date">{{ (order.pickup_date || order.pickupDate) | date:'d MMM y' }}</span>
            <span class="store-tag">{{ order.pickup_store_name || order.pickupStoreName }}</span>
            <span>
              <span class="pill" [class.pill-green]="order.is_paid || order.isPaid" [class.pill-red]="!(order.is_paid || order.isPaid)">
                {{ (order.is_paid || order.isPaid) ? 'Paid' : 'Unpaid' }}
              </span>
            </span>
            <span>
              <span class="status-badge status-{{ order.status }}">{{ order.status | titlecase }}</span>
            </span>
            <span class="view-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
            </span>
          </div>
        </div>

        <div class="pagination" *ngIf="totalPages > 1">
          <button [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">Next</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1200px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .page-header h1 { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.5px; }
    .page-header p { color: #64748b; font-size: 14px; margin: 0; }

    .btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #2563eb; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .btn-primary svg { width: 18px; height: 18px; }
    .btn-primary:hover { background: #1d4ed8; }

    /* Search + Date */
    .search-bar { display: flex; gap: 12px; margin-bottom: 14px; }
    .search-input-wrap, .date-input-wrap {
      display: flex; align-items: center; gap: 10px;
      background: white; border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 0 12px; transition: border 0.15s;
    }
    .search-input-wrap { flex: 1; }
    .search-input-wrap:focus-within, .date-input-wrap:focus-within { border-color: #2563eb; }
    .search-input-wrap svg, .date-input-wrap svg { width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }
    .search-input-wrap input { flex: 1; border: none; outline: none; font-size: 14px; padding: 10px 0; background: transparent; font-family: inherit; color: #0f172a; }
    .date-input-wrap input { border: none; outline: none; font-size: 14px; padding: 10px 0; background: transparent; font-family: inherit; color: #0f172a; }
    .clear-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 13px; padding: 2px 4px; border-radius: 4px; }
    .clear-btn:hover { color: #374151; background: #f1f5f9; }

    .filter-bar { display: flex; gap: 8px; margin-bottom: 20px; }
    .filter-btn { padding: 8px 16px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: white; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
    .filter-btn:hover { border-color: #94a3b8; color: #374151; }
    .filter-btn.active { background: #2563eb; color: white; border-color: #2563eb; }

    .loading-wrap { display: flex; justify-content: center; padding: 60px; }
    .loading-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #94a3b8; gap: 10px; }
    .empty-state svg { width: 40px; height: 40px; }
    .empty-state p { font-size: 14px; margin: 0; }

    .table-head {
      display: grid; grid-template-columns: 145px 130px 115px 1fr 105px 135px 75px 105px 30px;
      padding: 10px 20px; background: #f8fafc;
      font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .table-row {
      display: grid; grid-template-columns: 145px 130px 115px 1fr 105px 135px 75px 105px 30px;
      padding: 13px 20px; align-items: center;
      border-top: 1px solid #f1f5f9; font-size: 13px; color: #374151;
      transition: background 0.1s; cursor: pointer;
    }
    .table-row:hover { background: #f0f7ff; }
    .view-icon { color: #cbd5e1; display: flex; align-items: center; }
    .view-icon svg { width: 16px; height: 16px; }
    .table-row:hover .view-icon { color: #2563eb; }

    .order-num { font-family: monospace; font-size: 12px; color: #2563eb; font-weight: 600; }
    .customer-name { font-weight: 600; color: #0f172a; }
    .phone { color: #64748b; }
    .details-preview { color: #64748b; font-size: 12px; }
    .date { color: #374151; font-size: 13px; }
    .store-tag { font-size: 12px; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; display: inline-block; }

    .pill { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
    .pill-green { background: #ecfdf5; color: #059669; }
    .pill-red { background: #fef2f2; color: #dc2626; }

    .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
    .status-pending { background: #fffbeb; color: #b45309; }
    .status-in_progress { background: #eff6ff; color: #1d4ed8; }
    .status-ready { background: #ecfdf5; color: #059669; }
    .status-completed { background: #f0fdf4; color: #16a34a; }
    .status-cancelled { background: #fef2f2; color: #dc2626; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid #f1f5f9; }
    .pagination button { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-family: inherit; font-size: 13px; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination span { font-size: 13px; color: #64748b; }
  `]
})
export class RetailOrdersComponent implements OnInit {
  orders: Order[] = [];
  total = 0;
  currentPage = 1;
  loading = false;
  activeFilter = 'all';
  searchText = '';
  selectedDate = '';
  private searchTimer: any;

  filters = [
    { label: 'All Orders', value: 'all' },
    { label: "Today's Pickups", value: 'today' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Past Orders', value: 'past' },
  ];

  get totalPages() { return Math.ceil(this.total / 20); }

  constructor(private ordersService: OrdersService, private route: ActivatedRoute, public router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe((p) => {
      if (p['filter']) this.activeFilter = p['filter'];
      this.loadOrders();
    });
  }

  setFilter(filter: string) { this.activeFilter = filter; this.currentPage = 1; this.loadOrders(); }
  changePage(page: number) { this.currentPage = page; this.loadOrders(); }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage = 1; this.loadOrders(); }, 350);
  }

  onDateChange() { this.currentPage = 1; this.loadOrders(); }
  clearSearch() { this.searchText = ''; this.currentPage = 1; this.loadOrders(); }
  clearDate() { this.selectedDate = ''; this.currentPage = 1; this.loadOrders(); }

  viewOrder(id: string | undefined) {
    if (id) this.router.navigate(['/retail/orders', id]);
  }

  loadOrders() {
    this.loading = true;
    this.ordersService.getRetailOrders(this.activeFilter, this.currentPage, this.searchText, this.selectedDate).subscribe({
      next: (res) => { this.orders = res.orders; this.total = res.total; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
