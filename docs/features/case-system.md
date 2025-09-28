# Case System Feature

## Overview

The Case System provides comprehensive case statistics and market data for CS2 cases, similar to csstonks.com.

## Features

### Case Overview (`/cases`)
- Comprehensive table with all cases
- Sorting and filtering capabilities
- Search functionality
- Real-time market data

### Case Detail (`/cases/[id]`)
- Detailed analytics and metrics
- Contained skins with rarity information
- Supply and price history
- Interactive navigation

## Technical Implementation

### Database Schema
- Case table with market data
- CaseSupply for historical supply tracking
- CasePriceHistory for price trends
- CaseSkin for case-skin relationships

### API Endpoints
- GET /api/v1/cases - All cases
- GET /api/v1/cases/:id - Case details
- GET /api/v1/cases/:id/supply - Supply history
- GET /api/v1/cases/:id/price-history - Price history
- GET /api/v1/cases/:id/skins - Contained skins

### Frontend Components
- Case overview page with sortable table
- Case detail page with tabbed interface
- Breadcrumbs component for navigation
- Responsive design for all devices

## Future Enhancements
- Interactive charts with Chart.js
- Real-time data updates
- Advanced filtering options
- Portfolio integration