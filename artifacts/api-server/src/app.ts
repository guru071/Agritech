import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/agrihub";

async function connectWithRetry() {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
      logger.info({ uri: MONGODB_URI.replace(/\/\/.*@/, "//***@") }, "MongoDB connected");
      return;
    } catch (err) {
      const delay = Math.min(5000 * attempt, 30000);
      logger.warn({ attempt, nextRetryMs: delay }, "MongoDB connection failed — retrying");
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

connectWithRetry();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Token"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const uploadsDir = path.join(__dirname, "..", "public", "uploads");
app.use("/uploads", express.static(uploadsDir));

app.use("/api", router);

export default app;
