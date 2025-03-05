# Resort Fresh Application Sitemap

## Frontend Structure (Public)

### Main Pages
1. **Home** (`/`) - `/src/pages/Home.tsx`
   - Components:
     - Hero
     - WelcomeSection
     - FeaturedCategories
     - JustArrived (New Products)
     - Testimonials
     - Newsletter

2. **Products** (`/products`) - `/src/pages/Products.tsx`
   - List of all products with filtering capabilities

3. **Product Detail** (`/products/:id`) - `/src/pages/ProductDetail.tsx`
   - Detailed product information
   - Related products

4. **Collections** (`/collections`) - `/src/pages/Collections.tsx`
   - List of all product collections

5. **Collection Detail** (`/collections/:id`) - `/src/pages/CollectionDetail.tsx`
   - Products belonging to a specific collection

6. **About Us** (`/about`) - `/src/pages/AboutUs.tsx`
   - Company information and story

7. **Contact Us** (`/contact`) - `/src/pages/ContactUs.tsx`
   - Contact form and information

### Authentication
- **Sign In** (`/login`) - `/src/components/auth/SignIn.tsx`
- **Sign Up** (`/signup`) - `/src/components/auth/SignUp.tsx`

### Reusable Components
- **Layout** - `/src/components/Layout.tsx`
- **Header** - `/src/components/Header.tsx`
- **Footer** - `/src/components/Footer.tsx`
- **ProductCard** - `/src/components/ProductCard.tsx`
- **CollectionCard** - `/src/components/CollectionCard.tsx`
- **FeaturedCategories** - `/src/components/FeaturedCategories.tsx`
- **ErrorBoundary** - `/src/components/ErrorBoundary.tsx`

## Admin Dashboard

### Authentication
1. **Login** (`/admin/login`) - `/src/admin/pages/Login.tsx`

### Main Dashboard
1. **Overview** (`/admin`) - `/src/admin/pages/Dashboard.tsx`
   - Stats, quick actions, and summary data

### Product Management
1. **Product List** (`/admin/products`) - `/src/components/admin/products/ProductList.tsx`
2. **Add Product** (`/admin/products/new`) - `/src/components/admin/products/ProductForm.tsx`
3. **View Product** (`/admin/products/:id`) - `/src/components/admin/products/ProductView.tsx`
4. **Edit Product** (`/admin/products/:id/edit`) - `/src/components/admin/products/EditProduct.tsx`

### Inventory Management
1. **Inventory List** (`/admin/inventory`) - `/src/components/admin/inventory/InventoryList.tsx`
2. **Stock Adjustment** (`/admin/inventory/adjust`) - `/src/components/admin/inventory/StockAdjustment.tsx`
3. **Specific Stock Adjustment** (`/admin/inventory/adjust/:id`) - `/src/components/admin/inventory/StockAdjustment.tsx`
4. **Inventory Reports** (`/admin/inventory-reports`) - `/src/components/admin/inventory/InventoryReports.tsx`
   - Low stock report
   - Inventory valuation
   - Inventory turnover
   - Category breakdown

### Order Management
1. **Orders** (`/admin/orders`) - `/src/admin/pages/Orders.tsx`

### Customer Management
1. **Customer List** (`/admin/customers`) - `/src/admin/pages/customers/CustomerList.tsx`
2. **Customer Details** (`/admin/customers/:id`) - `/src/admin/pages/customers/CustomerDetails.tsx`

### Supplier Management
1. **Supplier List** (`/admin/suppliers`) - `/src/admin/pages/suppliers/SupplierManagement.tsx`
2. **New Supplier Order** (`/admin/suppliers/:supplierId/orders/new`) - `/src/admin/pages/suppliers/SupplierOrderForm.tsx`
3. **View/Edit Supplier Order** (`/admin/suppliers/:supplierId/orders/:orderId`) - `/src/admin/pages/suppliers/SupplierOrderForm.tsx`

### Collection Management
1. **Collection Management** (`/admin/collections`) - `/src/admin/pages/collections/CollectionManagement.tsx`
2. **Collection Products** (`/admin/collections/:id/products`) - `/src/admin/pages/collections/CollectionProducts.tsx`

### Settings
1. **Settings** (`/admin/settings`) - `/src/admin/pages/Settings.tsx`

## Customer Dashboard

1. **Customer Dashboard** (`/customer/dashboard`) - `/src/pages/customer/Dashboard.tsx`
2. **Orders** (`/customer/orders`) - `/src/pages/customer/Orders.tsx`
3. **Documents** (`/customer/documents`) - `/src/pages/customer/Documents.tsx`
4. **Profile** (`/customer/profile`) - `/src/pages/customer/Profile.tsx`
5. **Register** (`/customer/register`) - `/src/pages/customer/Register.tsx`

## API Structure

### Frontend API Endpoints
- **Products API** (`/src/api/products.ts`)
- **Collections API** (`/src/api/collections.ts`)
- **Business API** (`/src/api/business.ts`)
- **Business Verification API** (`/src/api/businessVerification.ts`)
- **Inventory API** (`/src/api/inventory.ts`)
  - Get inventory status
  - Update inventory level
  - Get low stock report
  - Get inventory valuation
  - Get inventory turnover report

### Backend Routes
1. **Admin Routes** (`/src/server/routes/admin.ts`)
2. **Authentication** (`/src/server/routes/auth.ts` and `/src/server/routes/customerAuth.ts`)
3. **Business Customers** (`/src/server/routes/business-customers.ts`)
4. **Business Verification** (`/src/server/routes/businessVerification.ts`)
5. **Collections** (`/src/server/routes/collections.ts`)
6. **Customers** (`/src/server/routes/customers.ts`)
7. **Documents** (`/src/server/routes/documents.ts`)
8. **Inventory** (`/src/server/routes/inventory.ts`)
9. **Orders** (`/src/server/routes/orders.ts`)
10. **Products** (`/src/server/routes/products.ts`)
11. **Supplier Orders** (`/src/server/routes/supplierOrders.ts`)
12. **Suppliers** (`/src/server/routes/suppliers.ts`)

## Data Stores & Hooks

### Stores (Zustand)
1. **Admin Auth Store** (`/src/stores/adminAuth.ts`)
2. **Auth Store** (`/src/stores/authStore.ts`)
3. **Cart Store** (`/src/stores/cartStore.ts`)
4. **Customer Auth Store** (`/src/stores/customerAuth.ts`)
5. **Frontend Product Store** (`/src/stores/frontendProductStore.ts`)
6. **Product Store** (`/src/stores/productStore.ts`)
7. **Inventory Store** (`/src/stores/inventoryStore.ts`)

### Custom Hooks
1. **useSuppliers** (`/src/hooks/useSuppliers.ts`) - Fetches supplier data with proper request cancellation
2. **useBusinessForm** (`/src/hooks/useBusinessForm.ts`)
3. **useImageAnalysis** (`/src/hooks/useImageAnalysis.ts`)
4. **useInventory** (`/src/hooks/useInventory.ts`) - Fetches inventory data with proper request cancellation

## Utility Functions

1. **API Utilities** (`/src/utils/api.ts`) - Axios instance with interceptors for authentication and error handling
2. **Format Utilities** (`/src/utils/format.ts`) - General formatting utilities
3. **Price Formatters** (`/src/utils/formatters.ts`) - Specialized formatting for prices and currency
4. **Inventory Utilities** (`/src/utils/inventory.ts`) - Inventory-related utility functions

## Database Schema (Prisma)

### Key Models
1. **User** - Admin users with roles
2. **Customer** - Business customers with verification flow
3. **Product** - Product information with inventory management
4. **Order** - Customer orders and items
5. **Collection** - Product groupings/collections
6. **Supplier** - Supplier information
7. **SupplierOrder** - Orders placed with suppliers
8. **Inventory** - Inventory levels and history

## Potential Duplications and Concerns

1. **Price Formatting**
   - The new `formatters.ts` utility should be used consistently across the application instead of inline formatting logic to prevent "is not a function" errors

2. **API Request Cancellation**
   - The updated `useSuppliers.ts` hook with proper Axios cancel token implementation should be used as a pattern for all data fetching hooks

3. **Similar Components**
   - There may be overlap between:
     - `FeaturedCategories` and collections rendering in other components
     - Various product listing components across the application

4. **Routes Structure**
   - Some routes may have shifted or been updated without removing old route definitions
