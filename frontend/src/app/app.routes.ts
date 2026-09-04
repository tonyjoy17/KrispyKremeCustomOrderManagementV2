import { Routes } from '@angular/router';
import { authGuard, factoryGuard, retailGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'retail', canActivate: [retailGuard],
    loadComponent: () => import('./pages/retail/retail-layout.component').then(m => m.RetailLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/retail/dashboard/dashboard.component').then(m => m.RetailDashboardComponent) },
      { path: 'new-order', loadComponent: () => import('./pages/retail/new-order/new-order.component').then(m => m.NewOrderComponent) },
      { path: 'orders', loadComponent: () => import('./pages/retail/orders/orders.component').then(m => m.RetailOrdersComponent) },
      { path: 'orders/:id', loadComponent: () => import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
    ]
  },
  {
    path: 'factory', canActivate: [factoryGuard],
    loadComponent: () => import('./pages/factory/factory-layout.component').then(m => m.FactoryLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/factory/dashboard/factory-dashboard.component').then(m => m.FactoryDashboardComponent) },
      { path: 'new-order', loadComponent: () => import('./pages/retail/new-order/new-order.component').then(m => m.NewOrderComponent) },
      { path: 'orders', loadComponent: () => import('./pages/factory/orders/factory-orders.component').then(m => m.FactoryOrdersComponent) },
      { path: 'orders/:id', loadComponent: () => import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent) },
      { path: 'stores', loadComponent: () => import('./pages/factory/stores/stores.component').then(m => m.StoresComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
