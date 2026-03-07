const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Transaction, Product, Inventory, InventoryLog, Settings } = require("../models");

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

router.get("/dashboard", async (req, res) => {
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

router.get("/", async (_req, res) => {
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

router.post("/", async (req, res) => {
  try {
    const { items, customer, customerName, paymentMethod, notes, cashier } = req.body;

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
          const neededQty = ingredient.quantity * it.quantity;
          
          if (currentQty < neededQty) {
             const ingProd = await Product.findById(ingredient.ingredient);
             throw new Error(`Insufficient stock for ingredient: ${ingProd ? ingProd.name : 'Unknown'} (Needed: ${neededQty}, Available: ${currentQty})`);
          }
        }
        // Stock for the main product is virtual or just tracking sales count, so we don't strictly block if its own count is 0,
        // unless we want to track prepared items. For now, let's assume made-to-order, so stock check is on ingredients.
        stockAvailable = 9999; // Virtual infinite stock if ingredients are enough
      } else {
        // Direct stock check
        let inventory = await Inventory.findOne({ product: it.product });
        
        // Prioritize Inventory record if it exists, but if it's 0, check if Product has stock
        // This handles cases where Inventory was created with 0 but Product was updated separately
        if (inventory) {
           stockAvailable = inventory.stockOnHand;
           
           // Desync fix: If Inventory says 0 but Product says > 0, trust Product and sync Inventory
           if (stockAvailable === 0 && product.stock > 0) {
              console.log(`Stock Desync detected for ${product.name}. Syncing Inventory from Product...`);
              stockAvailable = product.stock;
              // We will update inventory later during deduction
           }
        } else {
           // Fallback if no inventory record exists
           stockAvailable = product.stock || 0;
        }

        // Debug log
        console.log(`Checking stock for ${product.name}: Available=${stockAvailable}, Requested=${it.quantity}`);

        if (stockAvailable < it.quantity) throw new Error(`Insufficient stock for ${product.name} (Available: ${stockAvailable})`);
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

    // Deduct stock and log
    for (const it of enrichedItems) {
      if (it.hasRecipe) {
        // Deduct Ingredients
        for (const ingredient of it.recipe) {
           const deductQty = ingredient.quantity * it.quantity;
           const invItem = await Inventory.findOne({ product: ingredient.ingredient });
           
           if (invItem) {
             const oldQty = invItem.stockOnHand;
             const newQty = oldQty - deductQty;
             invItem.stockOnHand = newQty;
             await invItem.save();
             
             // Create Log for Ingredient
             await InventoryLog.create({
                product: ingredient.ingredient,
                user: cashier,
                type: 'sale',
                reason: `Sale: ${createdTxn.transactionId} (Used in ${it.quantity}x Product ${it.product})`,
                oldQuantity: oldQty,
                newQuantity: newQty,
                quantityChanged: -deductQty,
              });

              // Sync Product stock for ingredient
              await Product.findByIdAndUpdate(ingredient.ingredient, { stock: newQty });
           }
        }
      } else {
        // Deduct Direct Product
        const newStock = it.currentStock - it.quantity;
        
        // Update Inventory
        let inventory = await Inventory.findOne({ product: it.product });
        if (inventory) {
          inventory.stockOnHand = newStock;
          await inventory.save();
        } else {
          // Create if missing (should not happen if initialized properly, but for safety)
          await Inventory.create({ product: it.product, stockOnHand: newStock });
        }

        // Update Product (Legacy sync)
        const updatedProduct = await Product.findByIdAndUpdate(
          it.product, 
          { stock: newStock }, 
          { returnDocument: 'after' }
        );

        if (updatedProduct) {
          if (updatedProduct.stock <= 0 && updatedProduct.status !== "out_of_stock") {
            updatedProduct.status = "out_of_stock";
            await updatedProduct.save();
          }
        }

        // Create Inventory Log
        await InventoryLog.create({
          product: it.product,
          user: cashier,
          type: 'sale',
          reason: `Sale: ${createdTxn.transactionId}`,
          oldQuantity: it.currentStock,
          newQuantity: newStock,
          quantityChanged: -it.quantity,
        });
      }
    }

    // Populate for response
    const populatedTransaction = await Transaction.findById(createdTxn._id)
      .populate("items.product", "name sku")
      .populate("customer", "fullName phone")
      .populate("cashier", "fullName");

    // Real-time events
    const io = req.app.get("io");
    if (io) {
      io.emit("transaction_created", populatedTransaction);
      // Emit updates
      enrichedItems.forEach(async (it) => {
         if (it.hasRecipe) {
           it.recipe.forEach(async (ing) => {
              const p = await Product.findById(ing.ingredient);
              const inv = await Inventory.findOne({ product: ing.ingredient });
              if (p && inv) {
                io.emit("product_updated", p);
                io.emit("inventory_updated", { productId: ing.ingredient, newStock: inv.stockOnHand });
              }
           });
         } else {
            const p = await Product.findById(it.product);
            io.emit("product_updated", p);
            io.emit("inventory_updated", { productId: it.product, newStock: it.currentStock - it.quantity });
         }
      });
    }

    res.status(201).json(populatedTransaction);
  } catch (err) {
    console.error("Transaction Error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true })
      .populate("items.product", "name sku")
      .populate("customer", "fullName phone")
      .populate("cashier", "fullName");
      
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    
    // Emit real-time update
    const io = req.app.get("io");
    if (io) io.emit("transaction_updated", transaction);
    
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
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
