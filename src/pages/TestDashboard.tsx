import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Play, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  TestTube,
  Bug,
  Shield,
  Zap,
  Globe,
  ArrowLeft,
  Home
} from 'lucide-react';
import TestResultCard from '@/components/TestResultCard';
import FailureExplanation from '@/components/FailureExplanation';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration: number;
  error?: string;
  file: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
}

const mockTestData: TestSuite[] = [
  {
    name: 'Unit Tests',
    totalTests: 42,
    passedTests: 38,
    failedTests: 3,
    skippedTests: 1,
    duration: 2340,
    tests: [
      {
        name: 'SwapInterface Component - Amount Calculation',
        status: 'failed',
        duration: 145,
        error: 'Expected 99.014766 to be close to 100, received difference is 0.98',
        file: 'src/tests/unit/swap-interface.test.tsx',
        type: 'unit'
      },
      {
        name: 'Price Impact Property-Based Tests',
        status: 'failed',
        duration: 230,
        error: 'Found multiple elements with text: GALA. Element selection issue in dropdown.',
        file: 'src/tests/unit/price-impact-property-based.test.tsx',
        type: 'unit'
      },
      {
        name: 'GalaSwap Price Impact Formula - Precision',
        status: 'failed',
        duration: 89,
        error: 'Precision test failed - expected 6.172839 to be close to 6.172839450000001',
        file: 'src/tests/unit/gala-swap-price-impact-formula.test.tsx',
        type: 'unit'
      },
      {
        name: 'Basic Component Rendering',
        status: 'passed',
        duration: 67,
        file: 'src/tests/unit/swap-interface.test.tsx',
        type: 'unit'
      },
      {
        name: 'Token Selection Logic',
        status: 'passed',
        duration: 123,
        file: 'src/tests/unit/swap-interface.test.tsx',
        type: 'unit'
      }
    ]
  },
  {
    name: 'Integration Tests',
    totalTests: 12,
    passedTests: 11,
    failedTests: 1,
    skippedTests: 0,
    duration: 1890,
    tests: [
      {
        name: 'Price Impact Integration Flow',
        status: 'passed',
        duration: 456,
        file: 'src/tests/integration/price-impact-integration.test.tsx',
        type: 'integration'
      },
      {
        name: 'Full Swap Flow Integration',
        status: 'failed',
        duration: 678,
        error: 'Network timeout during swap execution simulation',
        file: 'src/tests/integration/full-swap-flow.test.tsx',
        type: 'integration'
      }
    ]
  },
  {
    name: 'E2E Tests',
    totalTests: 8,
    passedTests: 7,
    failedTests: 1,
    skippedTests: 0,
    duration: 45600,
    tests: [
      {
        name: 'Complete Swap Workflow',
        status: 'passed',
        duration: 12340,
        file: 'src/tests/e2e/complete-swap-workflow.spec.ts',
        type: 'e2e'
      },
      {
        name: 'Cross-browser Compatibility',
        status: 'failed',
        duration: 8900,
        error: 'Safari-specific issue with wallet connection modal',
        file: 'src/tests/e2e/cross-browser-compatibility.spec.ts',
        type: 'e2e'
      }
    ]
  },
  {
    name: 'Performance Tests',
    totalTests: 6,
    passedTests: 6,
    failedTests: 0,
    skippedTests: 0,
    duration: 3450,
    tests: [
      {
        name: 'Advanced Performance Metrics',
        status: 'passed',
        duration: 1234,
        file: 'src/tests/performance/advanced-performance.test.tsx',
        type: 'performance'
      }
    ]
  },
  {
    name: 'Security Tests',
    totalTests: 4,
    passedTests: 4,
    failedTests: 0,
    skippedTests: 0,
    duration: 890,
    tests: [
      {
        name: 'Basic Security Validation',
        status: 'passed',
        duration: 445,
        file: 'src/tests/security/basic-security.test.tsx',
        type: 'security'
      }
    ]
  }
];

const getStatusIcon = (status: TestResult['status']) => {
  switch (status) {
    case 'passed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'skipped':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'running':
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
  }
};

const getTypeIcon = (type: TestResult['type']) => {
  switch (type) {
    case 'unit':
      return <TestTube className="h-4 w-4" />;
    case 'integration':
      return <Bug className="h-4 w-4" />;
    case 'e2e':
      return <Globe className="h-4 w-4" />;
    case 'performance':
      return <Zap className="h-4 w-4" />;
    case 'security':
      return <Shield className="h-4 w-4" />;
  }
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const explainFailure = (error: string, testName: string) => {
  const explanations: Record<string, string> = {
    'close to': 'This is likely a floating-point precision issue. The DEX calculations include price impact, so the expected values in tests need to account for realistic trading scenarios rather than simple mathematical ratios.',
    'multiple elements': 'This is a test automation issue where the DOM contains duplicate elements. The test selector needs to be more specific to target the correct dropdown option.',
    'precision': 'Precision mismatch in mathematical calculations. Consider adjusting the tolerance levels in toBeCloseTo() matcher or review the calculation formula.',
    'timeout': 'Network or performance related timeout. This could indicate slow API responses or heavy computation blocking the test execution.',
    'Safari': 'Browser-specific compatibility issue. Safari may handle certain JavaScript features or CSS properties differently than other browsers.'
  };

  const matchedKey = Object.keys(explanations).find(key => 
    error.toLowerCase().includes(key.toLowerCase())
  );

  return matchedKey ? explanations[matchedKey] : 
    'This test failure requires manual investigation. Check the error details and corresponding source code.';
};

export default function TestDashboard() {
  const [selectedSuite, setSelectedSuite] = useState<string>('overview');
  const [isRunning, setIsRunning] = useState(false);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  const totalTests = mockTestData.reduce((sum, suite) => sum + suite.totalTests, 0);
  const totalPassed = mockTestData.reduce((sum, suite) => sum + suite.passedTests, 0);
  const totalFailed = mockTestData.reduce((sum, suite) => sum + suite.failedTests, 0);
  const totalSkipped = mockTestData.reduce((sum, suite) => sum + suite.skippedTests, 0);
  const passRate = ((totalPassed / totalTests) * 100);

  const toggleTestExpansion = (testName: string) => {
    setExpandedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testName)) {
        newSet.delete(testName);
      } else {
        newSet.add(testName);
      }
      return newSet;
    });
  };

  const runTests = () => {
    setIsRunning(true);
    // Simulate test run
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="hover:bg-background/50">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to DEX
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Test Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive test results and failure analysis for GalaSwap DEX
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Passed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">{totalPassed}</div>
              <p className="text-green-600 dark:text-green-500 text-sm">
                {passRate.toFixed(1)}% pass rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700 dark:text-red-400">{totalFailed}</div>
              <p className="text-red-600 dark:text-red-500 text-sm">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Skipped
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{totalSkipped}</div>
              <p className="text-yellow-600 dark:text-yellow-500 text-sm">
                Not executed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Total Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{totalTests}</div>
              <p className="text-blue-600 dark:text-blue-500 text-sm">
                Across all suites
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Test Coverage Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{passRate.toFixed(1)}%</span>
              </div>
              <Progress value={passRate} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{totalPassed} passed</span>
                <span>{totalFailed} failed</span>
                <span>{totalSkipped} skipped</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Suites */}
        <Tabs value={selectedSuite} onValueChange={setSelectedSuite} className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="unit">Unit Tests</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="e2e">E2E Tests</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4">
              {mockTestData.map((suite) => {
                const suitePassRate = (suite.passedTests / suite.totalTests) * 100;
                return (
                  <Card key={suite.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {getTypeIcon(suite.tests[0]?.type)}
                          {suite.name}
                        </CardTitle>
                        <Badge variant={suite.failedTests > 0 ? "destructive" : "default"}>
                          {suite.passedTests}/{suite.totalTests} passed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress value={suitePassRate} className="h-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Duration: {formatDuration(suite.duration)}</span>
                          <span>{suitePassRate.toFixed(1)}% pass rate</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {mockTestData.map((suite) => (
            <TabsContent key={suite.name.toLowerCase().replace(' ', '')} value={suite.name.toLowerCase().replace(' ', '')}>
              <Card>
                <CardHeader>
                  <CardTitle>{suite.name} Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {suite.tests.map((test, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <Collapsible>
                          <CollapsibleTrigger 
                            className="w-full"
                            onClick={() => toggleTestExpansion(test.name)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {expandedTests.has(test.name) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                {getStatusIcon(test.status)}
                                {getTypeIcon(test.type)}
                                <span className="font-medium text-left">{test.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{formatDuration(test.duration)}</Badge>
                                <Badge variant={test.status === 'passed' ? 'default' : test.status === 'failed' ? 'destructive' : 'secondary'}>
                                  {test.status}
                                </Badge>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div>
                                <p className="text-sm text-muted-foreground">File: {test.file}</p>
                              </div>
                              
                              {test.error && (
                                <FailureExplanation 
                                  testName={test.name}
                                  error={test.error}
                                  file={test.file}
                                />
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}