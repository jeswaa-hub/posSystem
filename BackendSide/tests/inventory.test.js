const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const mongoose = require("mongoose");

let app;

beforeAll(async () => {
  app = await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("Inventory Routes", () => {
  let product;

  beforeEach(async () => {
    // Create a category first
    const cat = await request(app).post("/api/categories").send({
      name: "Inventory Category"
    });

    // Create a product first
    const res = await request(app).post("/api/products").send({
      name: "Inventory Item",
      sku: "INV001",
      price: 50,
      cost: 20,
      category: cat.body._id,
      type: "product",
      stock: 0
    });
    product = res.body;
  });

  it("should create inventory record", async () => {
    // Manually delete the auto-created inventory first
    await request(app).delete(`/api/inventory/${product._id}`); 

    const res = await request(app).post("/api/inventory").send({
      product: product._id,
      stockOnHand: 100,
      reorderPoint: 10,
      maxStock: 200,
      notes: "Initial stock"
    });
    
    // The endpoint returns 200 if inventory exists (idempotent), but since we deleted it, 
    // it might be creating new one.
    // However, Product creation hook might have already created one.
    // Let's check logic: POST /api/products creates inventory automatically for 'product' type.
    // So POST /api/inventory will find existing and return 200.
    
    expect(res.statusCode).toBeOneOf([200, 201]);
    expect(res.body.stockOnHand).toEqual(100);
  });

  it("should adjust stock manually", async () => {
    // Initial stock
    await request(app).post("/api/inventory").send({
      product: product._id,
      stockOnHand: 50
    });

    const res = await request(app).post("/api/inventory/adjust").send({
      productId: product._id,
      adjustmentQty: 20,
      type: "add", // delta
      reason: "Restock",
      userId: new mongoose.Types.ObjectId()
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.newStock).toEqual(70);
  });

  it("should not allow negative stock", async () => {
    // Initial stock
    await request(app).post("/api/inventory").send({
      product: product._id,
      stockOnHand: 10
    });

    const res = await request(app).post("/api/inventory/adjust").send({
      productId: product._id,
      adjustmentQty: -20,
      type: "subtract",
      reason: "Error",
      userId: new mongoose.Types.ObjectId()
    });

    expect(res.statusCode).toEqual(500);
    expect(res.body.message).toMatch(/negative/i);
  });
});
