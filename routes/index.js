const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { isAuthenticated, isAdmin, isUser } = require("../config/auth");
const data = require("../data");
const History = require("../models/History");
const Product = require("../models/Products");
const qrcode = require("qrcode");
const Json2csvParser = require("json2csv").Parser;
const fs = require("fs");
const path = require("path");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});

// Twitter
router.get("/login/twitter", passport.authenticate("twitter"));

router.get(
  "/return",
  passport.authenticate("twitter", { failureRedirect: "/" }),
  (req, res, next) => {
    res.redirect("/");
  }
);

// Google
router.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile"] })
);

router.get(
  "/return",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res, next) => {
    res.redirect("/");
  }
);

router.get("/register", function (req, res, next) {
  res.render("signup");
});

router.get("/product-verify", isAuthenticated, isUser, async function (
  req,
  res,
  next
) {
  const scanCount = await History.countDocuments({ user: req.user });
  res.render("product-verify", { scanCount });
});

router.get("/remark_box", isAuthenticated, isUser, function (req, res, next) {
  res.render("remark_box");
});

router.get("/false_remark", isAuthenticated, isUser, function (req, res, next) {
  res.render("false_remark");
});

router.post("/verify-product", isAuthenticated, isUser, async function (
  req,
  res,
  next
) {
  const codeNumber = req.body.codeNumber;

  let verifyProduct = await Product.findOne({ pin_code: codeNumber });

  let historyResult = await History.findOne({ code: codeNumber });

  if (!verifyProduct) {
    res.render("false_remark", {
      msg: "Your Product is Fake, Kindly make a report",
    });
  }
  if (verifyProduct && historyResult) {
    res.render("false_remark", {
      msg: "Your Product key has been used, Kindly make a report",
    });
  } else {
    const newHistory = new History({
      user: req.user,
      Date: new Date(),
      usedSerial: verifyProduct.serial,
      code: verifyProduct.pin_code,
      usedSerial_Prouct_Name: verifyProduct.product,
      point: verifyProduct.points,
    });

    // Point calculator

    // user point
    let userPoint = req.user.points;

    // product point
    let productpoint = verifyProduct.points;

    // sum of prouct point and userpoint
    let updatedPoint = userPoint + productpoint;

    // Update User Point
    await User.updateOne({ _id: req.user }, { $set: { points: updatedPoint } });

    // Save New History
    await newHistory.save();

    res.render("remark_box", {
      msg: `${
        "Your Product " +
        verifyProduct.product +
        " is Authentic with serial number " +
        verifyProduct.serial +
        " and product code " +
        verifyProduct.pin_code
      }`,
      point: verifyProduct.points,
    });
  }
});

router.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash(
        "alert alert-danger",
        "User ID & Password combination doesn't match any of our records, Kindly register!!!"
      );
      return res.redirect("/register");
    }

    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      } else if (user.account === "admin") {
        return res.redirect("/admin-dashboard");
      } else {
        return res.redirect("/product-verify");
      }
    });
  })(req, res, next);
});

router.post("/register", async function (req, res, next) {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const phone = req.body.phone;
  const password = req.body.password;

  let user = await User.findOne({ phone: req.body.phone });
  if (user) {
    req.flash(
      "alert alert-danger",
      "Phone Number is already registered, Please login"
    );
    res.redirect("/");
  } else {
    const user = new User({
      firstName,
      lastName,
      phone,
      password,
    });
    bcrypt.hash(user.password, 10, (err, hash) => {
      user.password = hash;
      user.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          req.flash("success", "Registration is successfull, Please Login");
          res.redirect("/");
        }
      });
    });
  }
});

router.get("/history", isAuthenticated, isUser, async function (
  req,
  res,
  next
) {
  const histories = await History.find({ user: req.user });
  res.render("history", { histories });
});

router.get("/logout", function (req, res, next) {
  req.logout();
  req.flash("alert alert-success", "You've successfully logged out");
  res.redirect("/");
});

router.get("/admin-dashboard", isAuthenticated, isAdmin, async function (
  req,
  res,
  next
) {
  const registeredUsers = await User.countDocuments({ account: "user" });
  const products = await Product.countDocuments({});
  const usedPin = await History.countDocuments({});
  res.render("admin-dashboard-home", { registeredUsers, products, usedPin });
});

router.get("/products", isAuthenticated, isAdmin, async function (
  req,
  res,
  next
) {
  const results = await Product.find({});
  res.render("products", { results });
});

router.get("/serial_code_generator", function (req, res, next) {
  res.render("serial_code_generator");
});

// router.post("/code-generate", isAuthenticated, isAdmin, async function (
//   req,
//   res,
//   next
// ) {
//   const product = req.body.productName;
//   const serial = req.body.serial;
//   const batch_no = req.body.batch;
//   const pin_code = req.body.code;

//   const points = req.body.point;

//   let temp = [];

//   temp.push(product, serial, batch_no, pin_code);

//   const url = await qrcode.toDataURL(temp, { errorCorrectionLevel: "H" });

//   const productCode = new Product({
//     product,
//     serial,
//     batch_no,
//     pin_code,
//     QRcode: url,
//     points,
//   });
//   productCode
//     .save()
//     .then(() => {
//       req.flash("alert alert-success", "Product Added Successfully!!!");
//       res.redirect("serial_code_generator");
//     })
//     .catch((err) => {
//       req.flash("alert alert-danger", "Error Adding Product!!!");
//       console.log(err);
//       res.render("serial_code_generator");
//     });
// });

router.post("/code-generate", async function (req, res, next) {
  const product = req.body.productName;
  const serial = req.body.serial;
  const batch_no = req.body.batch;
  const points = req.body.point;

  let max = 10000;
  let min = 1000;

  const array_length = 2;

  for (let i = 0; i < array_length; i++) {
    // create the unique number
    const uniquePin = Math.floor(Math.random() * (max - min + 1));

    // create the QRcode for each generated code
    let temp = [product, serial, batch_no, uniquePin];

    generateQR();
    let url = await new qrcode.toDataURL(
      { temp },
      { errorCorrectionLevel: "H" }
    );

    const productCode = new Product({
      product,
      serial,
      batch_no,
      pin_code: uniquePin,
      QRcode: url,
      points,
    });
    // save each iteration to database
    productCode.save();
  }

  try {
    req.flash("alert alert-success", "Product Added Successfully!!!");
    res.redirect("serial_code_generator");
  } catch (err) {
    req.flash("alert alert-danger", "Error Adding Product!!!");
    console.log(err);
    res.render("serial_code_generator");
  }
});

router.get("/users", isAuthenticated, isAdmin, async function (req, res, next) {
  const users = await User.find({});
  res.render("users", { users });
});

router.get("/users/:id", isAuthenticated, isAdmin, async function (
  req,
  res,
  next
) {
  const users = await User.find({});
  res.render("user", { users });
});

router.get("/export", isAuthenticated, isAdmin, async function (
  req,
  res,
  next
) {
  // Get the Data from the Database
  const data = await Product.find({});

  const json2csv = require("json2csv").parse;

  //For unique file name
  const dateTime = new Date()
    .toISOString()
    .slice(-24)
    .replace(/\D/g, "")
    .slice(0, 14);

  const filePath = path.join(
    __dirname,
    "../",
    "public",
    "Products-" + dateTime + ".csv"
  );

  let csv;

  const fields = [
    "product",
    "serial",
    "batch_no",
    "pin_code",
    "QRcode",
    "points",
  ];

  try {
    csv = json2csv(data, { fields });
  } catch (err) {
    return res.status(500).json({ err });
  }

  fs.writeFile(filePath, csv, function (err) {
    if (err) {
      return res.json(err).status(500);
    } else {
      setTimeout(function () {
        fs.unlink(filePath, function (err) {
          // delete this file after 30 seconds
          if (err) {
            console.log(err);
          }
          console.log("File has been Deleted");
        });
      }, 30000);
      res.download(filePath);
    }
  });
  // res.render("user", { users });
});

router.get("/used-products", isAuthenticated, isAdmin, async function (
  req,
  res,
  next
) {
  const datas = await History.find({});
  try {
    res.render("", { datas });
  } catch (err) {}
});

module.exports = router;
