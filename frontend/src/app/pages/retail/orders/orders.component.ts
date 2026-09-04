import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { OrdersService } from '../../../services/orders.service';
import { Order } from '../../../models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>My Orders</h1><p>{{ total }} orders total</p></div>
      </div>

      <div class="filters">
        <div class="filter-tabs">
          <button *ngFor="let f of filters" class="filter-tab" [class.active]="currentFilter===f.val" (click)="setFilter(f.val)">{{ f.label }}</button>
        </div>
        <div class="search-row">
          <div class="search-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)" placeholder="Search by name or phone..." />
          </div>
          <div class="date-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            <input type="date" [(ngModel)]="dateFilter" (ngModelChange)="loadOrders()" />
            <button *ngIf="dateFilter" class="clear-date" (click)="clearDate()">×</button>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading-wrap"><div class="spinner"></div></div>
      <div *ngIf="!loading && orders.length === 0" class="empty">
        <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="24" fill="#f1f5f9"/><path d="M16 18h16M16 24h10M16 30h13" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/></svg>
        <p>No orders found</p>
      </div>

      <div *ngIf="!loading && orders.length > 0" class="orders-list">
        <div class="order-row" *ngFor="let o of orders" (click)="viewOrder(o)">
          <div class="order-left">
            <div class="order-num">{{ o.order_number }}</div>
            <div class="customer-name">{{ o.customer_name }}</div>
            <div class="customer-phone">{{ o.customer_phone }}</div>
          </div>
          <div class="order-mid">
            <div class="pickup-info">
              <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
              {{ o.pickup_store_name }}
            </div>
            <div class="pickup-date">
              <svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M5 0a1 1 0 00-1 1v1H3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2h-1V1a1 1 0 10-2 0v1H5V1a1 1 0 00-1-1zm0 5a1 1 0 000 2h6a1 1 0 100-2H5z" clip-rule="evenodd"/></svg>
              {{ o.pickup_date | date:'d MMM y' }}
            </div>
          </div>
          <div class="order-right">
            <span class="status-badge status-{{ o.status }}">{{ getStatus(o.status) }}</span>
            <span class="paid-badge" [class.paid]="o.is_paid" [class.unpaid]="!o.is_paid">{{ o.is_paid ? 'Paid' : 'Unpaid' }}</span>
            <div class="notified-tag" *ngIf="o.customer_notified">✉ Notified</div>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button [disabled]="currentPage===1" (click)="changePage(currentPage-1)">← Prev</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button [disabled]="currentPage===totalPages" (click)="changePage(currentPage+1)">Next →</button>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:32px; font-family:'DM Sans',system-ui,sans-serif; }
    .page-header { margin-bottom:20px; }
    .page-header h1 { font-size:26px; font-weight:700; color:#0f172a; margin:0 0 4px; }
    .page-header p { color:#64748b; font-size:14px; margin:0; }
    .filters { display:flex; flex-direction:column; gap:12px; margin-bottom:20px; }
    .filter-tabs { display:flex; gap:6px; flex-wrap:wrap; }
    .filter-tab { padding:7px 14px; border:1.5px solid #e2e8f0; border-radius:20px; background:white; color:#64748b; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.15s; }
    .filter-tab.active { background:#2563eb; color:white; border-color:#2563eb; font-weight:600; }
    .search-row { display:flex; gap:10px; }
    .search-wrap { display:flex; align-items:center; gap:8px; border:1.5px solid #e2e8f0; border-radius:10px; padding:0 12px; background:white; flex:1; }
    .search-wrap svg { width:16px; height:16px; color:#94a3b8; flex-shrink:0; }
    .search-wrap input { flex:1; border:none; outline:none; padding:10px 0; font-size:14px; font-family:inherit; color:#0f172a; }
    .date-wrap { display:flex; align-items:center; gap:6px; border:1.5px solid #e2e8f0; border-radius:10px; padding:0 10px; background:white; }
    .date-wrap svg { width:16px; height:16px; color:#94a3b8; flex-shrink:0; }
    .date-wrap input { border:none; outline:none; padding:10px 0; font-size:14px; font-family:inherit; color:#0f172a; }
    .clear-date { border:none; background:none; color:#94a3b8; font-size:18px; cursor:pointer; padding:0 4px; line-height:1; }
    .loading-wrap { display:flex; justify-content:center; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#2563eb; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px; color:#94a3b8; }
    .empty svg { width:48px; height:48px; flex:0 0 48px; display:block; }
    .empty p { margin:0; font-size:14px; }
    .orders-list { display:flex; flex-direction:column; gap:8px; }
    .order-row { display:flex; align-items:center; gap:16px; background:white; border:1px solid #e2e8f0; border-radius:12px; padding:16px 20px; cursor:pointer; transition:all 0.15s; }
    .order-row:hover { border-color:#2563eb; box-shadow:0 2px 8px rgba(37,99,235,0.1); }
    .order-left { min-width:180px; }
    .order-num { font-size:13px; font-family:monospace; color:#2563eb; font-weight:600; margin-bottom:3px; }
    .customer-name { font-size:15px; font-weight:600; color:#0f172a; margin-bottom:2px; }
    .customer-phone { font-size:12px; color:#94a3b8; }
    .order-mid { flex:1; display:flex; gap:20px; }
    .pickup-info, .pickup-date { display:flex; align-items:center; gap:5px; font-size:13px; color:#64748b; }
    .pickup-info svg, .pickup-date svg { width:13px; height:13px; flex-shrink:0; }
    .order-right { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .status-badge { font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; }
    .status-pending { background:#fffbeb; color:#b45309; }
    .status-in_progress { background:#eff6ff; color:#2563eb; }
    .status-ready { background:#ecfdf5; color:#059669; }
    .status-completed { background:#f0fdf4; color:#15803d; }
    .status-cancelled { background:#fef2f2; color:#dc2626; }
    .paid-badge { font-size:11px; font-weight:600; padding:4px 10px; border-radius:20px; }
    .paid-badge.paid { background:#ecfdf5; color:#059669; }
    .paid-badge.unpaid { background:#fef2f2; color:#dc2626; }
    .notified-tag { font-size:11px; color:#7c3aed; background:#f5f3ff; padding:4px 8px; border-radius:20px; font-weight:600; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:24px; }
    .pagination button { padding:8px 16px; border:1px solid #e2e8f0; border-radius:8px; background:white; cursor:pointer; font-family:inherit; font-size:13px; }
    .pagination button:disabled { opacity:0.5; cursor:not-allowed; }
    .pagination span { font-size:13px; color:#64748b; }
  `]
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  total = 0;
  currentPage = 1;
  loading = false;
  currentFilter = 'all';
  searchQuery = '';
  dateFilter = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  filters = [
    { val: 'all', label: 'All' },
    { val: 'today', label: 'Today' },
    { val: 'upcoming', label: 'Upcoming' },
    { val: 'past', label: 'Past' },
  ];
  get totalPages() { return Math.ceil(this.total / 20); }

  constructor(private ordersService: OrdersService, private router: Router) {}

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage = 1; this.loadOrders(); });
    this.loadOrders();
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  setFilter(f: string) { this.currentFilter = f; this.dateFilter = ''; this.currentPage = 1; this.loadOrders(); }
  onSearch(v: string) { this.searchSubject.next(v); }
  clearDate() { this.dateFilter = ''; this.loadOrders(); }
  changePage(p: number) { this.currentPage = p; this.loadOrders(); }
  viewOrder(o: Order) { this.router.navigate(['/retail/orders', o.id]); }
  getStatus(s: string) { return { pending:'Pending', in_progress:'In Progress', ready:'Ready', completed:'Completed', cancelled:'Cancelled' }[s] || s; }

  loadOrders() {
    this.loading = true;
    this.ordersService.getRetailOrders(this.currentFilter, this.currentPage, this.searchQuery, this.dateFilter)
      .subscribe({ next: r => { this.orders = r.orders; this.total = r.total; this.loading = false; }, error: () => this.loading = false });
  }
}
