import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../models';
import { OrdersService } from '../../../services/orders.service';

@Component({
  selector: 'app-production-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page">
      <div class="toolbar no-print">
        <div><h1>Daily Production Sheet</h1><p>Select a pickup date, review the list, then print it.</p></div>
        <div class="actions">
          <input type="date" [(ngModel)]="selectedDate" (ngModelChange)="load()" />
          <button (click)="print()" [disabled]="loading">Print Sheet</button>
        </div>
      </div>

      <div *ngIf="loading" class="loading no-print">Loading production orders...</div>
      <div *ngIf="error" class="error no-print">{{ error }}</div>

      <section *ngIf="!loading && !error" class="sheet">
        <header>
          <div><div class="brand">Krispy Kreme SA</div><h2>Daily Production Sheet</h2></div>
          <div class="sheet-date">Pickup date<br><strong>{{ selectedDate | date:'EEEE, d MMMM y' }}</strong></div>
        </header>

        <div class="summary">
          <div><span>Total orders</span><strong>{{ totalOrders }}</strong></div>
          <div><span>Total dozen</span><strong>{{ totalDozen }}</strong></div>
          <div><span>Printed</span><strong>{{ printedAt | date:'d MMM y, h:mm a' }}</strong></div>
        </div>

        <div *ngIf="orders.length === 0" class="empty">No production orders for this date.</div>
        <table *ngIf="orders.length">
          <thead><tr><th class="check">Done</th><th>Order #</th><th>Dozen</th><th>Order details</th><th>Customer / phone</th><th>From</th><th>Pickup store</th><th>Time</th><th>Paid</th></tr></thead>
          <tbody><tr *ngFor="let order of orders">
            <td class="check"><span class="box"></span></td>
            <td class="order-number">{{ order.order_number || order.orderNumber }}</td>
            <td class="dozen">{{ order.total_dozen ?? order.totalDozen }}</td>
            <td class="details">{{ order.order_details || order.orderDetails }}</td>
            <td>{{ order.customer_name || order.customerName }}<br><small>{{ order.customer_phone || order.customerPhone }}</small></td>
            <td>{{ order.store_name || order.storeName }}</td>
            <td>{{ order.pickup_store_name || order.pickupStoreName }}</td>
            <td>{{ formatTime(order.pickup_time || order.pickupTime) }}</td>
            <td>{{ (order.is_paid ?? order.isPaid) ? 'Yes' : 'No' }}</td>
          </tr></tbody>
          <tfoot><tr><td colspan="2">TOTAL</td><td class="dozen">{{ totalDozen }}</td><td colspan="6">{{ totalOrders }} orders</td></tr></tfoot>
        </table>

        <footer><span>Production supervisor: ____________________</span><span>Completed at: __________</span><span>Page checklist complete: &#9633;</span></footer>
      </section>
    </div>
  `,
  styles: [`
    .page{padding:32px;max-width:1400px;color:#111827}.toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}.toolbar h1{margin:0 0 4px;font-size:26px}.toolbar p{margin:0;color:#64748b;font-size:14px}.actions{display:flex;gap:10px}.actions input,.actions button{padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font:inherit}.actions button{background:#c8102e;color:#fff;border-color:#c8102e;font-weight:700;cursor:pointer}.actions button:disabled{opacity:.6}.loading,.error{padding:40px;text-align:center;background:#fff;border:1px solid #e2e8f0;border-radius:12px}.error{color:#b91c1c}.sheet{background:#fff;border:1px solid #d1d5db;padding:26px}.sheet header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #c8102e;padding-bottom:14px}.brand{color:#c8102e;font-weight:800;font-size:18px}.sheet h2{font-size:27px;margin:4px 0 0}.sheet-date{text-align:right;font-size:12px;color:#64748b}.sheet-date strong{font-size:16px;color:#111827}.summary{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #d1d5db;margin:18px 0}.summary div{display:flex;justify-content:space-between;padding:11px 14px;border-right:1px solid #d1d5db}.summary div:last-child{border:0}.summary span{color:#64748b;font-size:12px;text-transform:uppercase}.summary strong{font-size:15px}.empty{padding:50px;text-align:center;border:1px dashed #9ca3af}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px}th,td{border:1px solid #9ca3af;padding:7px;vertical-align:top;text-align:left;overflow-wrap:anywhere}th{background:#e5e7eb;font-size:10px;text-transform:uppercase}th:nth-child(2){width:105px}th:nth-child(3){width:48px}th:nth-child(4){width:30%}th:nth-child(5){width:130px}th:nth-child(6),th:nth-child(7){width:100px}th:nth-child(8){width:55px}th:nth-child(9){width:42px}.check{width:35px;text-align:center}.box{display:inline-block;width:16px;height:16px;border:2px solid #111}.order-number{font-family:monospace;font-weight:700}.dozen{text-align:center;font-size:15px;font-weight:800}.details{white-space:pre-wrap;line-height:1.35}small{color:#4b5563}tfoot td{font-weight:800;background:#f3f4f6}footer{display:flex;justify-content:space-between;margin-top:24px;padding-top:14px;border-top:1px solid #9ca3af;font-size:11px}
    @media print{.no-print{display:none!important}.page{padding:0;max-width:none}.sheet{border:0;padding:0}.sheet header{margin-top:0}body{background:#fff}@page{size:A4 landscape;margin:10mm}thead{display:table-header-group}tfoot{display:table-row-group}tr{break-inside:avoid;page-break-inside:avoid}}
  `]
})
export class ProductionSheetComponent implements OnInit {
  selectedDate = this.dateOffset(1);
  orders: Order[] = [];
  totalOrders = 0;
  totalDozen = 0;
  loading = false;
  error = '';
  printedAt = new Date();

  constructor(private ordersService: OrdersService) {}
  ngOnInit() { this.load(); }

  load() {
    if (!this.selectedDate) return;
    this.loading = true; this.error = '';
    this.ordersService.getProductionSheet(this.selectedDate).subscribe({
      next: result => { this.orders = result.orders; this.totalOrders = result.totalOrders; this.totalDozen = result.totalDozen; this.loading = false; },
      error: response => { this.error = response.error?.message || 'Could not load the production sheet.'; this.loading = false; },
    });
  }

  print() { this.printedAt = new Date(); setTimeout(() => window.print()); }
  formatTime(value?: string) {
    if (!value) return 'Any';
    const [hour, minute] = value.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }
  private dateOffset(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
}
