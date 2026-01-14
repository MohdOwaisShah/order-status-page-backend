// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ReportModel = require("./models/report");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not set. Set it in Render environment variables.");
  process.exit(1);
}

async function connectWithRetry(retries = 6, delayMs = 5000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`🔌 Mongo attempt ${i} - connecting...`);
      // IMPORTANT: Do NOT pass useNewUrlParser/useUnifiedTopology here
      await mongoose.connect(MONGO_URI);
      console.log("✅ MongoDB connected");
      return;
    } catch (err) {
      console.error(`❌ Mongo connect attempt ${i} failed:`, err.message || err);
      if (i < retries) {
        console.log(`⏳ Retrying in ${delayMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.error("❌ All Mongo connection attempts failed.");
        throw err;
      }
    }
  }
}

/* Health / root */
app.get("/", (_req, res) => res.send("🚀 Backend running"));
app.get("/health", (_req, res) => res.json({ mongoState: mongoose.connection.readyState }));

/* POST /add */
app.post("/add", async (req, res) => {
  try {
    console.log("📥 Raw body:", JSON.stringify(req.body));
    const payload = req.body.form_data || req.body || {};
    const { fullName, orderId, issue, reportProblem } = payload;
    if (!fullName || !orderId || !issue) {
      return res.status(400).json({ message: "Missing fields fullName/orderId/issue", received: payload });
    }
    if (mongoose.connection.readyState !== 1) {
      console.warn("⚠️ DB not connected (state=" + mongoose.connection.readyState + ")");
      return res.status(503).json({ message: "DB not connected, try later", mongoState: mongoose.connection.readyState });
    }
    const saved = await ReportModel.create({ fullName, orderId, issue, reportProblem });
    console.log("✅ Saved:", saved);
    res.status(201).json({ message: "Data saved", data: saved });
  } catch (err) {
    console.error("❌ Error saving data:", err);
    res.status(500).json({
      message: "Error saving data",
      error: { name: err.name, message: err.message, details: err.errors ? Object.keys(err.errors).reduce((a,k)=>{ a[k]=err.errors[k].message; return a; }, {}) : undefined }
    });
  }
});

/* Start only after DB connects */
const PORT = process.env.PORT || 3000;
(async () => {
  try {
    await connectWithRetry(6, 5000);
    const server = app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

    const graceful = async (sig) => {
      console.log(`\n🛑 Received ${sig} - shutting down`);
      server.close(async () => {
        await mongoose.disconnect();
        console.log("Mongo disconnected. Exiting.");
        process.exit(0);
      });
    };
    process.on("SIGINT", () => graceful("SIGINT"));
    process.on("SIGTERM", () => graceful("SIGTERM"));
    process.on("unhandledRejection", (r) => console.error("UnhandledRejection:", r));
    process.on("uncaughtException", (e) => console.error("UncaughtException:", e));
  } catch (err) {
    console.error("🔥 Failed to start app - DB connection failed:", err);
    process.exit(1);
  }
})();
