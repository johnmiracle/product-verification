const User = require("../models/User");

module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    } else {
      req.flash("danger", "Please login to view this page");
      res.redirect("/");
    }
  },

  isAdmin: (req, res, next) => {
    let adminCheck = req.user.account === "admin";
    if (req.isAuthenticated() && adminCheck) {
      return next();
    } else {
      req.flash("danger", "You are not authorized to view this page");
      res.redirect("/product-verify");
    }
  },

  isUser: (req, res, next) => {
    let userCheck = req.user.account === "user";
    if (req.isAuthenticated() && userCheck) {
      return next();
    } else {
      req.flash("danger", "You are not authorized to view this page");
      res.redirect("/admin-dashboard");
    }
  },
};
