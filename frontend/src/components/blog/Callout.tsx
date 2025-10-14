// frontend/src/components/blog/Callout.tsx
import { AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  children: React.ReactNode;
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const config = {
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor } = config[type];

  return (
    <div className={`${bgColor} ${borderColor} border-l-4 p-4 my-4 rounded-r-lg`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-0.5 ${iconColor}`} />
        <div className="text-foreground">{children}</div>
      </div>
    </div>
  );
}
