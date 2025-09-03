import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  XCircle, 
  Lightbulb, 
  Code, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface FailureExplanationProps {
  testName: string;
  error: string;
  file: string;
  suggestions?: string[];
}

const getErrorCategory = (error: string) => {
  if (error.toLowerCase().includes('close to') || error.toLowerCase().includes('precision')) {
    return {
      category: 'Precision Issue',
      icon: <Code className="h-4 w-4" />,
      color: 'blue'
    };
  }
  if (error.toLowerCase().includes('multiple elements') || error.toLowerCase().includes('element')) {
    return {
      category: 'DOM Selection',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'yellow'
    };
  }
  if (error.toLowerCase().includes('timeout') || error.toLowerCase().includes('network')) {
    return {
      category: 'Performance',
      icon: <XCircle className="h-4 w-4" />,
      color: 'red'
    };
  }
  return {
    category: 'General Error',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'gray'
  };
};

const getDetailedExplanation = (error: string) => {
  const explanations = {
    'close to': {
      explanation: 'This is a floating-point precision mismatch. The DEX implements realistic price impact calculations that account for market conditions.',
      cause: 'The test expects simple mathematical ratios, but the DEX uses sophisticated AMM (Automated Market Maker) formulas that include slippage and price impact.',
      solution: 'Update test expectations to use `toBeCloseTo()` with appropriate tolerance levels that account for price impact calculations.'
    },
    'multiple elements': {
      explanation: 'The test selector is finding multiple DOM elements with the same text content, causing ambiguous element selection.',
      cause: 'Dropdown menus often render the same text in multiple places (button text and option text), confusing the test selector.',
      solution: 'Use more specific selectors like `getAllByText()` with element filtering, or target elements by role and position.'
    },
    'precision': {
      explanation: 'Mathematical precision loss occurs during floating-point calculations, especially in financial applications.',
      cause: 'JavaScript floating-point arithmetic inherently has precision limitations, compounded by complex price impact formulas.',
      solution: 'Reduce precision requirements in tests or implement proper rounding in the calculation logic.'
    },
    'timeout': {
      explanation: 'The test operation exceeded the allocated time limit, indicating performance issues or slow async operations.',
      cause: 'Network delays, heavy computations, or waiting for elements that never appear can cause timeouts.',
      solution: 'Optimize the operation, increase timeout limits, or improve test wait conditions.'
    },
    'safari': {
      explanation: 'Safari browser has different JavaScript engine behavior and CSS rendering compared to Chrome/Firefox.',
      cause: 'Browser-specific implementations of web standards or unsupported features cause cross-browser compatibility issues.',
      solution: 'Add Safari-specific handling or polyfills for unsupported features, or adjust the test for browser differences.'
    }
  };

  const matchedKey = Object.keys(explanations).find(key => 
    error.toLowerCase().includes(key.toLowerCase())
  );

  return matchedKey ? explanations[matchedKey as keyof typeof explanations] : {
    explanation: 'This error requires detailed investigation of the test case and implementation.',
    cause: 'The specific cause needs to be determined by examining the error context and related code.',
    solution: 'Review the test implementation, check for race conditions, and verify the expected behavior matches actual requirements.'
  };
};

const getSuggestedFixes = (error: string) => {
  const suggestions: Record<string, string[]> = {
    'close to': [
      'Replace exact value matching with `toBeCloseTo(expectedValue, 1)`',
      'Update expected values to account for price impact: `expectedValue * 1.02` for ~2% impact',
      'Use relative tolerance testing instead of absolute values'
    ],
    'multiple elements': [
      'Use `getAllByText(text)[1]` to select the specific element',
      'Add `role="option"` selector to target dropdown options specifically',
      'Implement more specific test selectors with data-testid attributes'
    ],
    'precision': [
      'Reduce precision from 8 decimal places to 6: `toBeCloseTo(value, 6)`',
      'Round values before comparison: `Math.round(value * 1000000) / 1000000`',
      'Consider using integer-based calculations for financial precision'
    ],
    'timeout': [
      'Increase test timeout limits in vitest.config.ts',
      'Optimize async operations and reduce computation complexity',
      'Add proper loading states and error handling'
    ],
    'safari': [
      'Add Safari-specific test conditions using browser detection',
      'Implement polyfills for unsupported Safari features',
      'Use alternative approaches for Safari compatibility'
    ]
  };

  const matchedKey = Object.keys(suggestions).find(key => 
    error.toLowerCase().includes(key.toLowerCase())
  );

  return matchedKey ? suggestions[matchedKey] : [
    'Examine the error stack trace for specific failure points',
    'Add detailed logging to understand the failure context',
    'Consider adding integration tests to verify end-to-end behavior'
  ];
};

export default function FailureExplanation({ 
  testName, 
  error, 
  file,
  suggestions 
}: FailureExplanationProps) {
  const errorCategory = getErrorCategory(error);
  const explanation = getDetailedExplanation(error);
  const suggestedFixes = suggestions || getSuggestedFixes(error);

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                {errorCategory.category}
              </Badge>
              <span className="text-sm font-medium">{testName}</span>
            </div>
            <p className="text-sm font-mono bg-muted p-2 rounded border-l-4 border-l-red-500">
              {error}
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Root Cause Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">What happened:</h4>
              <p className="text-sm">{explanation.explanation}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Why it happened:</h4>
              <p className="text-sm">{explanation.cause}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Suggested Solutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedFixes.map((fix, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <p className="text-sm">{fix}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="h-4 w-4 text-blue-500" />
            Quick Fix Implementation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded text-sm font-mono">
            <p className="text-muted-foreground mb-2">// Recommended fix for {file}</p>
            <p>{explanation.solution}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}