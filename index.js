const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ReportModel = require("./models/report");

dotenv.config();

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- ENV CHECK -------------------- */
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing in environment variables");
  process.exit(1);
}

/* -------------------- MONGODB CONNECTION -------------------- */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    setTimeout(connectDB, 5000); // retry after 5s
  }
};

connectDB();

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
  res.send("🚀 Backend is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mongoState: mongoose.connection.readyState,
  });
});

/* -------------------- ADD REPORT -------------------- */
app.post("/add", async (req, res) => {
  try {
    console.log("📥 Incoming Body:", JSON.stringify(req.body, null, 2));

    // support both: { form_data: {...} } and direct body
    const data = req.body.form_data || req.body;

    const { fullName, orderId, issue, reportProblem } = data;

    if (!fullName || !orderId || !issue) {
      return res.status(400).json({
        message: "Missing required fields",
        received: data,
      });
    }

    const savedData = await ReportModel.create({
      fullName,
      orderId,
      issue,
      reportProblem,
    });

    console.log("✅ Data saved:", savedData);

    res.status(201).json({
      message: "Data saved successfully",
      data: savedData,
    });
  } catch (error) {
    console.error("❌ Error saving data:", error);

    res.status(500).json({
      message: "Error saving data",
      error: {
        name: error.name,
        message: error.message,
        details: error.errors
          ? Object.keys(error.errors).reduce((acc, key) => {
              acc[key] = error.errors[key].message;
              return acc;
            }, {})
          : undefined,
      },
    });
  }
});

/* -------------------- SERVER START -------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});

/* -------------------- GLOBAL ERROR HANDLING -------------------- */
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
