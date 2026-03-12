import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Activity Log</h1><p>{{ total }} events recorded</p></div>
      </div>
      <div class="table-card">
        <div *ngIf="loading" class="loading-wrap"><div class="spinner"></div></div>
        <div *ngIf="!loading && logs.length === 0" class="empty">No activity recorded yet.</div>
        <div *ngIf="!loading && logs.length > 0">
          <div class="table-head">
            <span>Time</span><span>Order</span><span>Customer</span><span>Action</span><span>Description</span><span>By</span>
          </div>
          <div class="table-row" *ngFor="let log of logs">
            <span class="time">{{ log.created_at | date:'d MMM y, h:mm a' }}</span>
            <span class="order-num">{{ log.order_number }}</span>
            <span class="customer">{{ log.customer_name }}</span>
            <span><span class="action-badge action-{{ log.action }}">{{ getActionLabel(log.action) }}</span></span>
            <span class="desc">{{ log.description }}</span>
            <span class="by">{{ log.changed_by_name }}</span>
          </div>
        </div>
        <div class="pagination" *ngIf="totalPages > 1">
          <button [disabled]="currentPage===1" (click)="changePage(currentPage-1)">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button [disabled]="currentPage===totalPages" (click)="changePage(currentPage+1)">Next</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:32px; max-width:1200px; }
    .page-header { margin-bottom:24px; }
    .page-header h1 { font-size:26px; font-weight:700; color:#0f172a; margin:0 0 4px; }
    .page-header p { color:#64748b; font-size:14px; margin:0; }
    .table-card { background:white; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; }
    .loading-wrap { display:flex; justify-content:center; padding:60px; }
    .spinner { width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#7c3aed; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty { text-align:center; padding:60px; color:#94a3b8; font-size:14px; }
    .table-head { display:grid; grid-template-columns:160px 130px 130px 100px 1fr 130px; padding:10px 20px; background:#f8fafc; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; }
    .table-row { display:grid; grid-template-columns:160px 130px 130px 100px 1fr 130px; padding:13px 20px; align-items:center; border-top:1px solid #f1f5f9; font-size:13px; color:#374151; transition:background 0.1s; }
    .table-row:hover { background:#fafbfc; }
    .time { font-size:12px; color:#94a3b8; }
    .order-num { font-family:monospace; font-size:12px; color:#2563eb; font-weight:600; }
    .customer { font-weight:600; color:#0f172a; }
    .desc { font-size:12px; color:#64748b; }
    .by { font-size:12px; color:#374151; font-weight:500; }
    .action-badge { font-size:11px; font-weight:700; padding:3px 8px; border-radius:20px; }
    .action-created { background:#ecfdf5; color:#059669; }
    .action-edited { background:#eff6ff; color:#2563eb; }
    .action-status_changed { background:#fffbeb; color:#b45309; }
    .action-received { background:#f5f3ff; color:#7c3aed; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; padding:16px; border-top:1px solid #f1f5f9; }
    .pagination button { padding:8px 16px; border:1px solid #e2e8f0; border-radius:8px; background:white; cursor:pointer; font-family:inherit; font-size:13px; }
    .pagination button:disabled { opacity:0.5; cursor:not-allowed; }
    .pagination span { font-size:13px; color:#64748b; }
  `]
})
export class AdminActivityComponent implements OnInit {
  logs: any[] = [];
  total = 0;
  currentPage = 1;
  loading = true;
  get totalPages() { return Math.ceil(this.total / 50); }
  constructor(private adminService: AdminService) {}
  ngOnInit() { this.loadLogs(); }
  changePage(p: number) { this.currentPage = p; this.loadLogs(); }
  getActionLabel(action: string): string {
    const map: any = { created:'Created', edited:'Edited', status_changed:'Status', received:'Received' };
    return map[action] || action;
  }
  loadLogs() {
    this.loading = true;
    this.adminService.getActivityLog(this.currentPage).subscribe({
      next: r => { this.logs = r.logs; this.total = r.total; this.loading = false; },
      error: () => this.loading = false
    });
  }
}
