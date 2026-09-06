import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, Order, OrderHistory, OrdersResponse, RetailDashboardData, FactoryDashboardData } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly API = `${environment.apiUrl}/orders`;
  constructor(private http: HttpClient) {}

  createOrder(request: CreateOrderRequest): Observable<any> {
    const formData = new FormData();
    formData.append('customerName', request.customerName);
    formData.append('customerPhone', request.customerPhone);
    if (request.customerEmail) formData.append('customerEmail', request.customerEmail);
    formData.append('orderDetails', request.orderDetails);
    formData.append('isPaid', String(request.isPaid));
    formData.append('pickupStoreId', request.pickupStoreId);
    formData.append('pickupDate', request.pickupDate);
    if (request.pickupTime) formData.append('pickupTime', request.pickupTime);
    if (request.totalPrice !== undefined && request.totalPrice !== null) formData.append('totalPrice', String(request.totalPrice));
    if (request.orderStoreId) formData.append('orderStoreId', request.orderStoreId);
    if (request.referenceImage) formData.append('referenceImage', request.referenceImage);
    return this.http.post(this.API, formData);
  }

  editOrder(id: string, data: any): Observable<any> { return this.http.put(`${this.API}/${id}/edit`, data); }
  markOrderReceived(id: string): Observable<any> { return this.http.put(`${this.API}/${id}/received`, {}); }
  getOrderHistory(id: string): Observable<OrderHistory[]> { return this.http.get<OrderHistory[]>(`${this.API}/${id}/history`); }

  getRetailDashboard(): Observable<RetailDashboardData> { return this.http.get<RetailDashboardData>(`${this.API}/retail/dashboard`); }

  getRetailOrders(filter='all', page=1, search='', date=''): Observable<OrdersResponse> {
    let params = new HttpParams().set('filter', filter).set('page', page).set('limit', 20);
    if (search) params = params.set('search', search);
    if (date) params = params.set('date', date);
    return this.http.get<OrdersResponse>(`${this.API}/retail/orders`, { params });
  }

  getFactoryDashboard(): Observable<FactoryDashboardData> { return this.http.get<FactoryDashboardData>(`${this.API}/factory/dashboard`); }

  getFactoryOrders(filter='all', page=1, storeId?: string, search='', date=''): Observable<OrdersResponse> {
    let params = new HttpParams().set('filter', filter).set('page', page).set('limit', 20);
    if (storeId) params = params.set('storeId', storeId);
    if (search) params = params.set('search', search);
    if (date) params = params.set('date', date);
    return this.http.get<OrdersResponse>(`${this.API}/factory/orders`, { params });
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> { return this.http.put(`${this.API}/${orderId}/status`, { status }); }
  deleteOrder(id: string): Observable<any> { return this.http.delete(`${this.API}/${id}`); }
  getOrder(id: string): Observable<Order> { return this.http.get<Order>(`${this.API}/${id}`); }
  getImageUrl(filename: string): string {
    return /^https?:\/\//i.test(filename) ? filename : `${environment.apiUrl.replace('/api','')}/uploads/${filename}`;
  }
}
