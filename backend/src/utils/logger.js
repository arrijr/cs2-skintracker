// backend/src/utils/logger.js — [Backend]
// {/* Centralized Backend Logging & Error Tracking System */}
import winston from 'winston';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  })
);

// Production-optimized log levels
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Determine log level based on environment
const getLogLevel = () => {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  return isProduction ? 'warn' : 'info';
};

// Winston v3 compatible Database Transport
class DatabaseTransport extends winston.Transport {
  constructor(options = {}) {
    super(options);
    this.name = 'database';
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Store critical logs in database
    if (['error', 'fatal'].includes(info.level)) {
      this.storeInDatabase(info).catch(console.error);
    }

    callback();
  }

  async storeInDatabase(logInfo) {
    try {
      await prisma.auditLog.create({
        data: {
          level: logInfo.level,
          message: logInfo.message,
          action: "log", // Required field
          resource: "system", // Required field
          details: JSON.stringify(logInfo),
          userId: logInfo.userId || 1, // Use mock user ID
          ipAddress: logInfo.ipAddress || null,
          userAgent: logInfo.userAgent || null,
          createdAt: new Date(logInfo.timestamp),
        },
      });
    } catch (error) {
      console.error('Failed to store log in database:', error);
    }
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  format: logFormat,
  defaultMeta: {
    service: 'cs2-skin-tracker-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport with environment-specific formatting
    new winston.transports.Console({
      format: isDevelopment 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
      level: isProduction ? 'warn' : 'debug', // Only warn+ in production console
    }),
    
    // File transport for errors (always enabled)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs (only in development)
    ...(isDevelopment ? [new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })] : []),
  ],
});

// Add database transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new DatabaseTransport());
}

// Log sampling configuration
const SAMPLING_CONFIG = {
  // Sample rates for different log types (0.0 = 0%, 1.0 = 100%)
  api_requests: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev
  database_queries: isProduction ? 0.05 : 1.0, // 5% in production, 100% in dev
  user_actions: isProduction ? 0.2 : 1.0, // 20% in production, 100% in dev
  performance: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev
  debug: isProduction ? 0.01 : 1.0, // 1% in production, 100% in dev
};

// Sampling helper
const shouldSample = (logType, sampleRate = 1.0) => {
  if (!isProduction) return true; // Always log in development
  return Math.random() < sampleRate;
};

// Rate limiting for frequent logs
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // Max 10 logs per minute per key

const isRateLimited = (key) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, []);
  }
  
  const logs = rateLimits.get(key);
  // Remove old logs outside the window
  const recentLogs = logs.filter(timestamp => timestamp > windowStart);
  rateLimits.set(key, recentLogs);
  
  return recentLogs.length >= RATE_LIMIT_MAX;
};

// Enhanced logging methods
class EnhancedLogger {
  constructor(winstonLogger) {
    this.logger = winstonLogger;
  }

  // Standard logging methods with production optimizations
  debug(message, meta = {}) {
    // Only log debug in development or with sampling
    if (!isProduction || shouldSample('debug', SAMPLING_CONFIG.debug)) {
      this.logger.debug(message, meta);
    }
  }

  info(message, meta = {}) {
    // In production, only log info if it's not rate limited
    const rateLimitKey = `info:${message}`;
    if (!isProduction || !isRateLimited(rateLimitKey)) {
      this.logger.info(message, meta);
    }
  }

  warn(message, meta = {}) {
    // Always log warnings, but with rate limiting in production
    const rateLimitKey = `warn:${message}`;
    if (!isProduction || !isRateLimited(rateLimitKey)) {
      this.logger.warn(message, meta);
    }
  }

  error(message, error = null, meta = {}) {
    // Always log errors, but limit stack traces in production
    const errorMeta = {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: isProduction ? error.stack?.split('\n').slice(0, 5).join('\n') : error.stack,
        code: error.code,
      } : null,
    };
    this.logger.error(message, errorMeta);
  }

  fatal(message, error = null, meta = {}) {
    // Always log fatal errors
    const errorMeta = {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: isProduction ? error.stack?.split('\n').slice(0, 10).join('\n') : error.stack,
        code: error.code,
      } : null,
    };
    this.logger.fatal(message, errorMeta);
  }

  // Specialized logging methods with production optimizations
  apiRequest(req, res, duration) {
    // Only log API requests with sampling in production
    if (shouldSample('api_requests', SAMPLING_CONFIG.api_requests)) {
      // Only log slow requests or errors in production
      const shouldLog = !isProduction || 
        duration > 1000 || // Log requests > 1s
        res.statusCode >= 400; // Log error responses
      
      if (shouldLog) {
        this.info('API Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.userId || null,
        });
      }
    }
  }

  apiError(req, error, statusCode = 500) {
    // Always log API errors, but with rate limiting
    const rateLimitKey = `api_error:${req.method}:${req.url}`;
    if (!isRateLimited(rateLimitKey)) {
      this.error('API Error', error, {
        method: req.method,
        url: req.url,
        statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.userId || null,
      });
    }
  }

  databaseQuery(query, duration, error = null) {
    if (error) {
      // Always log database errors
      this.error('Database Query Error', error, {
        query: query.substring(0, 200) + '...',
        duration,
      });
    } else {
      // Only log slow queries or with sampling
      const shouldLog = !isProduction || 
        duration > 500 || // Log queries > 500ms
        shouldSample('database_queries', SAMPLING_CONFIG.database_queries);
      
      if (shouldLog) {
        this.debug('Database Query', {
          query: query.substring(0, 200) + '...',
          duration,
        });
      }
    }
  }

  cronJob(jobName, status, duration, error = null) {
    if (error) {
      // Always log cron job errors
      this.error(`Cron Job ${jobName} failed`, error, {
        jobName,
        status,
        duration,
      });
    } else {
      // Only log cron jobs with sampling or if they're slow
      const shouldLog = !isProduction || 
        duration > 30000 || // Log jobs > 30s
        shouldSample('cron_jobs', 0.1); // 10% sampling
      
      if (shouldLog) {
        this.info(`Cron Job ${jobName} completed`, {
          jobName,
          status,
          duration,
        });
      }
    }
  }

  userAction(userId, action, metadata = {}) {
    // Only log user actions with sampling in production
    if (shouldSample('user_actions', SAMPLING_CONFIG.user_actions)) {
      this.info('User Action', {
        userId,
        action,
        metadata,
      });
    }
  }

  securityEvent(event, details = {}) {
    // Always log security events, but with rate limiting
    const rateLimitKey = `security:${event}`;
    if (!isRateLimited(rateLimitKey)) {
      this.warn('Security Event', {
        event,
        details,
        timestamp: new Date().toISOString(),
      });
    }
  }

  performance(metric, value, context = {}) {
    // Only log performance metrics with sampling or if they exceed thresholds
    const shouldLog = !isProduction || 
      shouldSample('performance', SAMPLING_CONFIG.performance) ||
      (metric.includes('duration') && value > 1000) || // Log slow operations
      (metric.includes('memory') && value > 100 * 1024 * 1024); // Log high memory usage
    
    if (shouldLog) {
      this.info('Performance Metric', {
        metric,
        value,
        context,
      });
    }
  }

  // Error tracking helpers
  trackError(error, context = {}) {
    this.error('Unhandled Error', error, context);
  }

  trackPromiseRejection(reason, context = {}) {
    this.error('Unhandled Promise Rejection', new Error(String(reason)), context);
  }

  // Log health and statistics
  getLogStats() {
    return {
      isProduction,
      logLevel: getLogLevel(),
      samplingConfig: SAMPLING_CONFIG,
      rateLimitStats: {
        totalKeys: rateLimits.size,
        activeWindows: Array.from(rateLimits.values()).filter(logs => 
          logs.some(timestamp => timestamp > Date.now() - RATE_LIMIT_WINDOW)
        ).length,
      },
    };
  }

  // Clean up old rate limit entries
  cleanupRateLimits() {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    for (const [key, logs] of rateLimits.entries()) {
      const recentLogs = logs.filter(timestamp => timestamp > windowStart);
      if (recentLogs.length === 0) {
        rateLimits.delete(key);
      } else {
        rateLimits.set(key, recentLogs);
      }
    }
  }
}

// Create enhanced logger instance
const enhancedLogger = new EnhancedLogger(logger);

// Periodic cleanup of rate limits (every 5 minutes)
if (isProduction) {
  setInterval(() => {
    enhancedLogger.cleanupRateLimits();
  }, 5 * 60 * 1000); // 5 minutes
}

// Global error handlers
process.on('uncaughtException', (error) => {
  enhancedLogger.trackError(error, {
    type: 'uncaught_exception',
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  enhancedLogger.trackPromiseRejection(reason, {
    type: 'unhandled_rejection',
    promise: promise.toString(),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  enhancedLogger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  enhancedLogger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Log startup information
enhancedLogger.info('Logger initialized', {
  environment: process.env.NODE_ENV,
  logLevel: getLogLevel(),
  samplingConfig: SAMPLING_CONFIG,
});

export default enhancedLogger;