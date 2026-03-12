import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SystemSettings } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = `${environment.apiUrl}/admin`;
  constructor(private http: HttpClient) {}

  getSettings(): Observable<SystemSettings> { return this.http.get<SystemSettings>(`${this.API}/settings`); }
  updateSetting(key: string, value: string): Observable<any> { return this.http.patch(`${this.API}/settings/${key}`, { value }); }
  getAllStores(): Observable<any[]> { return this.http.get<any[]>(`${this.API}/stores`); }
  registerStore(data: any): Observable<any> { return this.http.post(`${this.API}/stores`, data); }
  toggleStore(id: string): Observable<any> { return this.http.patch(`${this.API}/stores/${id}/toggle`, {}); }
  deleteStore(id: string): Observable<any> { return this.http.delete(`${this.API}/stores/${id}`); }
  resetPassword(id: string, newPassword: string): Observable<any> { return this.http.put(`${this.API}/stores/${id}/reset-password`, { newPassword }); }
  getActivityLog(page: number = 1): Observable<any> {
    return this.http.get(`${this.API}/activity?page=${page}&limit=50`);
  }
}
