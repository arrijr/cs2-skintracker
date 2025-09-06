// /backend/src/cron/portfolioHistoryCron.js (Backend)
import cron from "node-cron";
import prisma from "../prisma/prismaClient.js";
import { calculateAndStorePortfolioValues } from "./portfolioHistoryService.js";

// 12-hourly portfolio history sampling (every 12 hours at 00:00 and 12:00)
const PORTFOLIO_HISTORY_CRON = '0 0,12 * * *';

export async function runPortfolioHistoryCron() {
  const startTime = new Date();
  console.log(`[CRON] Starting portfolio history job at ${startTime.toISOString()}`);
  
  try {
    // Check if we should run (environment guard)
    if (process.env.RUN_SCHEDULER === 'false') {
      console.log('[CRON] Portfolio history job skipped (RUN_SCHEDULER=false)');
      return;
    }

    // Run the portfolio history calculation
    await calculateAndStorePortfolioValues();
    
    const endTime = new Date();
    const duration = endTime - startTime;
    console.log(`[CRON] Portfolio history job completed in ${duration}ms`);
    
    // Log job run to database
    await prisma.jobRun.create({
      data: {
        jobName: 'portfolio-history',
        status: 'completed',
        startedAt: startTime,
        completedAt: endTime,
        duration: duration,
        resultCounts: {
          usersProcessed: await prisma.user.count(),
          portfolioEntries: await prisma.portfolioHistory.count({
            where: {
              date: {
                gte: startTime
              }
            }
          })
        }
      }
    });
    
  } catch (error) {
    console.error('[CRON] Portfolio history job failed:', error);
    
    // Log failed job run
    await prisma.jobRun.create({
      data: {
        jobName: 'portfolio-history',
        status: 'failed',
        startedAt: startTime,
        completedAt: new Date(),
        duration: new Date() - startTime,
        errorMessage: error.message,
        resultCounts: {}
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Schedule the cron job
if (process.env.NODE_ENV !== 'test') {
  console.log(`[CRON] Scheduling portfolio history job: ${PORTFOLIO_HISTORY_CRON}`);
  cron.schedule(PORTFOLIO_HISTORY_CRON, runPortfolioHistoryCron);
  
  // Run once at startup in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[CRON] Running portfolio history job once at startup (development)');
    runPortfolioHistoryCron();
  }
}

export default runPortfolioHistoryCron;
