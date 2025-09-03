import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  TestTube,
  Bug,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

interface TestResultCardProps {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
}

const getTypeIcon = (type: TestResultCardProps['type']) => {
  switch (type) {
    case 'unit':
      return <TestTube className="h-5 w-5" />;
    case 'integration':
      return <Bug className="h-5 w-5" />;
    case 'e2e':
      return <Globe className="h-5 w-5" />;
    case 'performance':
      return <Zap className="h-5 w-5" />;
    case 'security':
      return <Shield className="h-5 w-5" />;
  }
};

const getTypeColor = (type: TestResultCardProps['type']) => {
  switch (type) {
    case 'unit':
      return 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'integration':
      return 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800';
    case 'e2e':
      return 'from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800';
    case 'performance':
      return 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800';
    case 'security':
      return 'from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800';
  }
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export default function TestResultCard({
  suiteName,
  totalTests,
  passedTests,
  failedTests,
  skippedTests,
  duration,
  type
}: TestResultCardProps) {
  const passRate = (passedTests / totalTests) * 100;

  return (
    <Card className={`bg-gradient-to-br ${getTypeColor(type)} transition-all duration-200 hover:shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 text-${type === 'unit' ? 'blue' : type === 'integration' ? 'purple' : type === 'e2e' ? 'indigo' : type === 'performance' ? 'orange' : 'emerald'}-700 dark:text-${type === 'unit' ? 'blue' : type === 'integration' ? 'purple' : type === 'e2e' ? 'indigo' : type === 'performance' ? 'orange' : 'emerald'}-400`}>
            {getTypeIcon(type)}
            {suiteName}
          </CardTitle>
          <Badge variant={failedTests > 0 ? "destructive" : "default"}>
            {passedTests}/{totalTests}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-700 dark:text-green-400">{passedTests}</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              <span className="text-red-700 dark:text-red-400">{failedTests}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-700 dark:text-yellow-400">{skippedTests}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span className="font-medium">{passRate.toFixed(1)}%</span>
            </div>
            <Progress value={passRate} className="h-2" />
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Duration: {formatDuration(duration)}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Completed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}