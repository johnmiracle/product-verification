const mongoose = require("mongoose");

const Historyschema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  Date: {
    type: Date,
    default: Date.now,
  },
  usedSerial: {
    type: Number,
  },
  batch: {
    type: Number,
  },
  usedSerial_Prouct_Name: {
    type: String,
    required: [true, "please this field is required"],
    trim: true,
  },
  code: {
    type: Number,
    unique: true,
  },
  point: {
    type: Number,
  },
});

module.exports = mongoose.model("History", Historyschema);
