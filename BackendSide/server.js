const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const routes = require("./routes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Export io for routes to use
app.set("io", io);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/users", routes.users);
app.use("/api/products", routes.products);
app.use("/api/categories", routes.categories);
app.use("/api/transactions", routes.transactions);
app.use("/api/customers", routes.customers);
app.use("/api/inventory", routes.inventory);
app.use("/api/settings", routes.settings);
app.use("/api/reports", routes.reports);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const port = Number(process.env.PORT) || 5000;

const start = async () => {
  await connectDB();

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

start().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
