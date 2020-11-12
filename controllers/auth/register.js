const User = require("../models/User");
import { hashPassword } from '../../services';

const register = (req, res, next) =>
{
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const phone = req.body.phone;
  const password = req.body.password;
    try {
  if (await User.findOne({ phone })) {
    req.flash(
      "alert alert-danger",
      "Phone Number is already registered, Please login"
    );
    res.redirect("/");
    return;
  }
    const user = new User({
      firstName,
      lastName,
      phone,
      password,
    });

    user.password = await hashPassword(user.password);
    await user.save();
    req.flash("success", "Registration is successfull, Please Login");
    res.redirect("/");
    } catch (error) {
// TODO: handle this error better
      req.flash("error", "Error occured")
    }
}

export {register}