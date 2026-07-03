import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login';
import { HomeComponent } from './features/dashboard/pages/home/home';
import { OrderCartComponent } from './features/orders/pages/order-cart/order-cart';
import { OrderHistoryComponent } from './features/orders/pages/order-history/order-history';
import { CatalogComponent } from './features/products/pages/catalog/catalog';
import { SettingsComponent } from './features/settings/pages/settings/settings';
import { KitchenDisplayComponent } from './features/orders/pages/kitchen-display/kitchen-display';
import { MenuAdminComponent } from './features/settings/pages/menu-admin/menu-admin';
import { DashboardComponent } from './features/dashboard/pages/dashboard/dashboard';
import { AdminDataComponent } from './features/dashboard/pages/admin-data/admin-data';
import { ExtrasAdminComponent } from './features/settings/pages/extras-admin/extras-admin';
import { TablesAdminComponent } from './features/settings/pages/tables-admin/tables-admin';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'catalogo', component: CatalogComponent },
  { path: 'pedido', component: OrderCartComponent },
  { path: 'historial', component: OrderHistoryComponent },
  { path: 'configuracion', component: SettingsComponent },
  { path: 'cocina', component: KitchenDisplayComponent },
  { path: 'menu-admin', component: MenuAdminComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'datos-admin', component: AdminDataComponent },
  { path: 'extras-admin', component: ExtrasAdminComponent },
  { path: 'mesas-admin', component: TablesAdminComponent },
  { path: '**', redirectTo: 'catalogo' },
];
