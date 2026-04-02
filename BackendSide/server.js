const dotenv = require("dotenv");
dotenv.config(); // Load env vars first

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const routes = require("./routes");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// 1. CORS MUST be the very first middleware to handle preflight requests
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"], 
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. Security Headers (configured to allow cross-origin)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 4. Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Data Sanitization against NoSQL Injection
// app.use(mongoSanitize());

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], 
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// Export io for routes to use
app.set("io", io);

// Routes
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
