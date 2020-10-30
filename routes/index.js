const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { isAuthenticated } = require("../config/auth");
const data = require("../data");
const History = require("../models/History");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/register", function (req, res, next) {
  res.render("signup");
});

router.get("/product-verify", isAuthenticated, function (req, res, next) {
  res.render("product-verify");
});

router.get("/remark_box", isAuthenticated, function (req, res, next) {
  res.render("remark_box");
});

router.get("/false_remark", isAuthenticated, function (req, res, next) {
  res.render("false_remark");
});

router.post("/verify-product", isAuthenticated, async function (
  req,
  res,
  next
) {
  const codeNumber = req.body.codeNumber;

  let verifyProduct = data.products.find((x) => x.code == codeNumber);

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
      code: verifyProduct.code,
      usedSerial_Prouct_Name: verifyProduct.product,
      point: verifyProduct.point,
    });

    // Point calculator
    // user point
    let userPoint = req.user.points;

    // product point
    let productpoint = verifyProduct.point;

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
        verifyProduct.code
      }`,
      point: verifyProduct.point,
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
        "Username & Password combination doesn't match any of our records, Kindly register!!!"
      );
      return res.redirect("/register");
    }

    req.logIn(user, function (err) {
      if (err) {
        return next(err);
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
      "email is already registered, Please login"
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

router.get("/history", isAuthenticated, async function (req, res, next) {
  const histories = await History.find({ user: req.user });
  res.render("history", { histories });
});

router.get("/logout", function (req, res, next) {
  req.logout();
  req.flash("alert alert-success", "You've successfully logged out");
  res.redirect("/");
});

module.exports = router;
