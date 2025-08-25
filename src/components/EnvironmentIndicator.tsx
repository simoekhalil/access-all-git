import { ENV } from '@/config/environment';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TestTube, Globe } from 'lucide-react';

const EnvironmentIndicator = () => {
  // Don't show indicator in production
  if (ENV.isProduction) return null;

  const getEnvironmentConfig = () => {
    if (ENV.isStaging) {
      return {
        label: 'STAGING',
        icon: TestTube,
        className: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600',
      };
    } else {
      return {
        label: 'DEVELOPMENT',
        icon: AlertTriangle,
        className: 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600',
      };
    }
  };

  const config = getEnvironmentConfig();
  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge className={`${config.className} flex items-center gap-1 px-3 py-1 text-xs font-semibold shadow-lg`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    </div>
  );
};

export default EnvironmentIndicator;