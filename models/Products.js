const mongoose = require("mongoose");

const Productschema = new mongoose.Schema({
  product: {
    type: String,
    required: [true, "Please this field is required"],
    trim: true,
  },
  serial: {
    type: Number,
    required: [true, "please this field is required"],
  },
  code: {
    type: Number,
    required: [true, "please this field is required"],
    unique: true,
  },
  points: {
    type: Number,
  },
});

module.exports = mongoose.model("Product", Productschema);
