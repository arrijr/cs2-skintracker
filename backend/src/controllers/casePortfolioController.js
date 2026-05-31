// /backend/src/controllers/casePortfolioController.js — [Backend]
// {/* Case Portfolio Controller - Handle case portfolio operations */}
import prisma from '../prisma/prismaClient.js';

/**
 * Get user's case portfolio
 * GET /api/case-portfolio
 */
const getCasePortfolio = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const casePortfolio = await prisma.casePortfolio.findMany({
      where: { userId },
      include: {
        case: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            marketCap: true,
            remaining: true,
            timeToExtinction: true,
            priceChange24h: true,
            isDiscontinued: true
          }
        }
      },
      orderBy: {
        buyDate: 'desc'
      }
    });

    // Calculate portfolio value and P&L
    const portfolioWithStats = casePortfolio.map(entry => {
      const currentValue = entry.case.price || 0;
      const totalValue = currentValue * entry.amount;
      const totalCost = entry.buyPrice * entry.amount;
      const unrealizedPL = totalValue - totalCost;
      const unrealizedPLPercent = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

      return {
        ...entry,
        currentValue,
        totalValue,
        totalCost,
        unrealizedPL,
        unrealizedPLPercent
      };
    });

    // Calculate total portfolio stats
    const totalValue = portfolioWithStats.reduce((sum, entry) => sum + entry.totalValue, 0);
    const totalCost = portfolioWithStats.reduce((sum, entry) => sum + entry.totalCost, 0);
    const totalUnrealizedPL = totalValue - totalCost;
    const totalUnrealizedPLPercent = totalCost > 0 ? (totalUnrealizedPL / totalCost) * 100 : 0;

    res.json({
      portfolio: portfolioWithStats,
      stats: {
        totalValue,
        totalCost,
        totalUnrealizedPL,
        totalUnrealizedPLPercent,
        totalCases: portfolioWithStats.length,
        totalAmount: portfolioWithStats.reduce((sum, entry) => sum + entry.amount, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching case portfolio:', error);
    res.status(500).json({ 
      error: 'Failed to fetch case portfolio',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })

    });
  }
};

/**
 * Add case to portfolio
 * POST /api/case-portfolio
 */
const addCaseToPortfolio = async (req, res) => {
  try {
    const userId = req.userId;
    const { caseId, amount, buyPrice, buyDate } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!caseId || !amount || !buyPrice) {
      return res.status(400).json({ error: 'Missing required fields: caseId, amount, buyPrice' });
    }

    // Server-side amount cap — prevents a crafted huge amount overflowing KPI math.
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > 100000) {
      return res.status(400).json({ error: 'amount must be a positive number ≤ 100000' });
    }

    // Check if case exists
    const caseExists = await prisma.case.findUnique({
      where: { id: parseInt(caseId) }
    });

    if (!caseExists) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check if already in portfolio
    const existingEntry = await prisma.casePortfolio.findUnique({
      where: {
        userId_caseId: {
          userId,
          caseId: parseInt(caseId)
        }
      }
    });

    if (existingEntry) {
      // Update existing entry
      const updatedEntry = await prisma.casePortfolio.update({
        where: {
          userId_caseId: {
            userId,
            caseId: parseInt(caseId)
          }
        },
        data: {
          amount: existingEntry.amount + parseInt(amount),
          buyPrice: (existingEntry.buyPrice * existingEntry.amount + parseFloat(buyPrice) * parseInt(amount)) / (existingEntry.amount + parseInt(amount)), // Weighted average
          buyDate: buyDate ? new Date(buyDate) : new Date()
        },
        include: {
          case: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              price: true
            }
          }
        }
      });

      return res.json({
        message: 'Case portfolio updated',
        entry: updatedEntry
      });
    } else {
      // Create new entry
      const newEntry = await prisma.casePortfolio.create({
        data: {
          userId,
          caseId: parseInt(caseId),
          amount: parseInt(amount),
          buyPrice: parseFloat(buyPrice),
          buyDate: buyDate ? new Date(buyDate) : new Date()
        },
        include: {
          case: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              price: true
            }
          }
        }
      });

      return res.json({
        message: 'Case added to portfolio',
        entry: newEntry
      });
    }

  } catch (error) {
    console.error('Error adding case to portfolio:', error);
    res.status(500).json({ 
      error: 'Failed to add case to portfolio',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })

    });
  }
};

/**
 * Remove case from portfolio
 * DELETE /api/case-portfolio/:caseId
 */
const removeCaseFromPortfolio = async (req, res) => {
  try {
    const userId = req.userId;
    const { caseId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const deletedEntry = await prisma.casePortfolio.delete({
      where: {
        userId_caseId: {
          userId,
          caseId: parseInt(caseId)
        }
      }
    });

    res.json({
      message: 'Case removed from portfolio',
      entry: deletedEntry
    });

  } catch (error) {
    console.error('Error removing case from portfolio:', error);
    res.status(500).json({ 
      error: 'Failed to remove case from portfolio',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })

    });
  }
};

/**
 * Update case portfolio entry
 * PATCH /api/case-portfolio/:caseId
 */
const updateCasePortfolio = async (req, res) => {
  try {
    const userId = req.userId;
    const { caseId } = req.params;
    const { amount, buyPrice, buyDate } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseInt(amount);
    if (buyPrice !== undefined) updateData.buyPrice = parseFloat(buyPrice);
    if (buyDate !== undefined) updateData.buyDate = new Date(buyDate);

    const updatedEntry = await prisma.casePortfolio.update({
      where: {
        userId_caseId: {
          userId,
          caseId: parseInt(caseId)
        }
      },
      data: updateData,
      include: {
        case: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true
          }
        }
      }
    });

    res.json({
      message: 'Case portfolio updated',
      entry: updatedEntry
    });

  } catch (error) {
    console.error('Error updating case portfolio:', error);
    res.status(500).json({ 
      error: 'Failed to update case portfolio',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })

    });
  }
};

export default {
  getCasePortfolio,
  addCaseToPortfolio,
  removeCaseFromPortfolio,
  updateCasePortfolio
};
