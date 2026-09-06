export interface Store {
  id: string;
  name: string;
  storeCode: string;
  isFactory?: boolean;
  isAdmin?: boolean;
  isActive?: boolean;
  createdAt?: string;
  store_code?: string;
  is_factory?: boolean;
  is_admin?: boolean;
  is_active?: boolean;
  created_at?: string;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface AuthUser {
  storeId: string;
  storeName: string;
  storeCode: string;
  username: string;
  isFactory: boolean;
  isAdmin: boolean;
}

export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { token: string; store: AuthUser; }

export interface Order {
  id: string;
  status: OrderStatus;
  orderNumber?: string; storeId?: string; storeName?: string; storeCode?: string;
  customerName?: string; customerPhone?: string; customerEmail?: string;
  orderDetails?: string; isPaid?: boolean; referenceImagePath?: string;
  pickupStoreId?: string; pickupStoreName?: string; pickupStoreCode?: string;
  pickupDate?: string; pickupTime?: string; totalPrice?: number; emailSent?: boolean; notes?: string;
  customerNotified?: boolean; customerNotifiedAt?: string;
  createdAt?: string; updatedAt?: string;
  order_number?: string; store_id?: string; store_name?: string; store_code?: string;
  customer_name?: string; customer_phone?: string; customer_email?: string;
  order_details?: string; is_paid?: boolean; reference_image_path?: string;
  pickup_store_id?: string; pickup_store_name?: string; pickup_store_code?: string;
  pickup_date?: string; pickup_time?: string; total_price?: number; email_sent?: boolean; customer_notified?: boolean;
  customer_notified_at?: string; created_at?: string; updated_at?: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';

export interface OrderHistory {
  id: string;
  order_id: string;
  action: string;
  description: string;
  changed_by_id: string;
  changed_by_name: string;
  created_at: string;
}

export interface SystemSettings {
  [key: string]: { value: string; updated_at: string; };
}

export interface CreateOrderRequest {
  customerName: string; customerPhone: string; customerEmail?: string;
  orderDetails: string; isPaid: boolean; pickupStoreId: string;
  pickupDate: string; pickupTime?: string; totalPrice?: number; referenceImage?: File; orderStoreId?: string;
}

export interface OrdersResponse { orders: Order[]; total: number; page: number; limit: number; }

export interface RetailDashboardData {
  stats: { todayPickups: number; upcoming: number; total: number; thisWeek: number; };
  todayOrders: Order[];
}

export interface FactoryDashboardData {
  stats: { tomorrowPickups: number; upcoming: number; total: number; thisWeek: number; };
  tomorrowOrders: Order[];
}

export interface RegisterStoreRequest {
  name: string; storeCode: string; username: string; password: string;
  email?: string; phone?: string; address?: string; isFactory?: boolean;
}
