# Testing Environments Strategy

## Overview
We use separate test suites optimized for different environments rather than trying to make one test suite work everywhere.

## Test Environments

### 🏠 Local Development
**Purpose**: Fast feedback during development  
**Command**: `npm run test:e2e local`  
**Config**: `playwright.config.ts`  
**Characteristics**:
- Uses `http://localhost:8080`
- Full mocked wallet integration
- Exact UI validation
- All test types (unit, integration, e2e)
- Fast execution

### 🧪 Staging Comprehensive  
**Purpose**: Full validation before production deployment  
**Command**: `npm run test:e2e staging`  
**Config**: `playwright-staging-comprehensive.config.ts`  
**Characteristics**:
- Uses staging URL (when accessible)
- Complete feature testing
- Edge cases and error scenarios
- Cross-browser testing
- Visual regression testing
- Can be destructive (safe environment)

### 🚀 Production Smoke
**Purpose**: Health monitoring and critical flow verification  
**Command**: `npm run test:e2e production`  
**Config**: `playwright-production-smoke.config.ts`  
**Characteristics**:
- Light, non-destructive tests only
- Resilient to UI changes
- Basic functionality verification
- Single browser (Chrome)
- Suitable for monitoring/alerting
- Rate limiting friendly

## Test Organization

```
src/tests/e2e/
├── production/          # Production smoke tests
│   └── smoke-tests.spec.ts
├── staging/            # Staging comprehensive tests  
│   └── comprehensive-tests.spec.ts
└── [original files]    # Local development tests
```

## Running Tests

### Quick Commands
```bash
# Local development (default)
npm test

# Production monitoring
npm run test:e2e production

# Staging validation
npm run test:e2e staging

# With options
npm run test:e2e production --headed
npm run test:e2e staging --project staging-comprehensive-chromium
```

### Full Command Reference
```bash
# Local development
npm run test:e2e local
npm run test:e2e local --headed
npm run test:e2e local --debug

# Staging comprehensive
npm run test:e2e staging
npm run test:e2e staging-comprehensive
npm run test:e2e staging --project staging-comprehensive-firefox

# Production smoke
npm run test:e2e production  
npm run test:e2e production-smoke
npm run test:e2e production --project production-smoke-chrome
```

## Test Types by Environment

### Production Tests ✅
- ✅ Homepage loads
- ✅ Wallet connection available
- ✅ Trading interface present
- ✅ No critical errors
- ✅ Basic performance
- ❌ No actual transactions
- ❌ No destructive operations

### Staging Tests ✅  
- ✅ Complete swap workflows
- ✅ Exact UI validation
- ✅ Token switching
- ✅ Input validation
- ✅ Edge cases
- ✅ Error scenarios
- ✅ Cross-browser testing
- ✅ Visual regression
- ✅ Performance testing

### Local Tests ✅
- ✅ All staging tests
- ✅ Unit tests
- ✅ Integration tests  
- ✅ Component testing
- ✅ Development debugging

## CI/CD Integration

### Pull Request Pipeline
```yaml
- Run: npm run test:e2e local
- Run: npm run test:e2e staging (if staging accessible)
```

### Production Deployment Pipeline  
```yaml
- Run: npm run test:e2e staging
- Deploy to production
- Run: npm run test:e2e production
- Set up monitoring with production smoke tests
```

### Production Monitoring
```yaml
# Every 30 minutes
- Run: npm run test:e2e production
- Alert on failures
```

## Advantages of This Approach

1. **Environment-Specific Optimization**: Each test suite is optimized for its environment
2. **Appropriate Risk Management**: Production gets safe monitoring, staging gets thorough testing
3. **Better Performance**: No trying to make one test work everywhere
4. **Clearer Purpose**: Each test suite has a clear, focused purpose
5. **Easier Maintenance**: Changes to one environment don't break others
6. **Better CI/CD**: Clear testing strategy for each deployment stage

## Migration from Unified Tests

The original unified tests are preserved for local development. To migrate:

1. **Production**: Use new smoke tests for monitoring
2. **Staging**: Use new comprehensive tests for validation  
3. **Local**: Continue using existing tests for development

This provides a smooth transition while immediately improving production testing reliability.