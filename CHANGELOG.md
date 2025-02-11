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
