const express = require('express');
const router = express.Router();
const models = require('../models');
const passport = require('passport');
const jwt = require('express-jwt');
const zxcvbn = require("zxcvbn");
const validator = require('email-validator');

const auth = jwt({ secret: process.env.WAFELBAK_API_SECRET });
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/** GET users listing.
 * @swagger
 * /API/users:
 *    get:
 *      tags: [Users]
 *      description: |
 *        This should return a list of all users if you are logged in as an admin. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      responses: 
 *        "200":
 *          description: Array containing all users.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items: 
 *                  $ref: '#/components/schemas/User'
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.get("/", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();
  models.User.findAll({
    include: [{
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
    order: ['email']
  })
    .catch(err => {
      return next(err);
    }).then(function (users) {
      res.json(users)
    });
});

/** GET users by id.
 * @swagger
 * /API/users/id/{userId}:
 *    get:
 *      tags: [Users]
 *      description: |
 *        This should return a user by entering it's id if you are logged in as an admin. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error. <br> <br>
 *        When you enter an id of a user that doesn't exist, it should return a 500 error.
 *      parameters: 
 *        - in: path
 *          name: userId
 *          required: true
 *          schema:
 *            type: integer
 *            description: Id of the user.
 *      responses: 
 *        "200":
 *          description: User with the matching id.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  $ref: '#/components/schemas/User'
 *        "400": 
 *          description: Bad Request, user doesn't exist.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.param("userId", function (req, res, next, id) {
  models.User.findOne({
    include: [{
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
    where: { id: id }
  })
    .catch(err => {
      return next(err);
    }).then(function (user) {
      if (!user) {
        return res.status(400).json("User with id: " + id + " not found.");
      } else {
        req.receivedUser = user;
        return next();
      }
    });
});
router.get("/id/:userId", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();

  res.json(req.receivedUser);
});

/** GET users by email.
 * @swagger
 * /API/users/{email}:
 *    get:
 *      tags: [Users]
 *      description: |
 *        This should return a user by entering it's email if you are logged in as either role. <br> <br>
 *        When you are not logged in, it should return a 401 error. <br> <br>
 *        When you enter an email of a user that doesn't exist, it should return a 500 error.
 *      parameters: 
 *        - in: path
 *          name: email
 *          required: true
 *          schema:
 *            type: string
 *            format: email
 *            description: Email of the user.
 *      responses: 
 *        "200":
 *          description: User with the matching email.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  $ref: '#/components/schemas/User'
 *        "400": 
 *          description: Bad Request, no user found with given email.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.param("email", function (req, res, next, email) {
  models.User.findOne({
    include: [{
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
    where: { email: email }
  })
    .catch(err => {
      return next(err);
    }).then(function (user) {
      if (!user) {
        return res.status(400).json("No user found with email: " + email + ".");
      } else {
        req.receivedUser = user;
        return next();
      }
    })
});
router.get("/:email", auth, function (req, res, next) {
  res.json(req.receivedUser);
});

//TODO Evt get users by street?

/** POST isValidEmail
 * @swagger
 * /API/users/isValidEmail:
 *    post:
 *      tags: [Users]
 *      description: |
 *        This request checks if the email is valid, and if its not in use already. <br> <br>
 *        If those two requirements are met, it should return true, else it will return false. <br> <br>
 *        This is an unauthorized request, because it gets used by the register functionallity. <br> <br>
 *        Should you be confused about the example values from the Request body, it's all explained in the Schema.
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - email
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *                  description: The email that should be validated.
 *                oldEmail: 
 *                  type: string
 *                  format: email
 *                  nullable: true
 *                  description: This is here to add the current email address to the pool of available email addresses if a user wishes to change his email address.
 *      responses: 
 *        "200":
 *          description: Boolean.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  type: boolean
 *        "400": 
 *          description: Bad Request, required fields are not filled in.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.post("/isValidEmail", function (req, res, next) {
  // Check if all fields are filled in
  if (!req.body.email)
    return res.status(400).json("Please fill out all fields.");

  if (req.body.oldEmail) {
    if (req.body.email === req.body.oldEmail) {
      res.json(true);
    }
  }
  models.User.findOne({ where: { email: req.body.email.trim().toLowerCase() } }).then(function (result) {
    if (result !== null) {
      res.json(false);
    } else
      res.json(validator.validate(req.body.email.trim().toLowerCase()));
  });
});

/** POST Register User
 * @swagger
 * /API/users/register:
 *    post:
 *      tags: [Users]
 *      description: |
 *        This request is used for registering normal users. <br> <br>
 *        This is an unauthorized request. <br> <br>
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - firstName
 *                - lastName
 *                - email
 *                - password
 *                - birthday
 *                - streetName
 *                - streetNumber
 *                - cityName
 *                - postalCode
 *              properties:
 *                firstName:
 *                  type: string
 *                  description: The first name of the user.
 *                lastName:
 *                  type: string
 *                  description: The last name of the user.
 *                email:
 *                  type: string
 *                  format: email
 *                  description: The email of the user.
 *                password:
 *                  type: string
 *                  format: password
 *                  description: The password of the user.
 *                birthday: 
 *                  type: string
 *                  format: date-time
 *                  description: The birthday of the user.
 *                streetName:
 *                  type: string
 *                  description: The street name of the user's home.
 *                streetNumber:
 *                  type: integer
 *                  description: The street number of the user's home.
 *                cityName: 
 *                  type: string
 *                  description: The city in which the user's home is located.
 *                postalCode:
 *                  type: integer
 *                  description: The postalcode of the user's city.
 *      responses: 
 *        "200":
 *          description: User that has been registered.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  $ref: '#/components/schemas/User'
 *        "400": 
 *          description: Bad Request, Password not strong enough or fields not filled out.
 *          content:
 *            application/json:
 *              schema:
 *                type: string
 *                description: This will contain an error message.
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.post("/register", function (req, res, next) {
  // Check if all required fields are filled in
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.password ||
    !req.body.birthday ||
    !req.body.streetName ||
    !req.body.streetNumber ||
    !req.body.cityName ||
    !req.body.postalCode
  )
    return res.status(400).json("Please fill out all fields.");
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).json("Password isn't strong enough.");

  // Creating new User
  let user = models.User.build({
    firstName: req.body.firstName.trim(),
    lastName: req.body.lastName.trim(),
    email: req.body.email.trim().toLowerCase(),
    birthday: req.body.birthday,
    role: req.body.role
  });

  function doesCityExist(cityName) {
    return models.City.count({ where: { cityName: cityName } }).catch(err => {
      return next(err);
    }).then(count => {
      if (count == 0) {
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
    return models.Street.count({ where: { streetName: streetName } }).catch(err => {
      return next(err);
    }).then(count => {
      if (count == 0) {
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
  user.setPassword(req.body.password);
  doesCityExist(req.body.cityName).then(exists => {
    if (exists) {
      models.City.findOne({ where: { cityName: req.body.cityName } }).catch(err => {
        return next(err);
      }).then(function (city) {
        userCity = city;
      }).then(() => {
        doesStreetExist(req.body.streetName).then(exists => {
          if (exists) {
            models.Street.findOne({ where: { streetName: req.body.streetName } }).catch(err => {
              return next(err);
            }).then(function (street) {
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

/** POST Register Member
 * @swagger
 * /API/users/registerMember:
 *    post:
 *      tags: [Users]
 *      description: |
 *        This request is used for registering members. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error. <br> <br>
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - email
 *                - password
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *                  description: The email of the member.
 *                password:
 *                  type: string
 *                  format: password
 *                  description: The password of the member.
 *      responses: 
 *        "200":
 *          description: Member that has been registered.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  $ref: '#/components/schemas/User'
 *        "400": 
 *          description: Bad Request, Password not strong enough or fields not filled out.
 *          content:
 *            application/json:
 *              schema:
 *                type: string
 *                description: This will contain an error message.
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error' 
 */
router.post("/registerMember", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();

  // Check if all required fields are filled in
  if (
    !req.body.email ||
    !req.body.password)
    return res.status(400).json("Please fill out all fields.");
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).json("Password isn't strong enough.");

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

/** POST Register Admin
 * @swagger
 * /API/users/registerAdmin:
 *    post:
 *      tags: [Users]
 *      description: |
 *        This request is used for registering admins. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error. <br> <br>
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - email
 *                - password
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *                  description: The email of the admin.
 *                password:
 *                  type: string
 *                  format: password
 *                  description: The password of the admin.
 *      responses: 
 *        "200":
 *          description: Admin that has been registered.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  $ref: '#/components/schemas/User'
 *        "400": 
 *          description: Bad Request, Password not strong enough or fields not filled out.
 *          content:
 *            application/json:
 *              schema:
 *                type: string
 *                description: This will contain an error message.
 *        "401": 
 *          description: Unauthorized access.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.post("/registerAdmin", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();

  // Check if all required fields are filled in
  if (
    !req.body.email ||
    !req.body.password)
    return res.status(400).json("Please fill out all fields.");
  // Check if password is strong enough
  if (zxcvbn(req.body.password).score < 2)
    return res.status(400).json("Password isn't strong enough.");

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

/** POST Login
 * @swagger
 * /API/users/login:
 *    post:
 *      tags: [Users]
 *      description: |
 *        This request is used for logging in. <br> <br>
 *        Use this to get your token, then you can proceed testing here on the SwaggerUI. <br> <br>
 *        This request returns user + token.
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - email
 *                - password
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *                  description: The email of the user.
 *                password:
 *                  type: string
 *                  format: password
 *                  description: The password of the user.
 *      responses: 
 *        "200":
 *          description: Token of the user that has been logged in.
 *          content: 
 *            application/json: 
 *              schema: 
 *                $ref: '#/components/schemas/User'
 *        "400": 
 *          description: Bad Request, fields not filled out.
 *          content:
 *            application/json:
 *              schema:
 *                type: string
 *                description: This will contain an error message.
 *        "401": 
 *          description: Invalid login info.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#components/schemas/Error' 
 *        "500": 
 *          description: Server may be down - Internal Server Error.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.post("/login", function (req, res, next) {
  // Check if all fields are filled in
  if (!req.body.email || !req.body.password) {
    return res.status(400).json("Please fill out all fields.");
  }
  passport.authenticate("local", function (err, user, info) {
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
router.patch("/editProfile", auth, function (req, res, next) {
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
