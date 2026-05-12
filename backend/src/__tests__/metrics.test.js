/**
 * metricsService unit tests
 * Uses jest.unstable_mockModule to mock Prisma (ESM-safe)
 */
import { describe, it, expect, jest, beforeAll } from '@jest/globals';

// Mock prismaClient before importing the service
const mockPrismaCount = jest.fn();

jest.unstable_mockModule('../prisma/prismaClient.js', () => ({
  default: {
    user: {
      count: mockPrismaCount,
    },
    $connect: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('metricsService', () => {
  let calculateBusinessMetrics;

  beforeAll(async () => {
    // Dynamic import AFTER mock is set up
    const mod = await import('../services/metricsService.js');
    calculateBusinessMetrics = mod.calculateBusinessMetrics;
  });

  it('returns MRR, user counts, and tier breakdown', async () => {
    // totalUsers=10, isPremium(true)=3, churnedUsers=1
    mockPrismaCount
      .mockResolvedValueOnce(10) // totalUsers
      .mockResolvedValueOnce(3)  // payingUsers (isPremium true)
      .mockResolvedValueOnce(1); // churnedUsers

    const metrics = await calculateBusinessMetrics();
    expect(metrics).toHaveProperty('mrr');
    expect(metrics).toHaveProperty('totalUsers');
    expect(metrics).toHaveProperty('payingUsers');
    expect(metrics).toHaveProperty('freeUsers');
    expect(metrics).toHaveProperty('liteUsers');
    expect(metrics).toHaveProperty('proUsers');
    expect(typeof metrics.mrr).toBe('number');
  });

  it('calculates MRR correctly from tier counts', async () => {
    mockPrismaCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const metrics = await calculateBusinessMetrics();
    const expectedMrr = metrics.liteUsers * 4.99 + metrics.proUsers * 19.99;
    expect(metrics.mrr).toBeCloseTo(expectedMrr, 2);
  });

  it('freeUsers + payingUsers equals totalUsers', async () => {
    mockPrismaCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const metrics = await calculateBusinessMetrics();
    expect(metrics.freeUsers + metrics.payingUsers).toBe(metrics.totalUsers);
  });

  it('returns numeric arpu and churn estimate', async () => {
    mockPrismaCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const metrics = await calculateBusinessMetrics();
    expect(typeof metrics.arpu).toBe('number');
    expect(typeof metrics.estimatedMonthlyChurn).toBe('number');
    expect(typeof metrics.breakEvenUsers).toBe('number');
  });

  it('includes generatedAt ISO timestamp', async () => {
    mockPrismaCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const metrics = await calculateBusinessMetrics();
    expect(typeof metrics.generatedAt).toBe('string');
    expect(() => new Date(metrics.generatedAt)).not.toThrow();
  });

  it('handles zero paying users gracefully (no division by zero)', async () => {
    mockPrismaCount
      .mockResolvedValueOnce(5)  // totalUsers
      .mockResolvedValueOnce(0)  // payingUsers
      .mockResolvedValueOnce(0); // churnedUsers

    const metrics = await calculateBusinessMetrics();
    expect(metrics.mrr).toBe(0);
    expect(metrics.arpu).toBe(0);
    expect(metrics.estimatedMonthlyChurn).toBe(0);
  });
});
