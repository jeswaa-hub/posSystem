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

describe("Product Routes", () => {
  it("should create a new product", async () => {
    // Create a category first
    const cat = await request(app).post("/api/categories").send({
      name: "Test Category"
    });

    const res = await request(app)
      .post("/api/products")
      .send({
        name: "Test Product",
        sku: "TP001",
        price: 100,
        cost: 50,
        category: cat.body._id, 
        type: "product",
        stock: 10
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual("Test Product");
  });

  it("should fetch all products", async () => {
    const cat = await request(app).post("/api/categories").send({ name: "Cat1" });
    await request(app).post("/api/products").send({
      name: "Product 1",
      sku: "P001",
      price: 50,
      cost: 20,
      category: cat.body._id,
      type: "product"
    });

    const res = await request(app).get("/api/products");
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should fetch a single product", async () => {
    const cat = await request(app).post("/api/categories").send({ name: "Cat2" });
    const product = await request(app).post("/api/products").send({
      name: "Single Product",
      sku: "SP001",
      price: 150,
      cost: 80,
      category: cat.body._id,
      type: "product"
    });

    const res = await request(app).get(`/api/products/${product.body._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toEqual("Single Product");
  });

  it("should update a product", async () => {
    const cat = await request(app).post("/api/categories").send({ name: "Cat3" });
    const product = await request(app).post("/api/products").send({
      name: "Old Name",
      sku: "ON001",
      price: 100,
      cost: 50,
      category: cat.body._id,
      type: "product"
    });

    const res = await request(app).patch(`/api/products/${product.body._id}`).send({
      name: "New Name"
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toEqual("New Name");
  });

  it("should delete (deactivate) a product", async () => {
    const cat = await request(app).post("/api/categories").send({ name: "Cat4" });
    const product = await request(app).post("/api/products").send({
      name: "To Delete",
      sku: "TD001",
      price: 100,
      cost: 50,
      category: cat.body._id,
      type: "product"
    });

    const res = await request(app).delete(`/api/products/${product.body._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual("Product deactivated");

    const check = await request(app).get(`/api/products/${product.body._id}`);
    expect(check.statusCode).toEqual(404);
  });
});
