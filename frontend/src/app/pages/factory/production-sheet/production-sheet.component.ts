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
    <div class="page" [class.printing-labels]="printMode === 'labels'">
      <div class="toolbar no-print">
        <div><h1>Daily Production Sheet</h1><p>Select a pickup date, review the list, then print it.</p></div>
        <div class="actions">
          <input type="date" [(ngModel)]="selectedDate" (ngModelChange)="load()" />
          <button (click)="print()" [disabled]="loading || !orders.length">Print Sheet</button>
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
          <thead><tr><th class="check">Done</th><th>Order #</th><th>Dozen</th><th>Order details</th><th>Customer / phone</th><th>From</th><th>Pickup store</th><th>Time</th><th>Paid</th><th class="no-print">Label</th></tr></thead>
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
            <td class="no-print"><button class="print-label-button" (click)="printLabel(order.id)">Print Label</button></td>
          </tr></tbody>
          <tfoot><tr><td colspan="2">TOTAL</td><td class="dozen">{{ totalDozen }}</td><td colspan="6">{{ totalOrders }} orders</td><td class="no-print"></td></tr></tfoot>
        </table>

        <footer><span>Production supervisor: ____________________</span><span>Completed at: __________</span><span>Page checklist complete: &#9633;</span></footer>
      </section>

      <section class="order-labels">
        <article class="order-label" *ngFor="let order of orders" [class.selected-label]="order.id === selectedLabelId">
          <header class="label-header">
            <div><span class="label-brand">Krispy Kreme SA</span><strong>{{ order.order_number || order.orderNumber }}</strong></div>
            <div class="label-quantity"><b>{{ order.total_dozen ?? order.totalDozen }}</b><span>DOZEN</span></div>
          </header>
          <div class="label-pickup"><strong>{{ (order.pickup_date || order.pickupDate) | date:'EEE d MMM y' }}</strong><strong>{{ formatTime(order.pickup_time || order.pickupTime) }}</strong></div>
          <div class="label-field"><span>Pickup account</span><b>{{ order.pickup_store_name || order.pickupStoreName }}</b></div>
          <div class="label-field"><span>Customer</span><b>{{ order.customer_name || order.customerName }}</b><small>{{ order.customer_phone || order.customerPhone }}</small></div>
          <div class="label-details"><span>Order details</span><p>{{ order.order_details || order.orderDetails }}</p></div>
          <footer class="label-footer"><span>Paid: <b>{{ (order.is_paid ?? order.isPaid) ? 'YES' : 'NO' }}</b></span><span>Made &#9633;</span><span>Checked &#9633;</span></footer>
        </article>
      </section>

    </div>
  `,
  styles: [`
    .page{padding:32px;max-width:1400px;color:#111827}.toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}.toolbar h1{margin:0 0 4px;font-size:26px}.toolbar p{margin:0;color:#64748b;font-size:14px}.actions{display:flex;gap:10px;flex-wrap:wrap}.actions input,.actions button{padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font:inherit}.actions button{background:#c8102e;color:#fff;border-color:#c8102e;font-weight:700;cursor:pointer}.actions button.secondary{background:#fff;color:#475569}.actions button.secondary.selected{background:#fff1f2;color:#c8102e;border-color:#c8102e}.actions button:disabled{opacity:.6}.loading,.error{padding:40px;text-align:center;background:#fff;border:1px solid #e2e8f0;border-radius:12px}.error{color:#b91c1c}.sheet{background:#fff;border:1px solid #d1d5db;padding:26px}.sheet header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #c8102e;padding-bottom:14px}.brand{color:#c8102e;font-weight:800;font-size:18px}.sheet h2{font-size:27px;margin:4px 0 0}.sheet-date{text-align:right;font-size:12px;color:#64748b}.sheet-date strong{font-size:16px;color:#111827}.summary{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #d1d5db;margin:18px 0}.summary div{display:flex;justify-content:space-between;padding:11px 14px;border-right:1px solid #d1d5db}.summary div:last-child{border:0}.summary span{color:#64748b;font-size:12px;text-transform:uppercase}.summary strong{font-size:15px}.empty{padding:50px;text-align:center;border:1px dashed #9ca3af}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px}th,td{border:1px solid #9ca3af;padding:7px;vertical-align:top;text-align:left;overflow-wrap:anywhere}th{background:#e5e7eb;font-size:10px;text-transform:uppercase}th:nth-child(2){width:105px}th:nth-child(3){width:48px}th:nth-child(4){width:30%}th:nth-child(5){width:130px}th:nth-child(6),th:nth-child(7){width:100px}th:nth-child(8){width:55px}th:nth-child(9){width:42px}.check{width:35px;text-align:center}.box{display:inline-block;width:16px;height:16px;border:2px solid #111}.order-number{font-family:monospace;font-weight:700}.dozen{text-align:center;font-size:15px;font-weight:800}.details{white-space:pre-wrap;line-height:1.35}small{color:#4b5563}tfoot td{font-weight:800;background:#f3f4f6}footer{display:flex;justify-content:space-between;margin-top:24px;padding-top:14px;border-top:1px solid #9ca3af;font-size:11px}.labels-view{background:#eef2f6;padding:20px}.labels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.label{background:#fff;border:2px solid #111827;border-radius:8px;padding:14px;min-height:250px;display:flex;flex-direction:column;break-inside:avoid}.label-head{display:flex;justify-content:space-between;border-bottom:3px solid #c8102e;padding-bottom:8px}.label-head>div:first-child{display:flex;flex-direction:column}.label-brand{color:#c8102e;font-size:12px;font-weight:800}.label-head strong{font:800 19px monospace;margin-top:3px}.quantity{text-align:center;display:flex;flex-direction:column}.quantity b{font-size:27px;line-height:1}.quantity span,.label span{font-size:9px;text-transform:uppercase;letter-spacing:.05em}.pickup-line{display:flex;justify-content:space-between;background:#111827;color:#fff;padding:7px 9px;margin:9px 0;font-size:14px}.label-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.label-grid div{display:flex;flex-direction:column}.label-grid span,.label-details span{color:#64748b;margin-bottom:3px}.label-grid b{font-size:13px}.label-grid small{margin-top:2px}.label-details{border:1px solid #94a3b8;padding:7px;margin-top:9px;flex:1}.label-details p{white-space:pre-wrap;margin:3px 0;font-size:12px;line-height:1.25}.label-foot{display:flex;justify-content:space-between;border-top:1px solid #94a3b8;margin-top:8px;padding-top:7px}.label-foot span{font-size:10px}.label-foot b{font-size:11px}
    @media(max-width:900px){.toolbar{align-items:flex-start;gap:15px;flex-direction:column}.labels{grid-template-columns:1fr}}
    .print-label-button{border:1px solid #c8102e;border-radius:6px;background:#fff;color:#c8102e;font-size:10px;font-weight:700;padding:6px 8px;white-space:nowrap;cursor:pointer}.order-labels{display:none}.order-label{box-sizing:border-box;color:#000;font-family:Arial,sans-serif}.label-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #000;padding-bottom:3mm}.label-header>div:first-child{display:flex;flex-direction:column}.label-brand{font-size:11pt;font-weight:700}.label-header strong{font:800 18pt monospace;margin-top:2mm}.label-quantity{display:flex;flex-direction:column;text-align:center}.label-quantity b{font-size:28pt;line-height:.9}.label-quantity span,.label-field span,.label-details span,.label-footer span{font-size:9pt;text-transform:uppercase}.label-pickup{display:flex;justify-content:space-between;background:#000;color:#fff;padding:3mm;margin:3mm 0;font-size:14pt}.label-field{display:flex;flex-direction:column;border-bottom:1px solid #777;padding:2mm 0}.label-field b{font-size:13pt}.label-field small{font-size:10pt;margin-top:1mm}.label-details{border:2px solid #000;padding:3mm;margin-top:3mm;flex:1}.label-details p{font-size:12pt;font-weight:600;line-height:1.3;margin:2mm 0;white-space:pre-wrap}.label-footer{display:flex;justify-content:space-between;border-top:2px solid #000;padding-top:3mm;margin-top:3mm}.label-footer span{font-size:10pt}
    @media print{.no-print{display:none!important}.page{padding:0;max-width:none}.sheet{border:0;padding:0}.sheet header{margin-top:0}body{background:#fff}thead{display:table-header-group}tfoot{display:table-row-group}tr{break-inside:avoid;page-break-inside:avoid}.printing-labels .sheet{display:none!important}.printing-labels .order-labels{display:block}.printing-labels .order-label{display:none}.printing-labels .order-label.selected-label{width:4in;height:6in;padding:.18in;display:flex;flex-direction:column;overflow:hidden}@page{size:A4 landscape;margin:8mm}}
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
  printMode: 'sheet' | 'labels' = 'sheet';
  selectedLabelId = '';

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

  print() { this.printMode = 'sheet'; this.printedAt = new Date(); setTimeout(() => window.print()); }
  printLabel(orderId: string) {
    this.printMode = 'labels';
    this.selectedLabelId = orderId;
    const pageStyle = document.createElement('style');
    pageStyle.id = 'zebra-label-page-size';
    pageStyle.textContent = '@page { size: 4in 6in; margin: 0; }';
    document.head.appendChild(pageStyle);
    const reset = () => {
      this.printMode = 'sheet';
      this.selectedLabelId = '';
      pageStyle.remove();
      window.removeEventListener('afterprint', reset);
    };
    window.addEventListener('afterprint', reset);
    setTimeout(() => window.print());
  }
  formatTime(value?: string) {
    if (!value) return 'Any';
    const [hour, minute] = value.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }
  private dateOffset(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
}
