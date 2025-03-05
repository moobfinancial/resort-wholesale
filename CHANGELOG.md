# Changelog

All notable changes to the Resort project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed module loading issue in `src/components/dashboard/Dashboard.tsx`
  - Corrected import syntax for Settings component to resolve MIME type error
  - Changed `import Settings as SettingsPanel from './Settings'` to `import { default as SettingsPanel } from './Settings'`

### Security
- Fixed npm audit vulnerabilities by running `npm audit fix`
  - Added 1 package
  - Changed 4 packages
  - Resolved all vulnerabilities (previously 4 vulnerabilities: 1 low, 2 moderate, 1 high)

### Added
- Business profile management in Settings
  - Added form validation using Zod
  - Added loading states and error handling
  - Added success/error notifications
  - Added business information fields:
    - Business Name
    - Business Address
    - Business Phone
    - Business Email
    - Tax ID
    - Business Type
- New API endpoint for business profile updates
- Business verification system
  - Document upload component with drag-and-drop support
  - File type validation and size limits
  - Upload progress indicators
  - Business verification status tracking
  - Required document checklist
  - Verification status display
- New API endpoints:
  - /api/business-verification for document submission
  - /api/business-verification/status for status checking
- Business verification system implementation
  - Document upload functionality with support for PDF, JPG, and PNG files
  - Server-side validation and error handling
  - Secure file storage with UUID-based naming
  - Express server setup with TypeScript and ESM support
  - API endpoints for document submission and verification status
- Debug logging for better development experience
- CORS configuration for secure API access
- Uploads directory structure for business documents
- Product variant management functionality
  - Added ProductVariant model to Prisma schema
  - Created ProductVariantManager component
  - Implemented API endpoints for variant management
  - Added support for variant attributes (color, size, etc.) with dynamic attribute management
  - Integrated with product form for seamless variant creation and editing
- Complete bulk pricing implementation
  - Added BulkPricingManager component integration with API
  - Implemented dedicated API endpoints for bulk pricing management
  - Created bulkPricingService for centralized business logic
  - Added bulk pricing tier management to product editing page
  - Implemented unit pricing calculation based on order quantity
- Updated product management UI to support variants and bulk pricing
  - Enhanced ProductForm component to include variant and pricing management
  - Improved UI layout for better user experience
  - Added validation for variant and pricing inputs
- Customer-facing product variant selection
  - Implemented variant selection UI in ProductDetail page
  - Added dynamic attribute selection based on available variants
  - Updated product images and pricing based on selected variants
  - Enhanced user experience with loading states and validation
- Bulk pricing display for customers
  - Added bulk pricing tier display on product detail page
  - Implemented quantity-based price calculation 
  - Added API endpoint for calculating product prices by quantity
  - Updated UI to show price updates based on quantity changes
- Inventory management system
  - Added robust stock tracking for products and variants
  - Implemented inventory update during order processing
  - Added stock validation before order placement
  - Created centralized orderService for consistent inventory operations
- Inventory reporting features
  - Added low stock reporting with customizable thresholds
  - Implemented inventory valuation reporting with category breakdowns
  - Added inventory turnover analysis based on order history
  - Created dedicated API endpoints for all inventory reports

### Changed
- Updated server configuration to use ESM modules
- Improved error handling in API responses
- Enhanced TypeScript configuration for better type safety

### Fixed
- Server startup issues with ES modules
- File upload error handling
- CORS-related issues in development environment
- Fixed module loading issue in `src/components/dashboard/Dashboard.tsx`
  - Corrected import syntax for Settings component to resolve MIME type error
  - Changed `import Settings as SettingsPanel from './Settings'` to `import { default as SettingsPanel } from './Settings'`

### Project Structure
Current project structure includes:
- Frontend Components:
  - Authentication components (`auth/`)
  - Dashboard components (`dashboard/`)
  - Admin components (`admin/`)
  - Core components:
    - `Header.tsx`
    - `Footer.tsx`
    - `Hero.tsx`
    - `ProductCard.tsx`
    - `ProductCollage.tsx`
    - `FeaturedCategories.tsx`
    - `JustArrived.tsx`
    - `Newsletter.tsx`
    - `Testimonials.tsx`
    - `WelcomeSection.tsx`

### Development Environment
- Using Vite v5.4.14 as development server
- TypeScript React project setup
- Development server running on port 5174 (fallback from 5173)
