import { AdminProductEditor } from './admin/pages/AdminProductEditor';
import { AdminCustomerDetail } from './admin/pages/AdminCustomerDetail';
import { AdminLayout } from './admin/layout/AdminLayout';
import { AdminDashboard } from './admin/pages/AdminDashboard';
import { AdminProducts } from './admin/pages/AdminProducts';
import { AdminInventory } from './admin/pages/AdminInventory';
import { AdminOrders } from './admin/pages/AdminOrders';
import { AdminCustomers } from './admin/pages/AdminCustomers';
import { AdminFinance } from './admin/pages/AdminFinance';
import { AdminProjection } from './admin/pages/AdminProjection';
import { AdminAnalytics } from './admin/pages/AdminAnalytics';
import { AdminMarketing } from './admin/pages/AdminMarketing';
import { AdminSettings } from './admin/pages/AdminSettings';
import { AdminStore } from './admin/pages/AdminStore';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>

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

        <Route path="/admin" element={<AdminLayout />}>
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
