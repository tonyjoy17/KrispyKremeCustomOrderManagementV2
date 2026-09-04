// services/stores.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store, RegisterStoreRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StoresService {
  private readonly API = `${environment.apiUrl}/stores`;

  constructor(private http: HttpClient) {}

  getDropdown(): Observable<Pick<Store, 'id' | 'name' | 'storeCode'>[]> {
    return this.http.get<any[]>(`${this.API}/dropdown`);
  }

  getAllStores(): Observable<Store[]> {
    return this.http.get<Store[]>(this.API);
  }

  registerStore(data: RegisterStoreRequest): Observable<any> {
    return this.http.post(this.API, data);
  }

  toggleStatus(id: string): Observable<any> {
    return this.http.patch(`${this.API}/${id}/toggle-status`, {});
  }

  resetPassword(id: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.API}/${id}/reset-password`, { newPassword });
  }
}
