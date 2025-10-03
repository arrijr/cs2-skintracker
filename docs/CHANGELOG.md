# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation for skin detail page
- Case system documentation with API endpoints
- CaseSection component documentation
- Backend wake-up mechanism for free plan sleep issues

### Fixed
- CORS errors preventing frontend-backend communication
- Case skins not displaying due to backend sleep issues
- Case name mismatch between frontend and backend
- 503 Service Unavailable errors on free plan

### Changed
- Updated case name normalization logic in backend
- Improved error handling in CaseSection component
- Enhanced CORS configuration with dual-layer protection

## [0.1.0] - 2025-10-03

### Added
- Initial skin detail page implementation
- CaseSection component for displaying related skins
- Dynamic case generation based on weapon types
- API endpoints for case information and related skins
- CORS configuration for cross-origin requests
- Error handling and loading states
- Responsive design for mobile and desktop

### Technical Details
- **Frontend**: Next.js 14 with App Router, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js with Prisma ORM, PostgreSQL database
- **Deployment**: Vercel (frontend), Render (backend)
- **Authentication**: Clerk integration
- **Styling**: Tailwind CSS with custom components

### API Endpoints
- `GET /api/v1/skins/[skinId]` - Get skin details
- `GET /api/v1/skins/[skinId]/case-info` - Get case information
- `GET /api/v1/cases/by-name/[name]/skins` - Get skins from case
- `GET /api/v1/skins/presets` - Get available weapon types

### Case System
- Dynamic collection generation based on weapon types
- Support for 8 different collections (Pistol, Rifle, SMG, etc.)
- Automatic case detection for individual skins
- Related skins display with responsive grid layout

### Known Issues
- Backend may sleep on free plan (resolved with wake-up mechanism)
- CORS configuration may need adjustment for new domains
- Case images are placeholder (not implemented yet)

### Future Enhancements
- Case overview page for browsing all collections
- Enhanced filtering and sorting options
- Real-time price updates
- Advanced search functionality
- Mobile app integration