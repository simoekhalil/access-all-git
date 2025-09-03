# Test Dashboard Usage Guide

## Overview

The test dashboard provides a comprehensive view of your test results with beautiful UI and detailed failure explanations.

## How to Use

### 1. Run Your Tests

First, execute your test suites to generate result files:

```bash
# Run all unit and integration tests
npm run test

# Run end-to-end tests
npm run test:e2e

# Run tests with coverage
npm run test -- --coverage
```

### 2. Access the Dashboard

- **Via UI**: Click the "Test Dashboard" button on the main DEX page
- **Direct URL**: Navigate to `/test-dashboard` in your browser
- **Local**: http://localhost:8080/test-dashboard

### 3. View Results

The dashboard automatically loads test results from:
- `./test-results/results.json` (Vitest results)
- `./test-results/playwright-results.json` (Playwright E2E results)

## Features

### 📊 **Overview Dashboard**
- Total test count and pass rates
- Progress bars and statistics
- Suite-by-suite breakdown

### 🔍 **Detailed Test Analysis**
- Individual test results
- Execution times and status
- File locations and error details

### 💡 **Intelligent Failure Explanations**
- Root cause analysis for common failures
- Suggested fixes and solutions
- Code examples for implementing fixes

### 🎯 **Test Categories**
- **Unit Tests**: Component and function testing
- **Integration Tests**: Multi-component interactions
- **E2E Tests**: Full application workflows
- **Performance Tests**: Speed and optimization
- **Security Tests**: Vulnerability scanning

## Troubleshooting

### No Test Results Showing?

1. **Run tests first**: `npm run test`
2. **Check file generation**: Verify files exist in `./test-results/`
3. **Refresh dashboard**: Click "Refresh Results" button
4. **Check console**: Look for any loading errors

### Results Not Updating?

- Test results are cached - refresh the page or click "Refresh Results"
- Make sure test files were regenerated after code changes
- Check that the dev server can access the test-results directory

### Common Error Messages

- **"No test results found"**: Run tests first to generate result files
- **"Failed to load test results"**: Check if test result files are accessible
- **Network errors**: Ensure the development server is running

## File Structure

```
project/
├── test-results/           # Auto-generated test results
│   ├── results.json       # Vitest results
│   └── playwright-results.json # Playwright results
├── coverage/              # Code coverage reports
├── playwright-report/     # Playwright HTML reports
└── src/
    ├── pages/TestDashboard.tsx    # Main dashboard component
    ├── hooks/useTestResults.ts    # Data loading hook
    └── components/
        ├── TestResultCard.tsx     # Suite summary cards
        └── FailureExplanation.tsx # Error analysis component
```

## Integration with CI/CD

The dashboard can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Tests and Generate Reports
  run: |
    npm run test
    npm run test:e2e
    
- name: Archive Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      test-results/
      coverage/
      playwright-report/
```

## Customization

### Adding New Test Categories

1. Update the `TestSuite` interface in `useTestResults.ts`
2. Add categorization logic in `loadTestResults()`
3. Update the dashboard tabs and icons

### Custom Failure Explanations

Modify `FailureExplanation.tsx` to add project-specific error analysis:

```typescript
const getDetailedExplanation = (error: string) => {
  // Add your custom error patterns here
  if (error.includes('your-specific-error')) {
    return {
      explanation: 'Your custom explanation',
      cause: 'Why it happens',
      solution: 'How to fix it'
    };
  }
  // ... existing logic
};
```

## Performance Tips

- Test results are loaded asynchronously for better UX
- Large test suites are paginated automatically
- Failed tests are prioritized in the display
- Real-time refresh without full page reload

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify test files are being generated correctly
3. Ensure the development server has proper file access
4. Review the test configuration in `vitest.config.ts` and `playwright.config.ts`
