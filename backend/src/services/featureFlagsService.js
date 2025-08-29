import prisma from "../prisma/prismaClient.js";

// Feature Flags service for centralized feature management
export class FeatureFlagsService {
  // Default feature flags configuration
  static DEFAULT_FLAGS = {
    // Phase 1: Basic Admin
    ADMIN_BASIC: {
      name: 'Basic Admin Features',
      description: 'Overview, Jobs, Logs (Phase 1)',
      defaultValue: true,
      environment: 'all'
    },
    
    // Phase 2: Job Management
    ADMIN_JOB_MANAGEMENT: {
      name: 'Job Management',
      description: 'Manual job execution and monitoring (Phase 2)',
      defaultValue: true,
      environment: 'all'
    },
    
    // Phase 3: Analytics & Explorer
    ADMIN_COVERAGE_EXPLORER: {
      name: 'Coverage Explorer',
      description: 'Price coverage analysis and data gaps (Phase 3)',
      defaultValue: false,
      environment: 'preview'
    },
    ADMIN_API_HEALTH: {
      name: 'API Health Monitoring',
      description: 'External API success/latency monitoring (Phase 3)',
      defaultValue: true,
      environment: 'all'
    },
    ADMIN_DQ_ALERTS: {
      name: 'Data Quality Alerts',
      description: 'Automated data quality monitoring (Phase 3)',
      defaultValue: false,
      environment: 'preview'
    },
    
    // Phase 4: Advanced Features
    ADMIN_USER_MANAGEMENT: {
      name: 'User Management',
      description: 'User administration and soft actions (Phase 4)',
      defaultValue: false,
      environment: 'preview'
    },
    ADMIN_FEATURE_FLAGS: {
      name: 'Feature Flags Management',
      description: 'Centralized feature flag control (Phase 4)',
      defaultValue: false,
      environment: 'preview'
    },
    ADMIN_BACKFILL_TOOLS: {
      name: 'Backfill Tools',
      description: 'Data gap filling and repair tools (Phase 4)',
      defaultValue: false,
      environment: 'preview'
    },
    
    // Production Safety Flags
    ALLOW_ADMIN_WRITES_IN_PROD: {
      name: 'Allow Admin Writes in Production',
      description: 'Enable write operations in production environment',
      defaultValue: false,
      environment: 'production'
    },
    ENABLE_CRON_JOBS: {
      name: 'Enable Cron Jobs',
      description: 'Enable scheduled background jobs',
      defaultValue: true,
      environment: 'all'
    }
  };

  // Get all feature flags
  static async getAllFlags() {
    try {
      // For now, return default flags
      // In production, you'd store these in a database
      const flags = {};
      
      for (const [key, config] of Object.entries(this.DEFAULT_FLAGS)) {
        // Check environment-specific overrides
        const envValue = process.env[key];
        const defaultValue = config.defaultValue;
        
        flags[key] = {
          key,
          ...config,
          currentValue: envValue !== undefined ? envValue === 'true' : defaultValue,
          isOverridden: envValue !== undefined,
          environmentValue: envValue
        };
      }
      
      return flags;
      
    } catch (error) {
      console.error('Error getting feature flags:', error);
      throw error;
    }
  }

  // Get specific feature flag value
  static async getFlagValue(flagKey) {
    try {
      const config = this.DEFAULT_FLAGS[flagKey];
      if (!config) {
        throw new Error(`Unknown feature flag: ${flagKey}`);
      }
      
      // Check environment override first
      const envValue = process.env[flagKey];
      if (envValue !== undefined) {
        return envValue === 'true';
      }
      
      // Return default value
      return config.defaultValue;
      
    } catch (error) {
      console.error(`Error getting flag value for ${flagKey}:`, error);
      // Return false as safe default
      return false;
    }
  }

  // Check if feature is enabled
  static async isFeatureEnabled(flagKey) {
    try {
      return await this.getFlagValue(flagKey);
    } catch (error) {
      console.error(`Error checking feature flag ${flagKey}:`, error);
      return false;
    }
  }

  // Update feature flag value (admin only)
  static async updateFlagValue(flagKey, newValue, adminId) {
    try {
      const config = this.DEFAULT_FLAGS[flagKey];
      if (!config) {
        throw new Error(`Unknown feature flag: ${flagKey}`);
      }
      
      // Validate value
      if (typeof newValue !== 'boolean') {
        throw new Error('Flag value must be boolean');
      }
      
      // Check if flag can be modified
      if (config.environment === 'production' && process.env.NODE_ENV === 'production') {
        // Some flags are locked in production
        if (flagKey === 'ALLOW_ADMIN_WRITES_IN_PROD') {
          throw new Error('This flag cannot be modified in production');
        }
      }
      
      // In production, you'd update the database
      // For now, we'll just log the change
      console.log(`Feature flag ${flagKey} would be updated to ${newValue} by admin ${adminId}`);
      
      // Log admin action
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'feature_flag_update',
          resource: 'feature_flag',
          resourceId: flagKey,
          details: `Feature flag ${flagKey} updated to ${newValue}`,
          parameters: JSON.stringify({ flagKey, newValue })
        }
      });
      
      return {
        success: true,
        flagKey,
        oldValue: await this.getFlagValue(flagKey),
        newValue,
        message: 'Feature flag updated successfully'
      };
      
    } catch (error) {
      console.error(`Error updating feature flag ${flagKey}:`, error);
      throw error;
    }
  }

  // Get feature flags by environment
  static async getFlagsByEnvironment(environment) {
    try {
      const allFlags = await this.getAllFlags();
      const environmentFlags = {};
      
      for (const [key, flag] of Object.entries(allFlags)) {
        if (flag.environment === environment || flag.environment === 'all') {
          environmentFlags[key] = flag;
        }
      }
      
      return environmentFlags;
      
    } catch (error) {
      console.error('Error getting flags by environment:', error);
      throw error;
    }
  }

  // Get feature flags summary for admin dashboard
  static async getFlagsSummary() {
    try {
      const allFlags = await this.getAllFlags();
      
      let totalFlags = 0;
      let enabledFlags = 0;
      let overriddenFlags = 0;
      let previewFlags = 0;
      let productionFlags = 0;
      
      for (const flag of Object.values(allFlags)) {
        totalFlags++;
        if (flag.currentValue) enabledFlags++;
        if (flag.isOverridden) overriddenFlags++;
        if (flag.environment === 'preview') previewFlags++;
        if (flag.environment === 'production') productionFlags++;
      }
      
      return {
        totalFlags,
        enabledFlags,
        disabledFlags: totalFlags - enabledFlags,
        overriddenFlags,
        previewFlags,
        productionFlags,
        enabledPercentage: totalFlags > 0 ? (enabledFlags / totalFlags) * 100 : 0
      };
      
    } catch (error) {
      console.error('Error getting flags summary:', error);
      throw error;
    }
  }

  // Validate feature flag configuration
  static async validateFlagConfiguration() {
    try {
      const allFlags = await this.getAllFlags();
      const validationResults = [];
      
      for (const [key, flag] of Object.entries(allFlags)) {
        const validation = {
          flagKey: key,
          isValid: true,
          issues: []
        };
        
        // Check for required environment variables
        if (flag.environment === 'production' && process.env.NODE_ENV === 'production') {
          if (flag.key === 'ALLOW_ADMIN_WRITES_IN_PROD' && flag.currentValue) {
            validation.issues.push('Production write access enabled - use with caution');
          }
        }
        
        // Check for conflicting flags
        if (flag.key === 'ADMIN_DQ_ALERTS' && flag.currentValue) {
          if (!allFlags['ADMIN_COVERAGE_EXPLORER']?.currentValue) {
            validation.issues.push('Data Quality Alerts require Coverage Explorer to be enabled');
          }
        }
        
        if (validation.issues.length > 0) {
          validation.isValid = false;
        }
        
        validationResults.push(validation);
      }
      
      return {
        isValid: validationResults.every(r => r.isValid),
        results: validationResults,
        totalIssues: validationResults.reduce((sum, r) => sum + r.issues.length, 0)
      };
      
    } catch (error) {
      console.error('Error validating flag configuration:', error);
      throw error;
    }
  }

  // Get feature rollout status
  static async getFeatureRolloutStatus() {
    try {
      const allFlags = await this.getAllFlags();
      const rolloutStatus = {
        phase1: {
          name: 'Basic Admin',
          status: 'complete',
          features: ['Overview', 'Jobs', 'Logs'],
          completion: 100
        },
        phase2: {
          name: 'Job Management',
          status: 'complete',
          features: ['Manual Job Execution', 'Job Monitoring', 'Rate Limiting'],
          completion: 100
        },
        phase3: {
          name: 'Analytics & Explorer',
          status: 'in_progress',
          features: ['Coverage Explorer', 'API Health', 'Data Quality Alerts'],
          completion: 0
        },
        phase4: {
          name: 'Advanced Features',
          status: 'planned',
          features: ['User Management', 'Feature Flags', 'Backfill Tools'],
          completion: 0
        }
      };
      
      // Calculate Phase 3 completion
      const phase3Flags = ['ADMIN_COVERAGE_EXPLORER', 'ADMIN_API_HEALTH', 'ADMIN_DQ_ALERTS'];
      const phase3Enabled = phase3Flags.filter(key => allFlags[key]?.currentValue).length;
      rolloutStatus.phase3.completion = Math.round((phase3Enabled / phase3Flags.length) * 100);
      
      if (rolloutStatus.phase3.completion === 100) {
        rolloutStatus.phase3.status = 'complete';
        rolloutStatus.phase4.status = 'in_progress';
      }
      
      // Calculate Phase 4 completion
      const phase4Flags = ['ADMIN_USER_MANAGEMENT', 'ADMIN_FEATURE_FLAGS', 'ADMIN_BACKFILL_TOOLS'];
      const phase4Enabled = phase4Flags.filter(key => allFlags[key]?.currentValue).length;
      rolloutStatus.phase4.completion = Math.round((phase4Enabled / phase4Flags.length) * 100);
      
      if (rolloutStatus.phase4.completion === 100) {
        rolloutStatus.phase4.status = 'complete';
      }
      
      return rolloutStatus;
      
    } catch (error) {
      console.error('Error getting feature rollout status:', error);
      throw error;
    }
  }
}
