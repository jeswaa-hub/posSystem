const express = require("express");
const router = express.Router();
const { verifyTokenAndAdmin } = require("../middleware/authMiddleware");
const { Transaction, Product, Inventory, User, Customer } = require("../models");
const mongoose = require("mongoose");

// Reports are sensitive, admin only
router.use(verifyTokenAndAdmin);

// Helper to get date range
const getDateRange = (period) => {
  const now = new Date();
  let start = new Date();
  
  switch(period) {
    case 'day':
      start.setHours(0,0,0,0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start = new Date(0); // All time
  }
  return { start, end: now };
};

// 1. Sales Report
router.get("/sales", async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const transactions = await Transaction.find({
      createdAt: { $gte: start, $lte: end },
      status: "completed"
    });

    const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTransactions = transactions.length;
    
    // Group by date for chart
    const salesByDate = transactions.reduce((acc, t) => {
      const date = t.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + t.totalAmount;
      return acc;
    }, {});

    const chartData = Object.keys(salesByDate).map(date => ({
      date,
      amount: salesByDate[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      totalSales,
      totalTransactions,
      chartData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Inventory Report
router.get("/inventory", async (req, res) => {
  try {
    const inventory = await Inventory.find().populate("product");
    
    let totalValue = 0;
    let totalItems = 0;
    let lowStockItems = [];

    inventory.forEach(item => {
      if (item.product) {
        const value = item.stockOnHand * item.product.cost;
        totalValue += value;
        totalItems += item.stockOnHand;
        
        if (item.stockOnHand <= item.reorderPoint) {
          lowStockItems.push({
            name: item.product.name,
            stock: item.stockOnHand,
            reorderPoint: item.reorderPoint
          });
        }
      }
    });

    res.json({
      totalValue,
      totalItems,
      lowStockCount: lowStockItems.length,
      lowStockItems
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Customer Report
router.get("/customers", async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const transactions = await Transaction.find({
      createdAt: { $gte: start, $lte: end },
      status: "completed",
      customer: { $ne: null }
    }).populate("customer");

    const customerSales = {};

    transactions.forEach(t => {
      if (t.customer) {
        const id = t.customer._id.toString();
        if (!customerSales[id]) {
          customerSales[id] = {
            name: t.customer.fullName,
            totalSpent: 0,
            transactions: 0
          };
        }
        customerSales[id].totalSpent += t.totalAmount;
        customerSales[id].transactions += 1;
      }
    });

    const topCustomers = Object.values(customerSales)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.json({ topCustomers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Cashier Report
router.get("/cashiers", async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const transactions = await Transaction.find({
      createdAt: { $gte: start, $lte: end },
      status: "completed",
      cashier: { $ne: null }
    }).populate("cashier");

    const cashierStats = {};

    transactions.forEach(t => {
      if (t.cashier) {
        const id = t.cashier._id.toString();
        if (!cashierStats[id]) {
          cashierStats[id] = {
            name: t.cashier.fullName,
            totalSales: 0,
            transactions: 0
          };
        }
        cashierStats[id].totalSales += t.totalAmount;
        cashierStats[id].transactions += 1;
      }
    });

    const data = Object.values(cashierStats).sort((a, b) => b.totalSales - a.totalSales);

    res.json({ cashiers: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Profit & Loss Report
router.get("/profit-loss", async (req, res) => {
  try {
    const { period } = req.query;
    const { start, end } = getDateRange(period);

    const transactions = await Transaction.find({
      createdAt: { $gte: start, $lte: end },
      status: "completed"
    });

    let totalRevenue = 0;
    let totalCost = 0;

    transactions.forEach(t => {
      totalRevenue += t.totalAmount;
      totalCost += t.totalCost || 0; // Assuming totalCost is saved in transaction
    });

    const grossProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    res.json({
      totalRevenue,
      totalCost,
      grossProfit,
      margin
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
