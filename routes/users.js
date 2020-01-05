var express = require('express');
var router = express.Router();
var models  = require('../models');
let passport = require('passport');
let jwt = require('express-jwt');
let zxcvbn = require("zxcvbn");
let validator = require('email-validator');

let auth = jwt({ secret: process.env.WAFELBAK_BACKEND_SECRET });

/* GET users listing. */
router.get("/", auth, function(req, res, next) {
  // Check permissions
  if (!req.user.admin) return res.status(401).end();

  models.User.findAll({ attributes: ['id', 'firstName', 'lastName', 'email', 'birthday', 'admin', 'street', 'streetNumber', 'streetExtra', 'postalCode', 'city'], order: ['email']})
  .catch(err => {
    return next(err);
  }).then(function(users) {
    res.json(users)
  }); 
});

/* GET user by id. */
router.param("userId", function(req, res, next, id) {
  models.User.findOne({ attributes: ['id', 'firstName', 'lastName', 'email', 'birthday', 'admin', 'street', 'streetNumber', 'streetExtra', 'postalCode', 'city'], where: {id: id}})
  .catch(err => {
    return next(err);
  }).then(function(user) {
    if(!user) {
      return next(new Error("not found " + id));
    } else {
      req.receivedUser = user;
      return next();
    }
  });
});
router.get("/id/:userId", auth, function(req, res, next) {
  // Check permissions
  if (!req.user.admin) return res.status(401).end();

  res.json(req.receivedUser);
});

/* GET user by email. */
router.param("email", function(req, res, next, email) {
  models.User.findOne({ attributes: ['id', 'firstName', 'lastName', 'email', 'birthday', 'admin', 'street', 'streetNumber', 'streetExtra', 'postalCode', 'city'], where: {email: email}})
  .catch(err => {
    return next(err);
  }).then(function(user) {
    if(!user) {
      return next(new Error("No user found with email '" + email + "'."));
    } else {
      req.receivedUser = user;
      return next();
    }
  })
});
router.get("/:email", auth, function(req, res, next) {
  res.json(req.receivedUser);
});

/* REGISTER / LOGIN functionality */
router.post("/isValidEmail", function(req, res, next) {
  // Check if all fields are filled in
  if (!req.body.email)
    return res.status(400).json("Please fill out all fields.");

  if (req.body.oldEmail)
  {
    if (req.body.email === req.body.oldEmail)
    {
      res.send(true);
    }
  } 
models.User.findOne({where: {email: req.body.email.trim().toLowerCase() }}).then(function(result) {
      if (result !== null) {
        res.send(false);
      }  else
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
    !req.body.postalCode    ||
    !req.body.city 
  )
    return res.status(400).send("Gelieve alle velden in te vullen."); // TODO - i18n
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).send("Wachtwoord is niet sterk genoeg."); // TODO - i18n

  let user = models.User.build({
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
  user.save().catch(err => {
    return next(err);
  }).then(() => {
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

/* UPDATE user */
router.patch("/editProfile", auth, function(req, res, next) {
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.password ||
    !req.body.birthday ||
    !req.body.street   ||           // TODO moet dit address.street, /streetNumber en /postalcode /city?
    !req.body.streetNumber  ||
    !req.body.postalCode    ||
    !req.body.city 
  )
    return res.status(400).send("Gelieve alle velden in te vullen."); // TODO - i18n
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).send("Wachtwoord is niet sterk genoeg."); // TODO - i18n
  
    models.User.update({ firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email,
    password: req.body.password, birthday: req.body.birthday, street: req.body.street, streetNumber: req.body.streetNumber,
    streetExtra: req.body.streetExtra, postalCode: req.body.postalCode, city: req.body.city
   }, {where: {id: req.body.id}})
   .catch(err => {
    return next(err);
  }).then(() => {
    models.User.findOne({ attributes: ['id', 'firstName', 'lastName', 'email', 'birthday', 'admin', 'street', 'streetNumber', 'streetExtra', 'postalCode', 'city'], where: {id: req.body.id}})
    .catch(err => {
      return next(err);
    }).then(function(user) {
      if(!user) {
        return next(new Error("not found " + id));
      } else {
        return res.json(user)
      }
    });
  });
});

/* DELETE user */ //TODO AANPASSEN
router.delete("/delete/:userId", auth, function (req, res, next) {
  // Check permissions
  if (!req.user.admin) return res.status(401).end();

  res.status(501).send("Kan nog geen gebruikers verwijderen.");
});

module.exports = router;
