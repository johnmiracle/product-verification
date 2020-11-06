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

  console.log(`Total number of registered users = ` + registeredUsers);
  console.log(`Total number of registered products = ` + products);
  console.log(`Total number of used pin = ` + usedPin);
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

router.get("/serial_code_generator", isAuthenticated, isAdmin, function (
  req,
  res,
  next
) {
  res.render("serial_code_generator");
});

router.post("/code-generate", isAuthenticated, isAdmin, async function (
  req,
  res,
  next
) {
  const product = req.body.productName;
  const serial = req.body.serial;
  const batch_no = req.body.batch;
  const pin_code = req.body.code;

  const points = req.body.point;

  let temp = [];

  temp.push(product, serial, batch_no, pin_code);

  const url = await qrcode.toDataURL(temp, { errorCorrectionLevel: "H" });

  const productCode = new Product({
    product,
    serial,
    batch_no,
    pin_code,
    QRcode: url,
    points,
  });
  productCode
    .save()
    .then(() => {
      req.flash("alert alert-success", "Product Added Successfully!!!");
      res.redirect("serial_code_generator");
    })
    .catch((err) => {
      req.flash("alert alert-danger", "Error Adding Product!!!");
      console.log(err);
      res.render("serial_code_generator");
    });
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

module.exports = router;
