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

describe("Transaction Routes", () => {
  let product;
  let customer;
  let cashier;

  beforeEach(async () => {
    // Create category
    const cat = await request(app).post("/api/categories").send({
      name: "Sale Category"
    });

    // Create product
    const prodRes = await request(app).post("/api/products").send({
      name: "Sale Product",
      sku: "SALE001",
      price: 100,
      cost: 50,
      category: cat.body._id,
      type: "product"
    });
    product = prodRes.body;

    // Set inventory
    await request(app).post("/api/inventory").send({
      product: product._id,
      stockOnHand: 100
    });

    // Create customer
    const custRes = await request(app).post("/api/customers").send({
      fullName: "John Doe",
      email: "john@example.com",
      phone: "1234567890"
    });
    customer = custRes.body;

    // Create cashier (user)
    const userRes = await request(app).post("/api/users/register").send({
      fullName: "Cashier One",
      email: "cashier@example.com",
      password: "password123",
      role: "cashier",
      permissions: ["pos"]
    });
    cashier = userRes.body;
  });

  it("should create a transaction successfully", async () => {
    const res = await request(app).post("/api/transactions").send({
      items: [
        { product: product._id, quantity: 2 }
      ],
      customer: customer._id,
      cashier: cashier._id,
      paymentMethod: "cash",
      notes: "Test Sale"
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body.totalAmount).toEqual(200);
    expect(res.body.status).toEqual("pending"); // Default set in code
  });

  it("should reject transaction if insufficient stock", async () => {
    const res = await request(app).post("/api/transactions").send({
      items: [
        { product: product._id, quantity: 200 } // Exceeds 100 stock
      ],
      cashier: cashier._id,
      paymentMethod: "cash"
    });

    expect(res.statusCode).toEqual(500); // Backend throws error
    expect(res.body.message).toMatch(/Insufficient stock/i);
  });
});
