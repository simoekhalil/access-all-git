# E2E Tests with Playwright

This directory contains end-to-end tests for the Gala DEX application using Playwright.

## Test Structure

### 1. Complete Swap Workflow (`complete-swap-workflow.spec.ts`)
- Full user journey from wallet connection to swap execution
- Token selection and validation
- Directional swap functionality
- Error handling and input validation

### 2. Visual Regression Tests (`visual-regression.spec.ts`)
- Homepage layout validation
- Wallet connection state screenshots
- Swap interface visual consistency
- Token dropdown appearance
- Mobile and dark mode screenshots

### 3. Cross-Browser Compatibility (`cross-browser-compatibility.spec.ts`)
- Tests across Chrome, Firefox, Safari
- Performance validation across browsers
- Edge case handling consistency
- Keyboard navigation support

### 4. Mobile Responsiveness (`mobile-responsiveness.spec.ts`)
- Multiple device viewport testing
- Touch interaction validation
- Scrolling behavior
- Landscape mode support
- Text scaling accessibility

### 5. Wallet Integration Simulation (`wallet-integration.spec.ts`)
- MetaMask connection simulation
- Account switching handling
- Network change responses
- Error state management
- Connection persistence

## Running the Tests

### Prerequisites
```bash
# Install Playwright browsers
npx playwright install
```

### Run All E2E Tests
```bash
npx playwright test
```

### Run Specific Test Suite
```bash
npx playwright test complete-swap-workflow
npx playwright test visual-regression
npx playwright test cross-browser-compatibility
npx playwright test mobile-responsiveness
npx playwright test wallet-integration
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run with UI Mode
```bash
npx playwright test --ui
```

### Generate Test Report
```bash
npx playwright show-report
```

## Test Configuration

The tests are configured to:
- Run on multiple browsers (Chrome, Firefox, Safari)
- Test mobile devices (Pixel 5, iPhone 12)
- Capture screenshots on failure
- Record videos for failed tests
- Generate HTML reports
- Start dev server automatically

## Mock Strategy

### Wallet Mocking
- MetaMask window.ethereum object simulation
- Account and network state management
- Error scenario testing
- Connection persistence simulation

### API Mocking
- Exchange rate calculations
- Transaction simulation
- Network request interception

## Best Practices

1. **Page Object Pattern**: Each test file focuses on specific functionality
2. **Wait Strategies**: Proper use of `waitFor` and `expect` with timeouts
3. **Cleanup**: Each test is isolated and cleans up after itself
4. **Error Handling**: Comprehensive error scenario coverage
5. **Accessibility**: Tests include keyboard navigation and screen reader considerations

## Visual Testing

Screenshots are captured for:
- Different application states
- Various token combinations
- Mobile viewport sizes
- Dark/light mode variations
- Error states and loading indicators

## Performance Testing

- Page load timing validation
- Interaction responsiveness
- Memory usage monitoring
- Network request optimization

## Debugging

### View Test Execution
```bash
npx playwright test --headed
```

### Debug Specific Test
```bash
npx playwright test --debug wallet-integration
```

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

The tests are configured for:
- Parallel execution in CI
- Retry on failure
- Artifact collection (screenshots, videos, traces)
- Multiple browser matrix testing