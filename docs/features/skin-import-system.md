# Skin Import System

## Overview

The skin import system provides safe, production-ready tools for importing CS2 skins from the Steam Web API and generating realistic price data. All scripts include safety guards to prevent accidental data loss in production environments.

## Components

### 1. Steam API Import (`steamImportSkins.js`)

**Purpose**: Import all CS2 skins from Steam Web API with safe upsert operations.

**Features**:
- **Safety Guards**: Only runs in development environment (`NODE_ENV=development`)
- **Rate Limiting**: Implements exponential backoff and batch processing
- **Idempotent Operations**: Uses `marketHashName` as unique key for upserts
- **Job Tracking**: Records import progress in `JobRun` table
- **Error Handling**: Comprehensive error logging and retry logic

**Usage**:
```bash
# Dry run (no database writes)
NODE_ENV=development node scripts/steamImportSkins.js --dry-run

# Real run (imports skins)
NODE_ENV=development node scripts/steamImportSkins.js --real-run
```

**Configuration**:
- `BATCH_SIZE`: 50 items per batch
- `BATCH_DELAY`: 2000ms between batches
- `MAX_RETRIES`: 3 retries with exponential backoff
- `TIMEOUT`: 30 seconds per request

### 2. Realistic Price Generation (`generateRealisticPrices.js`)

**Purpose**: Generate realistic CS2 skin prices based on market knowledge when Steam API prices are unavailable.

**Features**:
- **CS2 Market Knowledge**: Prices based on real weapon types, rarities, and wear conditions
- **Realistic Variations**: Creates priceLatest, priceMedian, priceAvg, priceMin, priceMax
- **Market Data**: Generates volume, sales, and stability data
- **Price History**: Creates historical price entries for analytics
- **Safety Guards**: Only runs in development environment

**Price Logic**:

#### Weapon Base Prices (USD)
- **Knives**: $50-$12,000 (highest value items)
- **Rifles**: $0.50-$8,000 (AK-47, AWP, M4A4, M4A1-S, etc.)
- **Pistols**: $0.05-$1,200 (Glock, USP, Desert Eagle, etc.)
- **SMGs**: $0.05-$400 (MAC-10, MP9, MP7, etc.)
- **Shotguns**: $0.05-$150 (Nova, XM1014, etc.)

#### Rarity Multipliers
- **Consumer**: 1.0x
- **Industrial**: 1.5x
- **Mil-Spec**: 2.0x
- **Restricted**: 4.0x
- **Classified**: 8.0x
- **Covert**: 16.0x
- **Contraband**: 50.0x
- **Rare**: 100.0x
- **Legendary**: 200.0x
- **Ancient**: 500.0x
- **Mythical**: 1000.0x

#### Wear Condition Multipliers
- **Factory New (FN)**: 1.0x
- **Minimal Wear (MW)**: 0.8x
- **Field-Tested (FT)**: 0.6x
- **Well-Worn (WW)**: 0.4x
- **Battle-Scarred (BS)**: 0.2x

#### StatTrak Multiplier
- **StatTrak Items**: 2.5x

**Usage**:
```bash
NODE_ENV=development node scripts/generateRealisticPrices.js
```

### 3. Safety Guard System (`safety-guard.js`)

**Purpose**: Prevent destructive database operations in production environments.

**Features**:
- **Environment Checks**: Verifies `NODE_ENV` before allowing operations
- **Operation Logging**: Logs all safety checks and violations
- **Graceful Failures**: Exits with clear error messages for violations
- **Production Protection**: Blocks all destructive operations in production

**Functions**:
```javascript
// Check if operation is allowed in current environment
checkProductionSafety(operationName, allowInProduction = false)

// Safely execute database operations
safeDatabaseOperation(prismaOperation, operationName, isDestructive = false)
```

### 4. Diagnostics Scripts

#### Price Data Check (`checkPriceData.js`)
**Purpose**: Analyze price data distribution and identify missing prices.

**Output**:
- Count of skins with/without prices
- Sample skins with price data
- Sample skins without price data
- Price history statistics

#### Database Health Check (`checkAllTables.js`)
**Purpose**: Verify database integrity and count records in all tables.

**Output**:
- Record counts for all tables
- Database connection status
- Environment information

## Database Schema Changes

### Extended JobRun Model
```prisma
model JobRun {
  id            String   @id @default(cuid())
  jobName       String   // e.g., "steam_skin_import"
  status        String   // "running", "completed", "failed"
  
  // Import statistics
  insertedCount Int?     // records inserted
  updatedCount  Int?     // records updated
  failedCount   Int?     // records that failed
  finalCount    Int?     // final count after completion
  
  // Timing and details
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  details       String?  // detailed status message
  error         String?  // error message if failed
  
  // Optional admin tracking
  adminId       Int?     // who triggered the job
  admin         User?    @relation(fields: [adminId], references: [id])
  
  // Rate limiting
  rateLimitKey  String?  // for rate limiting (jobName + adminId)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([jobName, status])
  @@index([adminId])
  @@index([rateLimitKey])
}
```

## Import Process Flow

1. **Safety Check**: Verify `NODE_ENV=development`
2. **API Connection**: Test Steam Web API connectivity
3. **Batch Processing**: Fetch skins in batches of 50
4. **Data Mapping**: Map Steam API fields to database schema
5. **Upsert Operations**: Insert new or update existing skins
6. **Price Generation**: Generate realistic prices for skins without price data
7. **History Creation**: Create price history entries
8. **Job Tracking**: Record progress in JobRun table
9. **Completion**: Log final statistics and cleanup

## Error Handling

### Rate Limiting
- **HTTP 429**: Exponential backoff with increasing delays
- **Timeout**: 30-second timeout per request
- **Retries**: Maximum 3 retries per request

### Database Errors
- **Connection Issues**: Graceful disconnection and error logging
- **Constraint Violations**: Skip problematic records and continue
- **Transaction Failures**: Rollback and retry with smaller batches

### API Errors
- **Authentication**: Clear error messages for missing API keys
- **Network Issues**: Retry logic with exponential backoff
- **Data Format**: Validation and error logging for malformed responses

## Performance Considerations

### Batch Processing
- **Batch Size**: 50 items per batch (configurable)
- **Batch Delay**: 2 seconds between batches
- **Memory Usage**: Processes items in chunks to prevent memory issues

### Database Optimization
- **Indexes**: Uses existing indexes on `marketHashName`
- **Upserts**: Single operation for insert/update
- **Transactions**: Batched operations for better performance

### Rate Limiting
- **Steam API**: Respects rate limits with delays
- **Database**: Prevents overwhelming with batch processing
- **Memory**: Processes large datasets in chunks

## Monitoring and Logging

### Job Tracking
- **Progress**: Real-time updates in JobRun table
- **Statistics**: Detailed counts of operations performed
- **Errors**: Comprehensive error logging with context

### Console Logging
- **Progress**: Regular updates during processing
- **Warnings**: Rate limiting and retry notifications
- **Errors**: Detailed error messages with stack traces
- **Success**: Final statistics and completion confirmation

## Troubleshooting

### Common Issues

#### "STEAM_API_KEY not found"
- **Cause**: Missing environment variable
- **Solution**: Set `STEAM_API_KEY` in `.env` file or environment

#### "Rate limit exceeded"
- **Cause**: Too many API requests
- **Solution**: Script implements automatic retry with backoff

#### "Safety violation in production"
- **Cause**: Trying to run import in production
- **Solution**: Set `NODE_ENV=development` for imports

#### "Database connection failed"
- **Cause**: Invalid `DATABASE_URL` or database unavailable
- **Solution**: Verify database connection and URL

### Diagnostic Commands
```bash
# Check environment variables
NODE_ENV=development node scripts/checkEnv.js

# Check database connection
NODE_ENV=development node scripts/checkDatabase.js

# Check price data distribution
NODE_ENV=development node scripts/checkPriceData.js

# Check all table counts
NODE_ENV=development node scripts/checkAllTables.js
```

## Security Considerations

### Production Safety
- **Environment Checks**: All scripts verify `NODE_ENV`
- **No Destructive Operations**: Production blocks all destructive commands
- **Upsert Only**: Only safe insert/update operations allowed
- **API Key Protection**: Keys are never logged in full

### Data Integrity
- **Idempotent Operations**: Scripts can be run multiple times safely
- **Transaction Safety**: Database operations use transactions
- **Backup Protection**: No automatic data deletion or truncation

## Future Enhancements

### Planned Features
- **Real-time Price Updates**: Periodic price updates from Steam API
- **Price Validation**: Cross-reference with multiple price sources
- **Import Scheduling**: Automated import scheduling with cron jobs
- **Price Alerts**: Notifications for significant price changes

### Performance Improvements
- **Parallel Processing**: Concurrent batch processing
- **Caching**: Redis caching for frequently accessed data
- **Compression**: Data compression for large imports
- **Streaming**: Stream processing for very large datasets
