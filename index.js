const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ReportModel = require("./models/report");

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ IMPORTANT: Ensure MONGO_URI exists (Render issue fix)
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing in environment variables");
  process.exit(1);
}

// ✅ IMPORTANT: Proper MongoDB connection with logs
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

app.get("/get", (req, res) => {
  res.send("hello world");
});

app.post("/add", (req, res) => {
  const { fullName, orderId, issue, reportProblem } = req.body.form_data;

  console.log("data from backend:", {
    fullName,
    orderId,
    issue,
    reportProblem,
  });

  ReportModel.create({ fullName, orderId, issue })
    .then((result) => {
      console.log("Data saved successfully:", result);
      res.status(200).json({
        message: "Data saved successfully",
        data: result,
      });
    })
    .catch((err) => {
      console.error("Error saving data:", err);
      res.status(500).json({
        message: "Error saving data",
        error: err,
      });
    });
});

// ✅ IMPORTANT: Render uses dynamic PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
