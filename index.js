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
mongoose.connect(process.env.MONGO_URI);

app.get("/get", (req, res) => {
  ReportModel.find()
    .then((data) => {
      res.status(200).json({ message: "Data fetched successfully", data: data });
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      res.status(500).json({ message: "Error fetching data", error: err });
    });
});

app.get("/", (req, res) => {
  res.send("this is home page");
});

app.post("/add", (req, res) => {
  const { fullName, orderId, issue, reportProblem } = req.body.form_data;

  // Log the data first
  console.log("data from backend:", {
    fullName,
    orderId,
    issue,
    reportProblem,
  });

  // Only send ONE response - either from then/catch OR from the main handler
  ReportModel.create({ fullName, orderId, issue })
    .then((result) => {
      console.log("Data saved successfully:", result);
      res
        .status(200)
        .json({ message: "Data saved successfully", data: result });
    })
    .catch((err) => {
      console.error("Error saving data:", err);
      res.status(500).json({ message: "Error saving data", error: err });
    });
});

app.listen(3000, () => {
  console.log("server started on port", 3000);
});
