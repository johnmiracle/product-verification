const mongoose = require("mongoose");

const Productschema = new mongoose.Schema({
  product: {
    type: String,
    required: [true, "Please this field is required"],
    trim: true,
  },
  serial: {
    type: String,
    required: [true, "please this field is required"],
  },
  batch_no: {
    type: String,
    required: [true, "please this field is required"],
  },
  pin_code: {
    type: String,
    required: [true, "please this field is required"],
    unique: true,
  },
  QRcode: {
    type: String,
  },
  points: {
    type: Number,
  },
});

module.exports = mongoose.model("Product", Productschema);
