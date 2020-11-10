const express = require("express");
const router = express.Router();
const Product = require("../models/Products");
const qrcode = require("qrcode");

router.get("/serial_code_generator", function (req, res, next) {
  res.render("serial_code_generator");
});

router.post("/code-generate", async function (req, res, next) {
  const product = req.body.productName;
  const serial = req.body.serial;
  const batch_no = req.body.batch;
  const pin_code = req.body.code;

  const points = req.body.point;

  let temp = [];

  temp.push(product, serial, batch_no, pin_code);

  const url = await qrcode.toDataURL(temp, { errorCorrectionLevel: "H" });

  console.log(url);

  const productCode = new Product({
    product,
    serial,
    batch_no,
    pin_code,
    QRcode: url,
    points,
  });
  productCode.save();
  
});

module.exports = router;
