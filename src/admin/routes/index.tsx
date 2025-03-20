import React, { Suspense } from "react";
import { RouteObject } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import { ProtectedRoute, PublicRoute } from "./RouteWrappers";
import Login from "../pages/Login";
import CustomerList from "../pages/customers/CustomerList";
import CustomerDetails from "../pages/customers/CustomerDetails";
import VerificationQueue from "../pages/customers/VerificationQueue";
import GeneralSettings from "../pages/settings/GeneralSettings";
import UserManagement from "../pages/settings/UserManagement";
import SupplierManagement from "../pages/settings/SupplierManagement";
import {
  BulkPricingPage,
  ProductStatusPage,
  StockManagementPage,
} from "../components/ProductManagement";

// Admin routes configuration
export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        async lazy() {
          const { default: Dashboard } = await import("../pages/Dashboard");
          return { Component: Dashboard };
        },
      },
      // Products Management
      {
        path: "products",
        children: [
          {
            index: true,
            async lazy() {
              const { default: ProductList } = await import(
                "../../components/admin/products/ProductList"
              );
              return { Component: ProductList };
            },
          },
          {
            path: "new",
            async lazy() {
              const { default: ProductForm } = await import(
                "../../components/admin/products/ProductForm"
              );
              return { Component: ProductForm };
            },
          },
          {
            path: ":id",
            async lazy() {
              const { default: ProductView } = await import(
                "../../components/admin/products/ProductView"
              );
              return { Component: ProductView };
            },
          },
          {
            path: ":id/edit",
            async lazy() {
              const { default: EditProduct } = await import(
                "../../components/admin/products/EditProduct"
              );
              return { Component: EditProduct };
            },
          },
          {
            path: ":id/bulk-pricing",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <BulkPricingPage />
              </Suspense>
            ),
          },
          {
            path: ":id/status",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <ProductStatusPage />
              </Suspense>
            ),
          },
        ],
      },
      // Inventory Management
      {
        path: "inventory",
        children: [
          {
            path: "stock",
            element: (
              <Suspense fallback={<div>Loading...</div>}>
                <StockManagementPage />
              </Suspense>
            ),
          },
          {
            path: "adjustments",
            async lazy() {
              const { default: StockAdjustment } = await import(
                "../../components/admin/inventory/StockAdjustment"
              );
              return { Component: StockAdjustment };
            },
          },
        ],
      },
      // Business Customer Management
      {
        path: "customers",
        children: [
          {
            index: true,
            element: <CustomerList />,
          },
          {
            path: ":id",
            element: <CustomerDetails />,
          },
          {
            path: "verification",
            element: <VerificationQueue />,
          },
        ],
      },
      // Order Management
      {
        path: "orders",
        children: [
          {
            index: true,
            async lazy() {
              const { default: OrderList } = await import(
                "../pages/orders/OrderList"
              );
              return { Component: OrderList };
            },
          },
          {
            path: ":id",
            async lazy() {
              const { default: OrderDetails } = await import(
                "../pages/orders/OrderDetails"
              );
              return { Component: OrderDetails };
            },
          },
        ],
      },
      // Settings
      {
        path: "settings",
        children: [
          {
            index: true,
            element: <GeneralSettings />,
          },
          {
            path: "users",
            element: <UserManagement />,
          },
          {
            path: "suppliers",
            element: <SupplierManagement />,
          },
        ],
      },
    ],
  },
  {
    path: "/admin/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
];
