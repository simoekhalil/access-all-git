import { useState, useEffect } from 'react';

interface VitestResult {
  testResults: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    failureMessages?: string[];
  }>;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
}

interface PlaywrightResult {
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  suites: Array<{
    title: string;
    tests: Array<{
      title: string;
      outcome: 'passed' | 'failed' | 'skipped';
      duration: number;
      errors?: Array<{
        message: string;
        location?: {
          file: string;
          line: number;
        };
      }>;
    }>;
  }>;
}

interface TestSuite {
  name: string;
  tests: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped' | 'running';
    duration: number;
    error?: string;
    file: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  }>;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
}

export const useTestResults = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTestResults = async () => {
    console.log('=== LOADING TEST RESULTS START ===');
    setIsLoading(true);
    setError(null);
    
    try {
      const suites: TestSuite[] = [];
      
      // Try to load Vitest results
      try {
        const vitestResponse = await fetch('/results.json');
        
        if (vitestResponse.ok) {
          const responseText = await vitestResponse.text();
          console.log('Vitest response received, length:', responseText.length);
          
          // Check if response is actually JSON, not HTML
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            const vitestData: VitestResult = JSON.parse(responseText);
            console.log('Raw Vitest data:', {
              totalTests: vitestData.numTotalTests,
              passedTests: vitestData.numPassedTests,
              failedTests: vitestData.numFailedTests,
              testResultsLength: vitestData.testResults.length
            });
            
            // Group tests by file/type
            const unitTests: TestSuite['tests'] = [];
            const integrationTests: TestSuite['tests'] = [];
            const performanceTests: TestSuite['tests'] = [];
            const securityTests: TestSuite['tests'] = [];
            
            vitestData.testResults.forEach(test => {
              let testType: 'unit' | 'integration' | 'performance' | 'security' = 'unit';
              
              // Categorize based on exact test name patterns from your actual data
              if (test.name.startsWith('Integration ›')) {
                testType = 'integration';
              } else if (test.name.startsWith('Performance ›')) {
                testType = 'performance';  
              } else if (test.name.startsWith('Security ›')) {
                testType = 'security';
              } else if (test.name.startsWith('API ›') || test.name.startsWith('Database ›')) {
                testType = 'integration';
              }
              // All other tests (SwapInterface, WalletConnection, Price Impact, etc.) are unit tests
              
              console.log('Categorizing test:', test.name, '-> type:', testType);
              
              const testItem = {
                name: test.name,
                status: test.status,
                duration: test.duration,
                error: test.failureMessages?.[0],
                file: 'Unknown file',
                type: testType
              };
              
              // Add to appropriate array
              if (testType === 'integration') {
                integrationTests.push(testItem);
              } else if (testType === 'performance') {
                performanceTests.push(testItem);
              } else if (testType === 'security') {
                securityTests.push(testItem);
              } else {
                unitTests.push(testItem);
              }
            });
            
            // Create unit test suite
            if (unitTests.length > 0) {
              suites.push({
                name: 'Unit Tests',
                tests: unitTests,
                totalTests: unitTests.length,
                passedTests: unitTests.filter(t => t.status === 'passed').length,
                failedTests: unitTests.filter(t => t.status === 'failed').length,
                skippedTests: unitTests.filter(t => t.status === 'skipped').length,
                duration: unitTests.reduce((sum, t) => sum + t.duration, 0)
              });
            }
            
            // Create other suites
            if (integrationTests.length > 0) {
              suites.push({
                name: 'Integration Tests',
                tests: integrationTests,
                totalTests: integrationTests.length,
                passedTests: integrationTests.filter(t => t.status === 'passed').length,
                failedTests: integrationTests.filter(t => t.status === 'failed').length,
                skippedTests: integrationTests.filter(t => t.status === 'skipped').length,
                duration: integrationTests.reduce((sum, t) => sum + t.duration, 0)
              });
            }
            
            if (performanceTests.length > 0) {
              suites.push({
                name: 'Performance Tests',
                tests: performanceTests,
                totalTests: performanceTests.length,
                passedTests: performanceTests.filter(t => t.status === 'passed').length,
                failedTests: performanceTests.filter(t => t.status === 'failed').length,
                skippedTests: performanceTests.filter(t => t.status === 'skipped').length,
                duration: performanceTests.reduce((sum, t) => sum + t.duration, 0)
              });
            }
            
            if (securityTests.length > 0) {
              suites.push({
                name: 'Security Tests',
                tests: securityTests,
                totalTests: securityTests.length,
                passedTests: securityTests.filter(t => t.status === 'passed').length,
                failedTests: securityTests.filter(t => t.status === 'failed').length,
                skippedTests: securityTests.filter(t => t.status === 'skipped').length,
                duration: securityTests.reduce((sum, t) => sum + t.duration, 0)
              });
            }
            
            console.log('Vitest categorization complete:', {
              totalProcessed: unitTests.length + integrationTests.length + performanceTests.length + securityTests.length,
              expectedTotal: vitestData.numTotalTests,
              actualTestResults: vitestData.testResults.length,
              unitCount: unitTests.length,
              integrationCount: integrationTests.length,
              performanceCount: performanceTests.length,
              securityCount: securityTests.length,
              missing: vitestData.testResults.length - (unitTests.length + integrationTests.length + performanceTests.length + securityTests.length)
            });
            
            // IMPORTANT: Use the actual totals from Vitest data, not individual array counts
            // This ensures we show the correct totals even if categorization has issues
            const totalVitestPassed = vitestData.numPassedTests;
            const totalVitestFailed = vitestData.numFailedTests;
            const totalVitestSkipped = vitestData.numPendingTests;
            
            // Override the individual suite counts to ensure total matches Vitest data
            if (unitTests.length > 0) {
              const unitSuite = suites.find(s => s.name === 'Unit Tests');
              if (unitSuite) {
                // Adjust unit tests to make up any missing tests
                const otherCounts = integrationTests.length + performanceTests.length + securityTests.length;
                unitSuite.totalTests = vitestData.numTotalTests - otherCounts;
              }
            }
          }
        }
      } catch (vitestError) {
        console.error('Error loading Vitest results:', vitestError);
      }
      
      // Try to load Playwright results
      try {
        const playwrightResponse = await fetch('/playwright-results.json');
        
        if (playwrightResponse.ok) {
          const playwrightData: PlaywrightResult = await playwrightResponse.json();
          
          const e2eTests: TestSuite['tests'] = [];
          
          playwrightData.suites.forEach(suite => {
            suite.tests.forEach(test => {
              e2eTests.push({
                name: `${suite.title} - ${test.title}`,
                status: test.outcome,
                duration: test.duration,
                error: test.errors?.[0]?.message,
                file: test.errors?.[0]?.location?.file || 'Unknown file',
                type: 'e2e'
              });
            });
          });
          
          if (e2eTests.length > 0) {
            suites.push({
              name: 'E2E Tests',
              tests: e2eTests,
              totalTests: playwrightData.stats.total,
              passedTests: playwrightData.stats.passed,
              failedTests: playwrightData.stats.failed,
              skippedTests: playwrightData.stats.skipped,
              duration: e2eTests.reduce((sum, t) => sum + t.duration, 0)
            });
          }
        }
      } catch (playwrightError) {
        console.error('Error loading Playwright results:', playwrightError);
      }
      
      if (suites.length === 0) {
        setError('No test results found. Please run tests first using "npm run test" or "npm run test:e2e"');
      }
      
      console.log('Final test suites:', suites.map(s => ({
        name: s.name,
        totalTests: s.totalTests,
        passedTests: s.passedTests,
        failedTests: s.failedTests,
        skippedTests: s.skippedTests
      })));
      
      setTestSuites(suites);
    } catch (err) {
      console.error('Error in loadTestResults:', err);
      setError('Failed to load test results: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestResults();
  }, []);

  return {
    testSuites,
    isLoading,
    error,
    refetch: loadTestResults
  };
};