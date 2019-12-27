var express = require('express');
var router = express.Router();
var User  = require('../models/User');
let passport = require('passport');
let jwt = require('express-jwt');
let zxcvbn = require("zxcvbn");
let validator = require('email-validator');

let auth = jwt({ secret: process.env.WAFELBAK_BACKEND_SECRET });

/* GET users listing. */
router.get("/", function(req, res, next) {
  let query = User.findAll({order: ['email']}); //TODO -salt -hash
  query.exec(function(err, users) {
    if (err) return next(err);
    res.json(users);
  });
});

/* GET user by id. */
router.param("userId", function(req, res, next, id) {
  let query = User.findByPK(id); //TODO -salt -hash
  query.exec(function(err, user) {
    if (err) return next(err);
    if (!user) return next(new Error("not found " + id));
    req.receivedUser = user;
    return next();
  });
});
router.get("/id/:userId", function(req, res, next) {
  res.json(req.receivedUser);
});

/* GET user by email. */
router.param("email", function(req, res, next, email) {
  let query = User.findOne({where: {email: email} }); //TODO -salt -hash
  query.exec(function(err, user) {
    if (err) return next(err);
    if (!user) return next(new Error("No user found with email '" + email + "'."));
    req.receivedUser = user;
    return next();
  });
});
router.get("/:email", function(req, res, next) {
  res.json(req.receivedUser);
});

/* REGISTER / LOGIN functionality */
router.post("/isValidEmail", function(req, res, next) {
  // Check if all fields are filled in
  if (!req.body.email)
    return res.status(400).json("Please fill out all fields.");

  if (req.body.oldEmail)
    if (req.body.email === req.body.oldEmail)
      res.send(true);
    else
      User.findOne({where: {email: req.body.email.trim().toLowerCase() }}, function(err, result) {
        if (result.length)
          res.send(false);
        else
          res.send(validator.validate(req.body.email.trim().toLowerCase()));
      });
});

router.post("/register", function(req, res, next) {
  // Check if all required fields are filled in
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.password ||
    !req.body.birthday ||
    !req.body.street   ||           // TODO moet dit address.street, /streetNumber en /postalcode /city?
    !req.body.streetNumber  ||
    !req.body.streetExtra   ||
    !req.body.postalCode    ||
    !req.body.city 
  )
    return res.status(400).send("Gelieve alle velden in te vullen."); // TODO - i18n
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).send("Wachtwoord is niet sterk genoeg."); // TODO - i18n

  let user = User.build({
    firstName: req.body.firstName.trim(),
    lastName: req.body.lastName.trim(),
    email: req.body.email.trim().toLowerCase(),
    birthday: req.body.birthday,
    admin: req.body.admin,
    street: req.body.street,
    streetNumber: req.body.streetNumber,
    streetExtra: req.body.streetExtra,      // moet dit er uit en in if? wie weet of nullable? 
    postalCode: req.body.postalCode,
    city: req.body.city
  });
  user.setPassword(req.body.password);
  user.save(function(err) {
    if (err) return next(err);
    user.token = user.generateJWT();
    return res.json(user);
  });
});

router.post("/login", function(req, res, next) {
  // Check if all fields are filled in
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Gelieve alle velden in te vullen."); // TODO - i18n
  }
  passport.authenticate("local", function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (user) {
      user.token = user.generateJWT();
      return res.json(user);
    } else {
      return res.status(401).send(info);
    }
  })(req, res, next);
});

/* PATCH user */
router.patch("/id/:userId", auth, function(req, res, next) {
  let user = req.receivedUser;
  if (req.body.firstName)
    user.firstName = req.body.firstName;
  if (req.body.lastName)
    user.lastName = req.body.lastName;
  if (req.body.email)
    user.email = req.body.email;
  if (req.body.birthday)
    user.birthday = req.body.birthday;
  if (req.body.admin)
    user.admin = req.body.admin;
  if (req.body.street)
    user.street = req.body.street;
  if (req.body.streetNumber)
    user.streetNumber = req.body.streetNumber;
  if (req.body.streetExtra)
    user.streetExtra = req.body.streetExtra;
  if (req.body.postalCode)
    user.postalCode = req.body.postalCode;
   if (req.body.city)
     user.city = req.body.city;
  user.save(function(err) {
    if (err) return next(err);
    return res.json(user);
  });
});

/* DELETE user */
router.delete("/id/:userId", auth, function (req, res, next) {
  // Check permissions
  if (!req.user.admin) return res.status(401).end();

  res.status(501).send("Kan nog geen gebruikers verwijderen.");
});

module.exports = router;
