// models/index.ts

export interface Store {
  id: string;
  name: string;
  // camelCase (from JWT / transformed responses)
  storeCode: string;
  isFactory?: boolean;
  isAdmin?: boolean;
  isActive?: boolean;
  createdAt?: string;
  // snake_case (API database responses)
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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  store: AuthUser;
}

export interface Order {
  id: string;
  status: OrderStatus;
  // camelCase variants
  orderNumber?: string;
  storeId?: string;
  storeName?: string;
  storeCode?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderDetails?: string;
  totalDozen?: number;
  isPaid?: boolean;
  referenceImagePath?: string;
  pickupStoreId?: string;
  pickupStoreName?: string;
  pickupStoreCode?: string;
  pickupDate?: string;
  emailSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // snake_case variants (API database responses)
  order_number?: string;
  store_id?: string;
  store_name?: string;
  store_code?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  order_details?: string;
  total_dozen?: number;
  is_paid?: boolean;
  reference_image_path?: string;
  reference_image_url?: string;
  pickup_store_id?: string;
  pickup_store_name?: string;
  pickup_store_code?: string;
  pickup_date?: string;
  email_sent?: boolean;
  created_at?: string;
  updated_at?: string;
  notes?: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderDetails: string;
  totalDozen: number;
  isPaid: boolean;
  pickupStoreId: string;
  pickupDate: string;
  referenceImage?: File;
  orderingStoreId?: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface RetailDashboardData {
  stats: {
    todayPickups: number;
    upcoming: number;
    total: number;
    paid: number;
  };
  todayOrders: Order[];
}

export interface FactoryDashboardData {
  stats: {
    tomorrowPickups: number;
    upcoming: number;
    total: number;
  };
  tomorrowOrders: Order[];
}

export interface RegisterStoreRequest {
  name: string;
  storeCode: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  address?: string;
}
