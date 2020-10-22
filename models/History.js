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
    required: [true, "please this field is required"],
    trim: true,
    unique: true,
  },
  usedSerial_Prouct_Name: {
    type: String,
    required: [true, "please this field is required"],
    trim: true,
    unique: true,
  },
});

module.exports = mongoose.model("History", Historyschema);
