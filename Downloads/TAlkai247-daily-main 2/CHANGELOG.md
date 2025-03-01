# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Most Recent Changes (2024-12-15)
#### Server-Side Changes
- Added OpenRouter API proxy endpoints in `server/index.js`:
  - New `/api/openrouter/models` endpoint for fetching available models
    - Implements proper error handling and validation
    - Returns sanitized model data to the client
  - New `/api/openrouter/chat` endpoint for chat completions
    - Handles request/response proxying with proper headers
    - Includes detailed error logging and response validation
  - Added OpenRouter API key validation and error handling
  - Improved CORS configuration for local development

#### Client-Side Changes
- Updated OpenRouter API client in `src/lib/api/openrouter.ts`:
  - Removed direct API calls to OpenRouter API
  - Implemented proxy endpoint communication
  - Updated response handling and error management
  - Added proper TypeScript types for API responses
- Modified AssistantCard component to handle API changes:
  - Updated model fetching logic
  - Improved error state handling
  - Added loading states for API requests

#### Security Improvements
- Moved all OpenRouter API key handling to server-side
- Removed client-side API key usage
- Added proper request validation and sanitization

### Added
- Server-side proxy endpoints for OpenRouter API integration
  - Added `/api/openrouter/models` endpoint for fetching available models
  - Added `/api/openrouter/chat` endpoint for chat completions
  - Added proper error handling and logging for OpenRouter endpoints
- OpenRouter API integration for LLM model selection
- Dropdown menus in AssistantCard for LLM provider and model selection
- Voice configuration in AssistantCard with provider selection
- Real-time voice chat testing interface
- Created new `ModelSelectionCard` component (`src/components/LLM/ModelSelectionCard.tsx`) for consistent model selection UI
- Added voice configuration display and editing in AssistantCard (`src/components/Assistants/AssistantCard.tsx`)
- Added Tools tab in AssistantCard for managing assistant tools
- Assistant Templates database model and API endpoints
  - New `AssistantTemplate` model in Prisma schema
  - CRUD endpoints for managing templates
  - Support for system and user-created templates
  - Access control for template management
  - Soft deletion support for templates
- Assistant deletion functionality
  - New deletion route with proper error handling
  - Confirmation dialog in UI
  - Automatic UI refresh after deletion
- Voice sample playback functionality in Assistant Wizard
  - Added play/pause controls directly in voice cards
  - Implemented proper audio handling with automatic stop when switching voices
  - Added volume control for voice samples

### Changed
- Updated OpenRouter API client to use proxy endpoints
  - Removed direct API calls to OpenRouter
  - Now using server's proxy endpoints through `VITE_API_URL`
  - Simplified API client by removing headers (now handled by server)
- Updated AssistantCard UI with tabbed interface for model, voice, and testing
- Enhanced error handling for API integrations
- Improved voice settings controls with sliders and real-time feedback
- Updated AssistantCard (`src/components/Assistants/AssistantCard.tsx`) to include four main tabs:
  - Model: For LLM provider and model selection
  - Voice: For voice provider and voice selection
  - Tools: For managing assistant tools
  - Test: For testing the assistant with voice/text
- Server configuration
  - Updated to use ES modules syntax
  - Improved error handling
  - Added proper CORS configuration
- Assistant creation process
  - Moved from hardcoded templates to database-driven approach
  - Added validation for required fields
  - Improved error messages
- Improved Assistant Wizard UI/UX
  - Redesigned voice selection step with provider-based filtering
  - Added provider selection buttons for easier voice browsing
  - Moved voice sample controls to individual cards for better usability
  - Improved voice card selection visual feedback across all providers

### Fixed
- CORS issues with OpenRouter API by implementing server-side proxy
- Network errors when fetching models from OpenRouter API
- Improved error handling and user feedback in AssistantCard
- Voice settings persistence in AssistantCard
- Model selection state management
- Improved error handling in model fetching
- Enhanced voice provider selection UI
- Added loading states for voice and model fetching
- Assistant deletion API returning 404 errors
- Template handling in assistant creation
- TypeScript compilation issues
- Assistant Creation and Editing
  - Fixed 500 Internal Server Error during assistant creation
  - Added proper user ID validation in assistant routes
  - Fixed provider and model information not showing in final review step
  - Corrected Deepgram voice card selection highlighting
  - Fixed voice sample playback issues across different providers
  - Implemented proper cleanup of audio playback when switching voices

### Known Issues (To Be Fixed)
1. AssistantCard Component (`src/components/Assistants/AssistantCard.tsx`):
   - LLM Providers and Models edit functionality not working properly
   - Delete assistant functionality is malfunctioning
   - Voice tab needs refinement in edit mode
   - Model tab needs proper error handling and loading states

2. Assistant Wizard (`src/components/AssistantWizard/ReviewStep.tsx`):
   - Review step does not properly display selected LLM Provider and Model from previous steps
   - Need to ensure all selected configurations are properly passed to the review step

### Security
- Moved OpenRouter API key handling to server-side to prevent exposure

### Technical Debt
- Implement comprehensive error handling for all API endpoints
- Add loading states for asynchronous operations
- Improve type safety across components
- Add unit tests for critical components
- Implement proper API response caching
- Set up proper testing framework
- Implement CI/CD pipeline
- Add documentation for all components
- Set up proper logging system
- Implement proper security measures
- Need to implement proper error boundaries for AssistantCard component
- Improve type safety across assistant-related components
- Add proper validation for voice and model selection
- Implement comprehensive testing for assistant creation and editing flows

### Next Steps

### High Priority
1. Template System Enhancement
   - Create seed file for initial system templates
   - Update frontend to fetch templates from API
   - Add template management UI for admins
   - Implement template versioning

2. Assistant Management
   - Add bulk operations for assistants
   - Implement assistant search and filtering
   - Add assistant categories/tags

3. User Experience
   - Add loading states for all operations
   - Improve error messaging
   - Add success notifications

### Future Considerations
- Consider reintroducing TypeScript for better type safety
- Add analytics for template usage
- Implement template sharing between users
- Add template categories and search functionality

### Future Objectives

#### Call Management System
- Implement multiple phone number support for outbound calls
- Add inbound call whisper activation
- Develop automatic whisper enablement for calls with goals
- Create dynamic phone number selection interface
- Add advanced volume control slider
- Implement call recording with playback capability
- Develop web search integration during calls

#### Analytics & Reporting
- Implement real-time sentiment analysis timeline
- Add goal completion tracking
- Develop whisper effectiveness metrics
- Create customer engagement scoring system
- Build comprehensive call summaries
- Add AI-driven performance feedback
- Implement success metrics tracking

#### Resource Management
- Create active resources panel with file management
- Implement URL integration and document analysis
- Develop real-time resource suggestions
- Add content relevance scoring
- Build quick reference system

#### Contact Integration
- Implement business/personal contact categorization
- Add advanced search functionality
- Create contact history tracking
- Develop goal association system
- Add communication preferences management
- Build relationship status tracking

#### Team Management
- Develop team member invitation workflow
- Implement role-based access control system
- Add team performance analytics
- Create team resource sharing system

#### Campaign Management
- Implement goal assignment to campaigns
- Add success metrics tracking
- Create campaign-specific templates
- Develop campaign analytics dashboard

#### Integration Features
- Implement CSV import/export functionality
- Add contact merging capabilities
- Create API integrations for third-party services
- Develop webhook system for external integrations

#### LLM Integration Enhancements
- Research and implement local alternative to OpenRouter
  - Maintain provider and model information capabilities
  - Ensure adaptability for different implementations
  - Add configuration options for local deployment
- Enhance model selection interface
  - Standardize UI between wizard and assistant card
  - Add model details and capabilities display
  - Implement model performance metrics
- Improve wizard-to-card transition
  - Ensure seamless data transfer of LLM selections
  - Add validation for selected models
  - Implement fallback options for unavailable models

#### UI Consistency Improvements
- Standardize LLM selection interface
  - Match wizard and assistant card layouts
  - Maintain consistent visual styling
  - Implement shared component library
- Enhance wizard review step
  - Add LLM provider and model information
  - Display all selected options clearly
  - Add configuration validation
- Implement shared UI components
  - Create reusable LLM selection components
  - Standardize dropdown menus and selectors
  - Maintain consistent styling across interfaces

## [0.0.0] - 2024-12-15
### Added
- Initial project setup with Vite and React
- Basic project structure and dependencies
- Integration with various AI and voice services:
  - Deepgram for speech-to-text
  - ElevenLabs for text-to-speech
  - PlayHT for voice synthesis
  - OpenRouter for LLM access
- Basic UI components using Radix UI
- Assistant management system
- Voice chat capabilities
- Environment configuration

### Technical Debt
- Set up proper testing framework
- Implement CI/CD pipeline
- Add documentation for all components
- Set up proper logging system
- Implement proper security measures
