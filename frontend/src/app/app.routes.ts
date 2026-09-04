import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },

  // Admin
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'stores', pathMatch: 'full' },
      { path: 'new-order', loadComponent: () => import('./pages/retail/new-order/new-order.component').then(m => m.NewOrderComponent) },
      { path: 'orders', loadComponent: () => import('./pages/factory/orders/factory-orders.component').then(m => m.FactoryOrdersComponent) },
      { path: 'orders/:id', loadComponent: () => import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
      { path: 'stores', loadComponent: () => import('./pages/admin/admin-stores.component').then(m => m.AdminStoresComponent) },
      { path: 'settings', loadComponent: () => import('./pages/admin/admin-settings.component').then(m => m.AdminSettingsComponent) },
      { path: 'activity', loadComponent: () => import('./pages/admin/admin-activity.component').then(m => m.AdminActivityComponent) },
    ]
  },

  // Retail
  {
    path: 'retail',
    loadComponent: () => import('./pages/retail/retail-layout.component').then(m => m.RetailLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/retail/dashboard/dashboard.component').then(m => m.RetailDashboardComponent) },
      { path: 'new-order', loadComponent: () => import('./pages/retail/new-order/new-order.component').then(m => m.NewOrderComponent) },
      { path: 'orders', loadComponent: () => import('./pages/retail/orders/orders.component').then(m => m.OrdersComponent) },
      { path: 'orders/:id', loadComponent: () => import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
      { path: 'orders/:id/edit', loadComponent: () => import('./pages/retail/edit-order/edit-order.component').then(m => m.EditOrderComponent) },
    ]
  },

  // Factory
  {
    path: 'factory',
    loadComponent: () => import('./pages/factory/factory-layout.component').then(m => m.FactoryLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/factory/dashboard/factory-dashboard.component').then(m => m.FactoryDashboardComponent) },
      { path: 'orders', loadComponent: () => import('./pages/factory/orders/factory-orders.component').then(m => m.FactoryOrdersComponent) },
      { path: 'orders/:id', loadComponent: () => import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
      { path: 'stores', loadComponent: () => import('./pages/factory/stores/stores.component').then(m => m.StoresComponent) },
    ]
  },

  { path: '**', redirectTo: '/login' }
];
