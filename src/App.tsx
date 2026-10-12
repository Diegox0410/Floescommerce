import { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import {
  StoreLayout,
} from "./components/layout/StoreLayout";

import {
  Home,
} from "./pages/Home";

import {
  Catalog,
} from "./pages/Catalog";

import {
  ProductDetail,
} from "./pages/ProductDetail";

import {
  Cart,
} from "./pages/Cart";

import {
  Checkout,
} from "./pages/Checkout";

import {
  OrderSuccess,
} from "./pages/OrderSuccess";

import {
  NotFound,
} from "./pages/NotFound";

const AdminLayout = lazy(() => import('./admin/layout/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminProductEditor = lazy(() => import('./admin/pages/AdminProductEditor').then((module) => ({ default: module.AdminProductEditor })));
const AdminCustomerDetail = lazy(() => import('./admin/pages/AdminCustomerDetail').then((module) => ({ default: module.AdminCustomerDetail })));
const AdminProducts = lazy(() => import('./admin/pages/AdminProducts').then((module) => ({ default: module.AdminProducts })));
const AdminInventory = lazy(() => import('./admin/pages/AdminInventory').then((module) => ({ default: module.AdminInventory })));
const AdminOrders = lazy(() => import('./admin/pages/AdminOrders').then((module) => ({ default: module.AdminOrders })));
const AdminCustomers = lazy(() => import('./admin/pages/AdminCustomers').then((module) => ({ default: module.AdminCustomers })));
const AdminFinance = lazy(() => import('./admin/pages/AdminFinance').then((module) => ({ default: module.AdminFinance })));
const AdminProjection = lazy(() => import('./admin/pages/AdminProjection').then((module) => ({ default: module.AdminProjection })));
const AdminAnalytics = lazy(() => import('./admin/pages/AdminAnalytics').then((module) => ({ default: module.AdminAnalytics })));
const AdminMarketing = lazy(() => import('./admin/pages/AdminMarketing').then((module) => ({ default: module.AdminMarketing })));
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings').then((module) => ({ default: module.AdminSettings })));
const AdminStore = lazy(() => import('./admin/pages/AdminStore').then((module) => ({ default: module.AdminStore })));
const VisualReviewPage = import.meta.env.DEV
  ? lazy(() => import('./pages/VisualReviewPage').then((module) => ({ default: module.VisualReviewPage })))
  : null;

function AdminLoading() {
  return <div className="admin-card admin-module" role="status" aria-live="polite">Cargando administración…</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {import.meta.env.DEV && VisualReviewPage && (
          <Route path="/__visual-review" element={<Suspense fallback={<div role="status">Cargando revisión visual…</div>}><VisualReviewPage /></Suspense>} />
        )}

        <Route
          element={
            <StoreLayout />
          }
        >
          <Route
            path="/"
            element={
              <Home />
            }
          />

          <Route
            path="/catalogo"
            element={
              <Catalog />
            }
          />

          <Route
            path="/producto/:id"
            element={
              <ProductDetail />
            }
          />

          <Route
            path="/carrito"
            element={
              <Cart />
            }
          />

          <Route
            path="/checkout"
            element={
              <Checkout />
            }
          />

          <Route
            path="/pedido-confirmado"
            element={
              <OrderSuccess />
            }
          />

          <Route
            path="*"
            element={
              <NotFound />
            }
          />

        </Route>

        <Route path="/admin" element={<Suspense fallback={<AdminLoading />}><AdminLayout /></Suspense>}>
          <Route index element={<AdminDashboard />} />
          <Route path="productos/nuevo" element={<AdminProductEditor />} />
          <Route path="productos/:id" element={<AdminProductEditor />} />
          <Route path="pedidos/:id" element={<AdminOrders />} />
          <Route path="clientes/:id" element={<AdminCustomerDetail />} />
          <Route path="productos" element={<AdminProducts />} />
          <Route path="inventario" element={<AdminInventory />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="clientes" element={<AdminCustomers />} />
          <Route path="finanzas" element={<AdminFinance />} />
          <Route path="proyeccion" element={<AdminProjection />} />
          <Route path="analitica" element={<AdminAnalytics />} />
          <Route path="marketing" element={<AdminMarketing />} />
          <Route path="tienda" element={<AdminStore />} />
          <Route path="configuracion" element={<AdminSettings />} />
          <Route path="*" element={<div className="admin-card admin-module"><h1>Módulo no encontrado</h1><a href="/admin">Volver al dashboard</a></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
