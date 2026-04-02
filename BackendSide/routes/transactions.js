const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Transaction, Product, Inventory, InventoryLog, Settings } = require("../models");
const { verifyToken, verifyTokenAndAdmin } = require("../middleware/authMiddleware");

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const endOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const startRaw = parseDate(req.query.start);
    const endRaw = parseDate(req.query.end);
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 6);
    defaultStart.setHours(0, 0, 0, 0);

    const start = startRaw ? new Date(startRaw.setHours(0, 0, 0, 0)) : defaultStart;
    const end = endRaw ? endOfDay(endRaw) : endOfDay(now);
    const granularity = (req.query.granularity || "day").toLowerCase();

    const match = {
      createdAt: { $gte: start, $lte: end },
      status: "completed",
    };

    const bucketExpr =
      granularity === "month"
        ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
        : granularity === "week"
          ? {
              $concat: [
                { $toString: { $isoWeekYear: "$createdAt" } },
                "-W",
                { $toString: { $isoWeek: "$createdAt" } },
              ],
            }
          : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

    const trends = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: bucketExpr,
          revenue: { $sum: "$totalAmount" },
          profit: { $sum: { $ifNull: ["$grossProfit", 0] } },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          label: "$_id",
          revenue: 1,
          profit: 1,
          transactions: 1,
        },
      },
    ]);

    const topProducts = await Transaction.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          qty: { $sum: "$items.quantity" },
          sales: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$product.name",
          sku: "$product.sku",
          category: "$product.category",
          qty: 1,
          sales: 1,
        },
      },
    ]);

    const salesByCategory = await Transaction.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$product.category", "Uncategorized"] },
          sales: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { sales: -1 } },
      { $project: { _id: 0, category: "$_id", sales: 1 } },
    ]);

    const peakHours = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          sales: { $sum: "$totalAmount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, hour: "$_id", sales: 1, transactions: 1 } },
    ]);

    const paymentMethods = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          transactions: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { amount: -1 } },
      { $project: { _id: 0, method: "$_id", transactions: 1, amount: 1 } },
    ]);

    const totals = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalProfit: { $sum: { $ifNull: ["$grossProfit", 0] } },
          totalTransactions: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalProfit: 1,
          totalTransactions: 1,
          avgTicket: {
            $cond: [
              { $gt: ["$totalTransactions", 0] },
              { $divide: ["$totalRevenue", "$totalTransactions"] },
              0,
            ],
          },
        },
      },
    ]);

    res.json({
      range: { start, end, granularity },
      summary: totals[0] || { totalRevenue: 0, totalProfit: 0, totalTransactions: 0, avgTicket: 0 },
      trends,
      topProducts,
      salesByCategory,
      peakHours,
      paymentMethods,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("items.product", "name sku")
      .populate("customer", "fullName phone")
      .populate("cashier", "fullName")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("items.product", "name sku")
      .populate("customer", "fullName phone")
      .populate("cashier", "fullName");
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { items, customer, customerName, paymentMethod, notes, cashier: cashierId } = req.body;
    const io = req.app.get("io");
    const cashier = cashierId || req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in transaction" });
    }

    let totalAmount = 0;
    let totalCost = 0;
    const enrichedItems = [];
    
    // Validate stock and calculate totals first
    for (const it of items) {
      const product = await Product.findById(it.product);
      if (!product) throw new Error(`Product ${it.product} not found`);
      
      let hasRecipe = product.recipe && product.recipe.length > 0;
      let stockAvailable = product.stock;
      
      // If product has recipe, we check ingredients stock instead
      if (hasRecipe) {
        // Just checking sufficient ingredients here
        for (const ingredient of product.recipe) {
          const invItem = await Inventory.findOne({ product: ingredient.ingredient });
          const currentQty = invItem ? invItem.stockOnHand : 0;
          const reservedQty = invItem ? (invItem.reservedStock || 0) : 0;
          const availableQty = currentQty - reservedQty;
          const neededQty = ingredient.quantity * it.quantity;
          
          if (availableQty < neededQty) {
             const ingProd = await Product.findById(ingredient.ingredient);
             throw new Error(`Insufficient stock for ingredient: ${ingProd ? ingProd.name : 'Unknown'} (Needed: ${neededQty}, Available: ${availableQty})`);
          }
        }
        // Stock for the main product is virtual or just tracking sales count
        stockAvailable = 9999; 
      } else {
        // Direct stock check
        let inventory = await Inventory.findOne({ product: it.product });
        
        if (inventory) {
           const reserved = inventory.reservedStock || 0;
           stockAvailable = inventory.stockOnHand - reserved;
           
           // Desync fix
           if (inventory.stockOnHand === 0 && product.stock > 0) {
              console.log(`Stock Desync detected for ${product.name}. Syncing Inventory from Product...`);
              inventory.stockOnHand = product.stock;
              await inventory.save();
              stockAvailable = inventory.stockOnHand - reserved;
           }
        } else {
           stockAvailable = product.stock || 0;
        }

        console.log(`Checking available stock for ${product.name}: Available=${stockAvailable}, Requested=${it.quantity}`);

        if (stockAvailable < it.quantity) throw new Error(`Insufficient available stock for ${product.name} (Available: ${stockAvailable}, Reserved: ${inventory?.reservedStock || 0})`);
      }

      const cost = Number(product.cost || 0);
      const subtotal = product.price * it.quantity;
      const costSubtotal = cost * it.quantity;
      const profitSubtotal = subtotal - costSubtotal;
      totalAmount += subtotal;
      totalCost += costSubtotal;
      enrichedItems.push({ 
        product: it.product, 
        quantity: it.quantity, 
        price: product.price, 
        cost, 
        subtotal, 
        costSubtotal, 
        profitSubtotal,
        currentStock: stockAvailable,
        hasRecipe,
        recipe: product.recipe 
      });
    }

    // Get Tax Rate from Settings
    const settings = await Settings.findOne();
    const taxRate = settings ? settings.taxRate : 12; // Default to 12% if no settings found

    const tax = totalAmount * (taxRate / 100);
    const netAmount = totalAmount + tax;
    const grossProfit = totalAmount - totalCost;

    const transaction = await Transaction.create({
      transactionId: `TXN-${Date.now()}`,
      items: enrichedItems.map(i => ({
        product: i.product, 
        quantity: i.quantity, 
        price: i.price, 
        cost: i.cost, 
        subtotal: i.subtotal,
        costSubtotal: i.costSubtotal,
        profitSubtotal: i.profitSubtotal
      })),
      customer,
      customerName: customerName || "Walk-in Customer",
      cashier,
      totalAmount,
      totalCost,
      grossProfit,
      tax,
      taxRate,
      netAmount,
      paymentMethod,
      notes,
      status: "pending" // Explicitly set to pending
    });

    const createdTxn = transaction;

    // Reserve stock and log
    for (const it of enrichedItems) {
      if (it.hasRecipe) {
        // Reserve Ingredients
        if (it.recipe && it.recipe.length > 0) {
          for (const ingredient of it.recipe) {
             const reserveQty = ingredient.quantity * it.quantity;
             const invItem = await Inventory.findOne({ product: ingredient.ingredient });
             
             if (invItem) {
               invItem.reservedStock = (invItem.reservedStock || 0) + reserveQty;
               await invItem.save();
               
               // Create Reservation Log for Ingredient
               await InventoryLog.create({
                  product: ingredient.ingredient,
                  user: cashier,
                  type: 'adjustment',
                  reason: `Reserved for Pending Transaction: ${createdTxn.transactionId}`,
                  oldQuantity: invItem.stockOnHand,
                  newQuantity: invItem.stockOnHand,
                  quantityChanged: reserveQty,
                  notes: "Stock Reserved"
                });

                // Emit update for ingredient
                const updatedInv = await Inventory.findById(invItem._id).populate("product", "name sku price cost category type unit");
                if (io) io.emit("inventory_updated", updatedInv);
             }
          }
        }
      } else {
        // Reserve Direct Product
        let inventory = await Inventory.findOne({ product: it.product });
        if (inventory) {
          inventory.reservedStock = (inventory.reservedStock || 0) + it.quantity;
          await inventory.save();
        } else {
          // Create if missing
          inventory = await Inventory.create({ product: it.product, stockOnHand: it.currentStock, reservedStock: it.quantity });
        }

        // Create Reservation Log
        await InventoryLog.create({
          product: it.product,
          user: cashier,
          type: 'adjustment',
          reason: `Reserved for Pending Transaction: ${createdTxn.transactionId}`,
          oldQuantity: it.currentStock,
          newQuantity: it.currentStock,
          quantityChanged: it.quantity,
          notes: "Stock Reserved"
        });

        // Emit update for product
        const updatedInv = await Inventory.findById(inventory._id).populate("product", "name sku price cost category type unit");
        if (io) io.emit("inventory_updated", updatedInv);
      }
    }

    // Populate for response
    const populatedTransaction = await Transaction.findById(createdTxn._id)
      .populate("items.product", "name sku")
      .populate("customer", "fullName phone")
      .populate("cashier", "fullName");

    // Real-time event for transaction creation
    if (io) io.emit("transaction_created", populatedTransaction);

    res.status(201).json(populatedTransaction);
  } catch (err) {
    console.error("Transaction Error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", verifyToken, async (req, res) => {
  // Allow Admin and Manager to update transactions
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "You are not allowed to update transactions!" });
  }

  try {
    const { status, ...otherUpdates } = req.body;
    const oldTransaction = await Transaction.findById(req.params.id);
    if (!oldTransaction) return res.status(404).json({ message: "Transaction not found" });

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { returnDocument: 'after', runValidators: true }
    )
    .populate("items.product", "name sku recipe")
    .populate("customer", "fullName phone")
    .populate("cashier", "fullName");
      
    // Handle Inventory transitions if status changed
    if (status && status !== oldTransaction.status) {
      const io = req.app.get("io");
      
      // 1. Pending -> Completed (Finalize Deduction)
      if (oldTransaction.status === "pending" && status === "completed") {
        for (const item of transaction.items) {
          const product = await Product.findById(item.product);
          if (product.recipe && product.recipe.length > 0) {
            for (const ing of product.recipe) {
              const reserveQty = ing.quantity * item.quantity;
              const inv = await Inventory.findOne({ product: ing.ingredient });
              if (inv) {
                const oldQty = inv.stockOnHand;
                inv.stockOnHand -= reserveQty;
                inv.reservedStock = Math.max(0, (inv.reservedStock || 0) - reserveQty);
                await inv.save();
                
                await InventoryLog.create({
                  product: ing.ingredient,
                  user: req.user.id,
                  type: 'sale',
                  reason: `Sale Finalized: ${transaction.transactionId}`,
                  oldQuantity: oldQty,
                  newQuantity: inv.stockOnHand,
                  quantityChanged: -reserveQty
                });
                
                await Product.findByIdAndUpdate(ing.ingredient, { stock: inv.stockOnHand });
                const populatedInv = await Inventory.findById(inv._id).populate("product", "name sku price cost category type unit");
                if (io) io.emit("inventory_updated", populatedInv);
              }
            }
          } else {
            const inv = await Inventory.findOne({ product: item.product });
            if (inv) {
              const oldQty = inv.stockOnHand;
              inv.stockOnHand -= item.quantity;
              inv.reservedStock = Math.max(0, (inv.reservedStock || 0) - item.quantity);
              await inv.save();

              await InventoryLog.create({
                product: item.product,
                user: req.user.id,
                type: 'sale',
                reason: `Sale Finalized: ${transaction.transactionId}`,
                oldQuantity: oldQty,
                newQuantity: inv.stockOnHand,
                quantityChanged: -item.quantity
              });

              const updatedProd = await Product.findByIdAndUpdate(item.product, { stock: inv.stockOnHand }, { new: true });
              if (updatedProd.stock <= 0) {
                updatedProd.status = "out_of_stock";
                await updatedProd.save();
              }
              
              const populatedInv = await Inventory.findById(inv._id).populate("product", "name sku price cost category type unit");
              if (io) {
                io.emit("inventory_updated", populatedInv);
                io.emit("product_updated", updatedProd);
              }
            }
          }
        }
      }
      
      // 2. Pending -> Cancelled (Release Reservation)
      if (oldTransaction.status === "pending" && status === "cancelled") {
        for (const item of transaction.items) {
          const product = await Product.findById(item.product);
          if (product.recipe && product.recipe.length > 0) {
            for (const ing of product.recipe) {
              const reserveQty = ing.quantity * item.quantity;
              const inv = await Inventory.findOne({ product: ing.ingredient });
              if (inv) {
                inv.reservedStock = Math.max(0, (inv.reservedStock || 0) - reserveQty);
                await inv.save();
                
                await InventoryLog.create({
                  product: ing.ingredient,
                  user: req.user.id,
                  type: 'adjustment',
                  reason: `Reservation Released (Cancelled): ${transaction.transactionId}`,
                  oldQuantity: inv.stockOnHand,
                  newQuantity: inv.stockOnHand,
                  quantityChanged: -reserveQty,
                  notes: "Stock Unreserved"
                });
                
                const populatedInv = await Inventory.findById(inv._id).populate("product", "name sku price cost category type unit");
                if (io) io.emit("inventory_updated", populatedInv);
              }
            }
          } else {
            const inv = await Inventory.findOne({ product: item.product });
            if (inv) {
              inv.reservedStock = Math.max(0, (inv.reservedStock || 0) - item.quantity);
              await inv.save();

              await InventoryLog.create({
                product: item.product,
                user: req.user.id,
                type: 'adjustment',
                reason: `Reservation Released (Cancelled): ${transaction.transactionId}`,
                oldQuantity: inv.stockOnHand,
                newQuantity: inv.stockOnHand,
                quantityChanged: -item.quantity,
                notes: "Stock Unreserved"
              });

              const populatedInv = await Inventory.findById(inv._id).populate("product", "name sku price cost category type unit");
              if (io) io.emit("inventory_updated", populatedInv);
            }
          }
        }
      }
    }
    
    // Emit real-time update for transaction
    const io = req.app.get("io");
    if (io) io.emit("transaction_updated", transaction);
    
    res.json(transaction);
  } catch (err) {
    console.error("PATCH Transaction Error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    
    // Emit real-time event
    const io = req.app.get("io");
    if (io) io.emit("transaction_deleted", req.params.id);

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
