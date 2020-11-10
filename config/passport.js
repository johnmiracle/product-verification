const User = require("../models/User");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { Strategy } = require("passport-twitter");

module.exports = (passport) => {
  passport.use(
    new localStrategy(
      {
        usernameField: "phone",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, phone, password, done) => {
        const user = await User.findOne({ phone });

        if (!user) {
          return done(null, false, {
            message: "This phone number is not registered",
          });
        }

        if (bcrypt.compareSync(password, user.password)) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: "The password doesn't match the one on our records",
          });
        }
      }
    )
  );

  // passport.use(
  //   new Strategy(
  //     {
  //       consumerKey: process.env.TWITTER_CONSUMER_KEY,
  //       consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  //       callbackURL: "/return",
  //     },
  //     (accessToken, refreshToken, profile, cb) => {
  //       return cb(null, profile);
  //     }
  //   )
  // );

  // passport.use(
  //   new Strategy(
  //     {
  //       clientID: process.env.GOOGLE_CLIENT_ID,
  //       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  //       callbackURL: "/return",
  //     },
  //     (accessToken, refreshToken, profile, cb) => {
  //       return cb(null, profile);
  //     }
  //   )
  // );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
};

// passport.serializeUser((user, cb) => {
//   cb(null, user);
// });

// passport.deserializeUser((obj, cb) => {
//   cb(null, obj);
// });
