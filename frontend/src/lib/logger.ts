// frontend/src/lib/logger.ts — [Frontend]
// {/* Centralized Logging & Error Tracking System */
import { apiUrl, fetchJson } from './api';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  url?: string;
  userAgent?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';
  private sessionId = this.generateSessionId();
  private userId: string | null = null;

  constructor() {
    // Initialize session tracking
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession() {
    // Store session ID in sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('logger_session_id');
      if (stored) {
        this.sessionId = stored;
      } else {
        sessionStorage.setItem('logger_session_id', this.sessionId);
      }
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        userId: this.userId || context?.userId,
        sessionId: this.sessionId,
      },
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warn, error, and fatal
    return ['warn', 'error', 'fatal'].includes(level);
  }

  private formatLogEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context?.component) {
      formatted += ` | Component: ${context.component}`;
    }
    
    if (context?.action) {
      formatted += ` | Action: ${context.action}`;
    }
    
    if (error) {
      formatted += ` | Error: ${error.name}: ${error.message}`;
    }
    
    return formatted;
  }

  private logToConsole(entry: LogEntry) {
    const formatted = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formatted, entry);
        break;
      case 'info':
        console.info(formatted, entry);
        break;
      case 'warn':
        console.warn(formatted, entry);
        break;
      case 'error':
      case 'fatal':
        console.error(formatted, entry);
        break;
    }
  }

  private async sendToServer(entry: LogEntry) {
    if (!this.isProduction) return;

    try {
      // Use relative URL for Next.js API route
      await fetchJson(apiUrl('/api/logs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Don't log server errors to avoid infinite loops
      console.error('Failed to send log to server:', error);
    }
  }

  private async log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, error);
    
    // Always log to console in development
    if (this.isDevelopment) {
      this.logToConsole(entry);
    }
    
    // Send to server in production
    if (this.isProduction) {
      await this.sendToServer(entry);
    }
  }

  // Public logging methods
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  fatal(message: string, error?: Error, context?: LogContext) {
    this.log('fatal', message, context, error);
  }

  // Specialized logging methods
  apiCall(endpoint: string, method: string, status?: number, duration?: number) {
    this.info(`API ${method} ${endpoint}`, {
      action: 'api_call',
      metadata: {
        endpoint,
        method,
        status,
        duration,
      },
    });
  }

  userAction(action: string, component: string, metadata?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      action,
      component,
      metadata,
    });
  }

  performance(metric: string, value: number, context?: LogContext) {
    this.info(`Performance: ${metric}`, {
      action: 'performance',
      metadata: {
        metric,
        value,
      },
      ...context,
    });
  }

  // Error tracking helpers
  trackError(error: Error, context?: LogContext) {
    this.error(`Unhandled error: ${error.message}`, error, context);
  }

  trackPromiseRejection(reason: any, context?: LogContext) {
    this.error(`Unhandled promise rejection: ${reason}`, new Error(String(reason)), context);
  }
}

// Create singleton instance
export const logger = new Logger();

// Global error handlers
if (typeof window !== 'undefined') {
  // Track unhandled errors
  window.addEventListener('error', (event) => {
    logger.trackError(event.error, {
      component: 'global_error_handler',
      action: 'unhandled_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.trackPromiseRejection(event.reason, {
      component: 'global_error_handler',
      action: 'unhandled_promise_rejection',
    });
  });

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    logger.debug('Page visibility changed', {
      action: 'visibility_change',
      metadata: {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
      },
    });
  });
}

// React integration helpers
export const withLogging = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      logger.debug(`Component mounted: ${componentName}`, {
        component: componentName,
        action: 'component_mount',
      });

      return () => {
        logger.debug(`Component unmounted: ${componentName}`, {
          component: componentName,
          action: 'component_unmount',
        });
      };
    }, []);

    return React.createElement(Component, { ...props, ref });
  });
};

// Hook for component-level logging
export const useLogger = (componentName: string) => {
  const log = React.useCallback(
    (level: LogLevel, message: string, context?: Omit<LogContext, 'component'>) => {
      logger[level](message, { ...context, component: componentName });
    },
    [componentName]
  );

  const logError = React.useCallback(
    (message: string, error?: Error, context?: Omit<LogContext, 'component'>) => {
      logger.error(message, error, { ...context, component: componentName });
    },
    [componentName]
  );

  const logUserAction = React.useCallback(
    (action: string, metadata?: Record<string, any>) => {
      logger.userAction(action, componentName, metadata);
    },
    [componentName]
  );

  return {
    log,
    logError,
    logUserAction,
    debug: (message: string, context?: Omit<LogContext, 'component'>) =>
      log('debug', message, context),
    info: (message: string, context?: Omit<LogContext, 'component'>) =>
      log('info', message, context),
    warn: (message: string, context?: Omit<LogContext, 'component'>) =>
      log('warn', message, context),
    error: logError,
    fatal: (message: string, error?: Error, context?: Omit<LogContext, 'component'>) =>
      log('fatal', message, error, context),
  };
};

export default logger;
