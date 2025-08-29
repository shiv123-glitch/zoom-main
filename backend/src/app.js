import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import dotenv from "dotenv";

// Load env variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("port", process.env.PORT || 8000);

// Middleware
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes
app.use("/api/v1/users", userRoutes);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ Backend is running on port " + app.get("port"));
});

// ✅ DB test route
app.get("/db-test", async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({
      message: "✅ MongoDB connected",
      collections: collections.map(c => c.name),
    });
  } catch (err) {
    res.status(500).json({
      error: "❌ DB connection failed",
      details: err.message,
    });
  }
});

// Start function
const start = async () => {
  try {
    const connectionDb = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

    // Start server
    server.listen(app.get("port"), () => {
      console.log("LISTENING ON PORT " + app.get("port"));
    });

    // (Optional) socket connection
    connectToSocket(io);

  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

start();
