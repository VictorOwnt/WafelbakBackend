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
  if (req.user.role != "admin") return res.status(401).end();
  models.User.findAll({include: [{
    model: models.Address,
    include: [{
      model: models.Street,
      include: [{
        model: models.City,
        attributes: ['cityName', 'postalCode']
      }],
      attributes: ['streetName']
    }], 
    attributes: ['streetNumber', 'streetExtra']
  }],
  attributes: ['id', 'firstName', 'lastName', 'email', 'birthday', 'role'],
  order: ['email'] }) 
  .catch(err => {
    return next(err);
  }).then(function(users) {
    res.json(users)
  }); 
});

/* GET user by id. */
router.param("userId", function(req, res, next, id) {
  models.User.findOne({include: [{
    model: models.Address,
    include: [{
      model: models.Street,
      include: [{
        model: models.City,
        attributes: ['cityName', 'postalCode']
      }],
      attributes: ['streetName']
    }], 
    attributes: ['streetNumber', 'streetExtra']
  }],
  attributes: ['id', 'firstName', 'lastName', 'email', 'birthday', 'role'],
  where: {id: id} })
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
  if (req.user.role != "admin") return res.status(401).end();

  res.json(req.receivedUser);
});

/* GET user by email. */
router.param("email", function(req, res, next, email) {
  models.User.findOne({include: [{
    model: models.Address,
    include: [{
      model: models.Street,
      include: [{
        model: models.City,
        attributes: ['cityName', 'postalCode']
      }],
      attributes: ['streetName']
    }], 
    attributes: ['streetNumber', 'streetExtra']
  }],
  attributes: ['id', 'firstName', 'lastName', 'email', 'birthday', 'role'],
  where: {email: email} })
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

//TODO Evt get users by street?

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

//TODO REGISTER USER
router.post("/register", function(req, res, next) {
  // Check if all required fields are filled in
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.password ||
    !req.body.birthday ||
    !req.body.streetName   ||           
    !req.body.streetNumber  ||
    !req.body.cityName ||
    !req.body.postalCode
  )
    return res.status(400).send("Gelieve alle velden in te vullen.");
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).send("Wachtwoord is niet sterk genoeg.");
  
  // Creating new User
  let user = models.User.build({
    firstName: req.body.firstName.trim(),
    lastName: req.body.lastName.trim(),
    email: req.body.email.trim().toLowerCase(),
    birthday: req.body.birthday,
    role: req.body.role
  });

  function doesCityExist(cityName) {
    return models.City.count({where: {cityName: cityName}}).catch(err => {
      return next(err);
    }).then(count => {
      if(count == 0) {
        return false
      } else {
        return true
      }
    });
  }

  //Creating City
  let userCity = models.City.build({
    cityName: req.body.cityName,
    postalCode: req.body.postalCode
  });

  function doesStreetExist(streetName) {
    return models.Street.count({where: {streetName: streetName}}).catch(err => {
      return next(err);
    }).then(count => {
      if(count == 0) {
        return false
      } else {
        return true
      }
    });
  }
 
  //Creating Street
  let userStreet = models.Street.build({
    streetName: req.body.streetName
  });

  //Creating new Address
  let userAddress = models.Address.build({
    streetNumber: req.body.streetNumber,
    streetExtra: req.body.streetExtra
  });

  //Saving the whole thing into database
  //TODO mogelijke duplicate code weg
  user.setPassword(req.body.password);
  doesCityExist(req.body.cityName).then(exists => {
     if(exists) {
       models.City.findOne({where: {cityName: req.body.cityName}}).catch(err => {
         return next(err);
       }).then(function(city) {
         userCity = city;
       }).then(() => {
         doesStreetExist(req.body.streetName).then(exists => {
           if(exists) {
             models.Street.findOne({where: {streetName: req.body.streetName}}).catch(err => {
               return next(err);
             }).then(function(street) {
               userStreet = street;
             }).then(() => {
               userAddress.setStreet(userStreet);
             }).then(() => {
               user.save().catch(err => {
                 return next(err);
               }).then(() => {
                 user.setAddress(userAddress).catch(err => {
                   return next(err);
                 });
               }).then(() => {
                 user.token = user.generateJWT();
                 return res.json(user);
               });
             });
           } else {
            userStreet.save().catch(err => {
              return next(err);
            }).then(() => {
              userStreet.setCity(userCity).catch(err => {
                return next(err);
              });
            }).then(() => {
              userAddress.setStreet(userStreet);
            }).then(() => {
              user.save().catch(err => {
                return next(err);
              }).then(() => {
                user.setAddress(userAddress).catch(err => {
                  return next(err);
                });
              }).then(() => {
                user.token = user.generateJWT();
                return res.json(user);
              });
            });
           }
         });
       });
      } else { //als stad niet bestaat bestaat straat sws ook niet
      userCity.save().catch(err => {
        return next(err);
      }).then(() => {
        userStreet.save().catch(err => {
          return next(err);
        }).then(() => { 
          userStreet.setCity(userCity).catch(err => {
            return next(err);
          });
        }).then(() => {
          userAddress.save().catch(err => {
            return next(err);
          }).then(() => {
            userAddress.setStreet(userStreet);
          }).then(() => {
            user.save().catch(err => {
              return next(err);
            }).then(() => {
              user.setAddress(userAddress).catch(err => {
                return next(err);
              });
            }).then(() => {
              user.token = user.generateJWT();
              return res.json(user);
            });
          });
        });
      });
     }
  });
});

// REGISTER MEMBER
router.post("/splintereremonie", function(req, res, next) {
  // Check if all required fields are filled in
  if (
    !req.body.email ||
    !req.body.password )
    return res.status(400).send("Gelieve alle velden in te vullen.");
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).send("Wachtwoord is niet sterk genoeg.");

  let member = models.User.build({
    email: req.body.email.trim().toLowerCase(),
    role: "member"
  });
  member.setPassword(req.body.password);
  member.save().catch(err => {
    return next(err);
  }).then(() => {
    member.token = member.generateJWT();
    return res.json(member);
  });
});

// REGISTER ADMIN
router.post("/victorisdebeste", function(req, res, next) {
  // Check if all required fields are filled in
  if (
    !req.body.email ||
    !req.body.password )
    return res.status(400).send("Gelieve alle velden in te vullen.");
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).send("Wachtwoord is niet sterk genoeg.");

  let admin = models.User.build({
    email: req.body.email.trim().toLowerCase(),
    role: "admin"
  });
  admin.setPassword(req.body.password);
  admin.save().catch(err => {
    return next(err);
  }).then(() => {
    admin.token = admin.generateJWT();
    return res.json(admin);
  });
});

router.post("/login", function(req, res, next) {
  // Check if all fields are filled in
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Gelieve alle velden in te vullen.");
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

//TODO Aanpassen naar nieuw model
/* UPDATE user */
router.patch("/editProfile", auth, function(req, res, next) {
  res.status(501).send("Kan nog geen gebruikers aanpassen.");
  /*if (
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
    return res.status(400).send("Gelieve alle velden in te vullen.");
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).send("Wachtwoord is niet sterk genoeg.");
  
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
        return next(new Error("not found " + req.body.id));
      } else {
        return res.json(user)
      }
    });
  });*/
});

/* DELETE user */ //TODO AANPASSEN
router.delete("/delete/:userId", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();

  res.status(501).send("Kan nog geen gebruikers verwijderen.");
});

module.exports = router;
