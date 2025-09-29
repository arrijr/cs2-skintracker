// /backend/scripts/safety-guard.js (Backend)
// {/* Safety guard for production database protection */}

import "dotenv/config";

/**
 * Safety guard to prevent destructive operations in production
 * @param {string} operation - Description of the operation being performed
 * @param {boolean} allowInProduction - Whether this operation is allowed in production
 * @throws {Error} If operation is not allowed in production
 */
export function checkProductionSafety(operation, allowInProduction = false) {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  
  console.log(`🔒 [SAFETY] Checking operation: ${operation}`);
  console.log(`🔒 [SAFETY] NODE_ENV: ${nodeEnv}`);
  console.log(`🔒 [SAFETY] Is Production: ${isProduction}`);
  
  if (isProduction && !allowInProduction) {
    const error = new Error(`❌ SAFETY VIOLATION: ${operation} is not allowed in production environment!`);
    console.error(error.message);
    console.error('🔒 [SAFETY] To run this operation, set NODE_ENV=development');
    process.exit(1);
  }
  
  console.log(`✅ [SAFETY] Operation ${operation} is allowed`);
}

/**
 * Check if we're connected to production database
 * @returns {boolean} True if connected to production database
 */
export function isProductionDatabase() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const isSupabase = databaseUrl.includes('supabase.com');
  const isPooler = databaseUrl.includes('pooler.supabase.com');
  
  console.log(`🔒 [SAFETY] Database URL contains 'supabase.com': ${isSupabase}`);
  console.log(`🔒 [SAFETY] Database URL contains 'pooler.supabase.com': ${isPooler}`);
  
  return isSupabase && isPooler;
}

/**
 * Safe database operation wrapper
 * @param {Function} operation - The database operation to perform
 * @param {string} operationName - Name of the operation for logging
 * @param {boolean} allowInProduction - Whether this operation is allowed in production
 */
export async function safeDatabaseOperation(operation, operationName, allowInProduction = false) {
  try {
    checkProductionSafety(operationName, allowInProduction);
    
    if (isProductionDatabase()) {
      console.log(`🔒 [SAFETY] Connected to production database - extra caution required`);
    }
    
    const result = await operation();
    console.log(`✅ [SAFETY] Operation ${operationName} completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ [SAFETY] Operation ${operationName} failed:`, error.message);
    throw error;
  }
}
