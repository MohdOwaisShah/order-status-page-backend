const { Schema, model } = require("mongoose");

const ReportSchema = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  orderId: {
    type: Number,
    required: true,
    minlength: 4,
  },
  issue: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ReportModel = model("reportData", ReportSchema);

module.exports = ReportModel;
