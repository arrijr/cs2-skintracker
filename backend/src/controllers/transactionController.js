import prisma from "../prisma/prismaClient.js";

// GET USER TRANSACTIONS
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware
    
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { skin: true },
      orderBy: { date: 'desc' }
    });
    
    res.json({ transactions });
  } catch (error) {
    console.error("Failed to get transactions:", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
};

// ADD TRANSACTION (BUY/SELL)
export const addTransaction = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware
    const { skinId, type, amount, price, notes } = req.body;
    
    if (!skinId || !type || !amount || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (type !== 'BUY' && type !== 'SELL') {
      return res.status(400).json({ error: "Invalid transaction type" });
    }
    
    if (amount <= 0 || price <= 0) {
      return res.status(400).json({ error: "Amount and price must be positive" });
    }
    
    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        skinId,
        type,
        amount,
        price,
        notes
      },
      include: { skin: true }
    });
    
    // Update portfolio based on transaction type
    if (type === 'BUY') {
      await updatePortfolioOnBuy(userId, skinId, amount, price);
    } else if (type === 'SELL') {
      await updatePortfolioOnSell(userId, skinId, amount, price);
    }
    
    res.json({ transaction });
  } catch (error) {
    console.error("Failed to add transaction:", error);
    res.status(500).json({ error: "Failed to add transaction" });
  }
};

// UPDATE TRANSACTION
export const updateTransaction = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware
    const { id } = req.params;
    const { amount, price, notes } = req.body;
    
    // Get original transaction
    const original = await prisma.transaction.findFirst({
      where: { id: parseInt(id), userId }
    });
    
    if (!original) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    // Revert portfolio changes from original transaction
    if (original.type === 'BUY') {
      await updatePortfolioOnSell(userId, original.skinId, original.amount, original.price);
    } else if (original.type === 'SELL') {
      await updatePortfolioOnBuy(userId, original.skinId, original.amount, original.price);
    }
    
    // Update transaction
    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { amount, price, notes },
      include: { skin: true }
    });
    
    // Apply new portfolio changes
    if (updated.type === 'BUY') {
      await updatePortfolioOnBuy(userId, updated.skinId, updated.amount, updated.price);
    } else if (updated.type === 'SELL') {
      await updatePortfolioOnSell(userId, updated.skinId, updated.amount, updated.price);
    }
    
    res.json({ transaction: updated });
  } catch (error) {
    console.error("Failed to update transaction:", error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
};

// DELETE TRANSACTION
export const deleteTransaction = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware
    const { id } = req.params;
    
    const transaction = await prisma.transaction.findFirst({
      where: { id: parseInt(id), userId }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    // Revert portfolio changes
    if (transaction.type === 'BUY') {
      await updatePortfolioOnSell(userId, transaction.skinId, transaction.amount, transaction.price);
    } else if (transaction.type === 'SELL') {
      await updatePortfolioOnBuy(userId, transaction.skinId, transaction.amount, transaction.price);
    }
    
    await prisma.transaction.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
};

// Helper function to update portfolio on BUY transaction
async function updatePortfolioOnBuy(userId, skinId, amount, price) {
  const existing = await prisma.portfolio.findFirst({
    where: { userId, skinId }
  });
  
  if (existing) {
    // Update existing position with FIFO average cost
    const totalAmount = existing.amount + amount;
    const totalValue = (existing.amount * existing.buyPrice) + (amount * price);
    const avgPrice = totalValue / totalAmount;
    
    await prisma.portfolio.update({
      where: { id: existing.id },
      data: {
        amount: totalAmount,
        buyPrice: avgPrice
      }
    });
  } else {
    // Create new position
    await prisma.portfolio.create({
      data: {
        userId,
        skinId,
        amount,
        buyPrice: price,
        buyDate: new Date()
      }
    });
  }
}

// Helper function to update portfolio on SELL transaction
async function updatePortfolioOnSell(userId, skinId, amount, price) {
  const existing = await prisma.portfolio.findFirst({
    where: { userId, skinId }
  });
  
  if (!existing || existing.amount < amount) {
    throw new Error("Insufficient amount to sell");
  }
  
  if (existing.amount === amount) {
    // Sell entire position
    await prisma.portfolio.delete({
      where: { id: existing.id }
    });
  } else {
    // Reduce position (FIFO average cost remains the same)
    await prisma.portfolio.update({
      where: { id: existing.id },
      data: {
        amount: existing.amount - amount
      }
    });
  }
}
