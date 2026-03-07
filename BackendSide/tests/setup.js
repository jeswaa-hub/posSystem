const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const routes = require("../routes");
const { Server } = require("socket.io");
const http = require("http");

let mongoServer;
let app;
let server;
let io;

const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  server = http.createServer(app);
  io = new Server(server);
  
  app.set("io", io); // Mock socket.io
  app.use(cors());
  app.use(express.json());
  
  // Register routes
  app.use("/api/users", routes.users);
  app.use("/api/products", routes.products);
  app.use("/api/categories", routes.categories);
  app.use("/api/transactions", routes.transactions);
  app.use("/api/customers", routes.customers);
  app.use("/api/inventory", routes.inventory);
  app.use("/api/settings", routes.settings);
  app.use("/api/reports", routes.reports);

  return app;
};

const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
  if (io) io.close();
  if (server) server.close();
};

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};

expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be in [${expected}]`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be in [${expected}]`,
        pass: false,
      };
    }
  },
});

module.exports = { connect, closeDatabase, clearDatabase };
