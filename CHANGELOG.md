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
