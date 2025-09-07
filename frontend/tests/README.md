# E2E Tests - CS2 Skin Tracker

This directory contains end-to-end tests for the CS2 Skin Tracker application using Playwright.

## Test Structure

```
tests/
├── e2e.spec.ts           # Main smoke tests
├── guards.spec.ts        # Authentication and authorization tests
├── features.spec.ts      # Feature-specific tests
├── helpers/
│   ├── auth.ts          # Authentication helper functions
│   └── api.ts           # API mocking helper functions
└── README.md            # This file
```

## Test Categories

### 1. Smoke Tests (`e2e.spec.ts`)
- Basic application functionality
- Critical user flows
- Error handling
- Responsive design
- Performance tests

### 2. Guard Tests (`guards.spec.ts`)
- Authentication guards
- Role-based access control
- Premium feature guards
- Session management
- Error boundaries

### 3. Feature Tests (`features.spec.ts`)
- Portfolio features
- Skins functionality
- Watchlist management
- Admin features
- Responsive design
- Performance tests

## Running Tests

### Local Development

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch

## Test Helpers

### AuthHelper
- `mockAuthenticatedUser(role, tier)` - Mock authenticated user
- `mockUnauthenticatedUser()` - Mock unauthenticated state
- `expectRedirectToSignIn()` - Check redirect to sign-in
- `expectRedirectToDashboard()` - Check redirect to dashboard

### ApiHelper
- `mockApiResponse(url, response, status)` - Mock API responses
- `mockApiError(url, status, message)` - Mock API errors
- `mockNetworkFailure()` - Simulate network failure
- `mockSkinsApi(skins)` - Mock skins API
- `mockPortfolioApi(portfolio)` - Mock portfolio API
- `mockAdminApi(metrics)` - Mock admin API

## Test Data

Tests use mock data to ensure consistent results:
- Mock user authentication states
- Mock API responses
- Mock skin data
- Mock portfolio data
- Mock admin metrics

## Guard Testing

The tests specifically focus on guard functionality:

### Authentication Guards
- Unauthenticated users redirected to sign-in
- Protected routes require authentication
- Public routes accessible without authentication

### Role-Based Guards
- Admin routes require admin role
- Regular users blocked from admin areas
- Appropriate error messages for insufficient permissions

### Premium Feature Guards
- Premium features hidden for free users
- Upgrade prompts shown for free users
- Premium features visible for premium users

## Best Practices

1. **Test Isolation**: Each test is independent
2. **Mock Data**: Use consistent mock data
3. **Error Handling**: Test error scenarios
4. **Responsive Design**: Test on multiple viewports
5. **Performance**: Monitor load times
6. **Accessibility**: Ensure proper test IDs

## Debugging

### Common Issues

1. **Test Timeouts**: Increase timeout in config
2. **Element Not Found**: Check test IDs in components
3. **API Mocking**: Verify mock data structure
4. **Authentication**: Check mock auth state

### Debug Commands

```bash
# Run specific test file
npx playwright test guards.spec.ts

# Run specific test
npx playwright test --grep "should protect portfolio route"

# Debug mode
npx playwright test --debug

# Show trace
npx playwright show-trace trace.zip
```

## Contributing

When adding new tests:

1. Follow existing naming conventions
2. Use appropriate test IDs in components
3. Mock all external dependencies
4. Test both success and error scenarios
5. Update this README if needed

## Test Coverage

Current test coverage includes:
- ✅ Authentication flows
- ✅ Authorization checks
- ✅ Premium feature guards
- ✅ Core user flows
- ✅ Error handling
- ✅ Responsive design
- ✅ Performance monitoring
- ✅ Admin functionality
- ✅ Portfolio features
- ✅ Skins functionality
- ✅ Watchlist management
