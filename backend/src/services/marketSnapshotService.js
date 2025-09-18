// [SERVICE] Market Snapshot Service — fetching and persistence for quantity history

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class MarketSnapshotService {
  constructor() {
    this.rateLimitDelay = 1000; // 1 second between requests
    this.batchSize = 10; // Process 10 skins at a time
  }

  /**
   * Fetch market data for a single skin from Steam API
   * @param {Object} skin - Skin object with marketHashName
   * @returns {Object|null} Market data or null if failed
   */
  async fetchSkinMarketData(skin) {
    try {
      // Use existing Steam service or create new API call
      // This is a placeholder - implement actual Steam API call
      const marketData = {
        priceUsd: skin.priceAvg || skin.priceMedian || skin.priceLatest,
        activeListings: skin.offerVolume || 0,
        soldVolume24h: skin.sold24h || null,
        source: 'steam',
        fetchedAt: new Date()
      };

      console.log(`[MarketSnapshot] Fetched data for ${skin.name}:`, marketData);
      return marketData;
    } catch (error) {
      console.error(`[MarketSnapshot] Failed to fetch data for skin ${skin.id}:`, error);
      return null;
    }
  }

  /**
   * Store or update market snapshot for a skin
   * @param {number} skinId - Skin ID
   * @param {Object} marketData - Market data object
   * @param {Date} date - Date for the snapshot (defaults to today)
   */
  async storeMarketSnapshot(skinId, marketData, date = new Date()) {
    try {
      const snapshotDate = new Date(date);
      snapshotDate.setHours(0, 0, 0, 0); // Start of day

      const snapshot = await prisma.marketSnapshot.upsert({
        where: {
          skinId_date: {
            skinId: skinId,
            date: snapshotDate
          }
        },
        update: {
          priceUsd: marketData.priceUsd,
          activeListings: marketData.activeListings,
          soldVolume24h: marketData.soldVolume24h,
          source: marketData.source,
          fetchedAt: marketData.fetchedAt,
          updatedAt: new Date()
        },
        create: {
          skinId: skinId,
          date: snapshotDate,
          priceUsd: marketData.priceUsd,
          activeListings: marketData.activeListings,
          soldVolume24h: marketData.soldVolume24h,
          source: marketData.source,
          fetchedAt: marketData.fetchedAt
        }
      });

      console.log(`[MarketSnapshot] Stored snapshot for skin ${skinId} on ${snapshotDate.toISOString().split('T')[0]}`);
      return snapshot;
    } catch (error) {
      console.error(`[MarketSnapshot] Failed to store snapshot for skin ${skinId}:`, error);
      throw error;
    }
  }

  /**
   * Process a batch of skins for market snapshots
   * @param {Array} skins - Array of skin objects
   * @param {Date} date - Date for snapshots (defaults to today)
   */
  async processBatch(skins, date = new Date()) {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const skin of skins) {
      try {
        results.processed++;
        
        // Fetch market data
        const marketData = await this.fetchSkinMarketData(skin);
        if (!marketData) {
          results.failed++;
          results.errors.push(`Failed to fetch data for skin ${skin.id} (${skin.name})`);
          continue;
        }

        // Store snapshot
        await this.storeMarketSnapshot(skin.id, marketData, date);
        results.successful++;

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing skin ${skin.id}: ${error.message}`);
        console.error(`[MarketSnapshot] Error processing skin ${skin.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Run daily market snapshot job for all tracked skins
   * @param {Object} options - Job options
   * @param {boolean} options.dryRun - If true, don't actually store data
   * @param {number} options.limit - Limit number of skins to process
   * @param {Date} options.date - Date for snapshots (defaults to today)
   */
  async runDailySnapshot(options = {}) {
    const { dryRun = false, limit = null, date = new Date() } = options;
    
    console.log(`[MarketSnapshot] Starting daily snapshot job${dryRun ? ' (DRY RUN)' : ''} for ${date.toISOString().split('T')[0]}`);

    try {
      // Get all skins that have price data (indicating they're tracked)
      const whereClause = {
        OR: [
          { priceAvg: { not: null } },
          { priceMedian: { not: null } },
          { priceLatest: { not: null } }
        ]
      };

      const skins = await prisma.skin.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          marketHashName: true,
          priceAvg: true,
          priceMedian: true,
          priceLatest: true,
          offerVolume: true,
          sold24h: true
        },
        take: limit
      });

      console.log(`[MarketSnapshot] Found ${skins.length} skins to process`);

      if (dryRun) {
        console.log(`[MarketSnapshot] DRY RUN - Would process ${skins.length} skins`);
        return {
          total: skins.length,
          processed: 0,
          successful: 0,
          failed: 0,
          errors: []
        };
      }

      // Process in batches
      const batchResults = [];
      for (let i = 0; i < skins.length; i += this.batchSize) {
        const batch = skins.slice(i, i + this.batchSize);
        console.log(`[MarketSnapshot] Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(skins.length / this.batchSize)}`);
        
        const result = await this.processBatch(batch, date);
        batchResults.push(result);
      }

      // Aggregate results
      const totalResults = batchResults.reduce((acc, result) => ({
        processed: acc.processed + result.processed,
        successful: acc.successful + result.successful,
        failed: acc.failed + result.failed,
        errors: [...acc.errors, ...result.errors]
      }), { processed: 0, successful: 0, failed: 0, errors: [] });

      console.log(`[MarketSnapshot] Daily snapshot completed:`, totalResults);
      return {
        total: skins.length,
        ...totalResults
      };

    } catch (error) {
      console.error(`[MarketSnapshot] Daily snapshot job failed:`, error);
      throw error;
    }
  }

  /**
   * Get quantity history for a skin
   * @param {number} skinId - Skin ID
   * @param {string} range - Time range (7d, 30d, 90d, 1y, all)
   * @returns {Array} Array of quantity history data
   */
  async getQuantityHistory(skinId, range = '30d') {
    try {
      let startDate = new Date();
      
      switch (range) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date('2020-01-01'); // Far back date
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const snapshots = await prisma.marketSnapshot.findMany({
        where: {
          skinId: skinId,
          date: {
            gte: startDate
          }
        },
        select: {
          date: true,
          activeListings: true,
          soldVolume24h: true,
          priceUsd: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      return snapshots.map(snapshot => ({
        date: snapshot.date.toISOString().split('T')[0], // YYYY-MM-DD format
        activeListings: snapshot.activeListings,
        soldVolume24h: snapshot.soldVolume24h,
        priceUsd: snapshot.priceUsd
      }));

    } catch (error) {
      console.error(`[MarketSnapshot] Failed to get quantity history for skin ${skinId}:`, error);
      throw error;
    }
  }

  /**
   * Get latest market snapshot for a skin
   * @param {number} skinId - Skin ID
   * @returns {Object|null} Latest snapshot or null
   */
  async getLatestSnapshot(skinId) {
    try {
      const snapshot = await prisma.marketSnapshot.findFirst({
        where: { skinId: skinId },
        orderBy: { date: 'desc' },
        select: {
          date: true,
          activeListings: true,
          soldVolume24h: true,
          priceUsd: true,
          fetchedAt: true
        }
      });

      return snapshot;
    } catch (error) {
      console.error(`[MarketSnapshot] Failed to get latest snapshot for skin ${skinId}:`, error);
      return null;
    }
  }
}

export default new MarketSnapshotService();
