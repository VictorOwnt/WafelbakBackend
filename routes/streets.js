const express = require('express');
const router = express.Router();
const models = require('../models');
const jwt = require('express-jwt');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const auth = jwt({ secret: process.env.WAFELBAK_API_SECRET, algorithms: ['RS512'] });
/**
 * @swagger
 * tags:
 *   name: Streets
 *   description: Street management
 */


/** GET streets listing.
 * @swagger
 * /API/streets:
 *    get:
 *      tags: [Streets]
 *      description: |
 *        This should return a list of all streets if you are logged in as a member or admin. <br> <br>
 *        When you are not logged in as a member or admin, it should return a 401 error.
 *      responses: 
 *        "200":
 *          description: Array containing all streets.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items: 
 *                  $ref: '#/components/schemas/Street'
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
  if (req.user.role != "admin") {
    if (req.user.role != "member") {
      return res.status(401).end();
    }
  }

  models.Street.findAll({
    include: [{
      model: models.City,
      attributes: ['id', 'cityName', 'postalCode']
    }, {
      model: models.Zone,
      attributes: ['id', 'zoneName']
    }], attributes: ['id', 'streetName']
  })
    .catch(err => {
      return next(err);
    }).then(function (streets) {
      res.json(streets)
    });
});

//TODO authenticatie voor admins/members?
/** GET street by id
 * @swagger
 * /API/streets/id/{streetId}:
 *    get:
 *      tags: [Streets]
 *      description: |
 *        This should return a street by entering it's id if you are logged in as an either role. <br> <br>
 *        When you are not logged in, it should return a 401 error. <br> <br>
 *        When you enter an id of a street that doesn't exist, it should return a 400 error.
 *      parameters: 
 *        - in: path
 *          name: streetId
 *          required: true
 *          schema:
 *            type: integer
 *            description: Id of the street.
 *      responses: 
 *        "200":
 *          description: Street with the matching id.
 *          content: 
 *            application/json: 
 *              schema: 
 *                $ref: '#/components/schemas/Street'
 *        "400": 
 *          description: Bad Request, street doesn't exist.
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
router.param("streetId", function (req, res, next, id) {
  models.Street.findOne({
    include: [{
      model: models.City,
      attributes: ['id', 'cityName', 'postalCode']
    }, {
      model: models.Zone,
      attributes: ['id', 'zoneName']
    }], attributes: ['id', 'streetName'],
    where: { id: id }
  })
    .catch(err => {
      return next(err);
    }).then(function (street) {
      if (!street) {
        return res.status(400).json("Street with id: " + id + " not found.");
      } else {
        req.receivedStreet = street;
        return next();
      }
    });
});
router.get("/id/:streetId", auth, function (req, res, next) {
  res.json(req.receivedStreet);
});

//TODO authenticatie voor admins/members?
/** GET street by name
 * @swagger
 * /API/streets/byName/{name}:
 *    get:
 *      tags: [Streets]
 *      description: |
 *        This should return a street by entering it's name if you are logged in as an either role. <br> <br>
 *        When you are not logged in, it should return a 401 error. <br> <br>
 *        When you enter a name of a street that doesn't exist, it should return a 400 error.
 *      parameters: 
 *        - in: path
 *          name: name
 *          required: true
 *          schema:
 *            type: string
 *            description: Name of the street.
 *      responses: 
 *        "200":
 *          description: Street with the matching name.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Street'
 *        "400": 
 *          description: Bad Request, street doens't exist.
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
router.param("name", function (req, res, next, name) {
  // findAll omdat er meerder straten met dezelfde naam kunnen bestaan in verschillende steden
  models.Street.findAll({
    include: [{
      model: models.City,
      attributes: ['id', 'cityName', 'postalCode']
    }, {
      model: models.Zone,
      attributes: ['id', 'zoneName']
    }], attributes: ['id', 'streetName'],
    where: { streetName: { [Op.like]: '%' + name + '%' } }
  })
    .catch(err => {
      return next(err);
    }).then(function (streets) {
      if (streets.length == 0) {
        return res.status(400).json("Street with name: " + name + " not found.");
      } else {
        req.receivedStreets = streets;
        return next();
      }
    });
});
router.get("/byName/:name", auth, function (req, res, next) {
  res.json(req.receivedStreets);
});


//TODO authenticatie voor admins/members?
/** GET streets by city
 * @swagger
 * /API/streets/byCity/{cityName}:
 *    get:
 *      tags: [Streets]
 *      description: |
 *        This should return all streets in city by entering the city name if you are logged in as an either role. <br> <br>
 *        When you are not logged in, it should return a 401 error. <br> <br>
 *        When you enter the name of a city that doesn't exist, it should return a 400 error.
 *      parameters: 
 *        - in: path
 *          name: cityName
 *          required: true
 *          schema:
 *            type: string
 *            description: Name of the city.
 *      responses: 
 *        "200":
 *          description: Array of streets in the city with the matching name.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Street'
 *        "400": 
 *          description: Bad Request, city doesn't exist or doesn't contain streets.
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
router.param("cityName", function (req, res, next, cityName) {
  models.Street.findAll({
    include: [{
      model: models.City,
      attributes: ['id', 'cityName', 'postalCode'],
      where: { cityName: cityName }
    }, {
      model: models.Zone,
      attributes: ['id', 'zoneName']
    }], attributes: ['id', 'streetName']
  })
    .catch(err => {
      return next(err);
    }).then(function (streets) {
      if (streets.length == 0) {
        return res.status(400).json("City with name: " + cityName + " doesn't exist or contains no streets.");
      } else {
        req.receivedStreets = streets;
        return next();
      }
    });
});
router.get("/byCity/:cityName", auth, function (req, res, next) {
  res.json(req.receivedStreets);
});

//TODO  eventule verplaatsing naar zones routes?
/** GET streets by zone
 * @swagger
 * /API/streets/byZone/{zoneName}:
 *    get:
 *      tags: [Streets]
 *      description: |
 *        This should return all streets in a zone by entering the zone name if you are logged in as an admin. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error. <br> <br>
 *        When you enter an name of a zone that doesn't exist, it should return a 400 error.
 *      parameters: 
 *        - in: path
 *          name: zoneName
 *          required: true
 *          schema:
 *            type: string
 *            description: Name of the zone.
 *      responses: 
 *        "200":
 *          description: Array of streets in the zone with the matching name.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Street'
 *        "400": 
 *          description: Bad Request, zone doesn't exist or contains no streets.
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
router.param("zoneName", function (req, res, next, zoneName) {
  models.Street.findAll({
    include: [{
      model: models.City,
      attributes: ['id', 'cityName', 'postalCode']
    }, {
      model: models.Zone,
      attributes: ['id', 'zoneName'],
      where: { zoneName: zoneName }
    }], attributes: ['id', 'streetName']
  })
    .catch(err => {
      return next(err);
    }).then(function (streets) {
      if (streets.length == 0) {
        return res.status(400).json("Zone with name: " + zoneName + " doesn't exist or contains no streets.");
      } else {
        req.receivedStreets = streets;
        return next();
      }
    });
});
router.get("/byZone/:zoneName", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();
  res.json(req.receivedStreets);
});

/** POST Create Street
 * @swagger
 * /API/streets/create:
 *    post:
 *      tags: [Streets]
 *      description: |
 *        This request is used for creating streets. <br> <br>
 *        When you are not logged in as either role, it should return a 401 error.
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - streetName
 *                - cityName
 *                - postalCode
 *              properties:
 *                streetName:
 *                  type: string
 *                  description: The name of the street.
 *                cityName:
 *                  type: string
 *                  description: The name of the city.
 *                postalCode: 
 *                  type: integer
 *                  description: The postal code of the city.
 *      responses: 
 *        "200":
 *          description: Street that has been created.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: integer
 *                      description: Id of the newly created street.
 *                    streetName:
 *                      type: string
 *                      description: The name of the newly created street.
 *                    CityId: 
 *                      type: integer
 *                      description: The id of the city the newly created street is linked to.
 *        "400": 
 *          description: Bad Request, required fields are not filled out.
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
 *          description: Server may be down - Internal Sever Error.
 *          content: 
 *            application/json:
 *              schema: 
 *                $ref: '#/components/schemas/Error'
 */
router.post("/create", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") {
    if (req.user.role != "member") {
      return res.status(401).end();
    }
  }

  // Check if all required fields are filled in
  if (
    !req.body.streetName ||
    !req.body.cityName ||
    !req.body.postalCode)
    return res.status(400).json("Please fill out all necessary fields.");

  //Creating City
  let city = models.City.build({
    cityName: req.body.cityName,
    postalCode: req.body.postalCode
  });

  function doesCityExist(cityName, postalCode) {
    return models.City.count({ where: { cityName: cityName, postalCode: postalCode } }).catch(err => {
      return next(err);
    }).then(count => {
      if (count == 0) {
        return false
      } else {
        return true
      }
    });
  }

  //Creating new Street
  let street = models.Street.build({
    streetName: req.body.streetName,
  });

  //check op postcode hoeft niet persé
  doesCityExist(req.body.cityName, req.body.postalCode).then(exists => {
    if (exists) {
      street.save().catch(err => {
        return next(err);
      }).then(() => {
        models.City.findOne({ where: { cityName: req.body.cityName } }).catch(err => {
          return next(err);
        }).then(function (city) {
          street.setCity(city);
        }).then(() => {
          return res.json(street);
        })
      })
    } else {
      city.save().catch(err => {
        return next(err);
      }).then(() => {
        street.save().catch(err => {
          return next(err);
        }).then(() => {
          street.setCity(city);
        }).then(() => {
          return res.json(street);
        })
      })
    }
  })
});

//TODO evenuteel veranderen naar parameter zoals in complete order? 
/** PATCH set Zones 
 * @swagger
 * /API/streets/setZone:
 *    patch:
 *      tags: [Streets]
 *      description: |
 *        This request is used for adding streets to specific zones. <br> <br>
 *        It is possible to enter multiple street names. <br> <br>
 *        If the zone doesn't exist, it should return a 400 error. <br> <br>
 *        If a wrong streetname is filled in, it will skip that one, but still do the others. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - streetNames
 *                - zoneName
 *              properties:
 *                streetNames:
 *                  type: array
 *                  items:
 *                    type: string
 *                  description: The names of the streets.
 *                zoneName:
 *                  type: string
 *                  description: The name of the zone in which the streets need to be added.
 *      responses: 
 *        "200":
 *          description: Array of the streets with their new assigned zones.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Street'
 *        "400": 
 *          description: Bad Request, zone doesn't exist.
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
router.patch("/setZone", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();

  models.Zone.findOne({ where: { zoneName: req.body.zoneName } }).catch(err => {
    return next(err);
  }).then(function (zone) {
    if (!zone) {
      return res.status(400).json("No zone found with name " + req.body.zoneName + ".");
    } else {
      models.Street.update({ ZoneId: zone.id }, { where: { streetName: req.body.streetNames } }).catch(err => {
        return next(err);
      }).then(() => {
        models.Street.findAll({
          include: [{
            model: models.City,
            attributes: ['id', 'cityName', 'postalCode']
          }, {
            model: models.Zone,
            attributes: ['id', 'zoneName']
          }], attributes: ['id', 'streetName'],
          where: { streetName: req.body.streetNames }
        }).catch(err => {
          return next(err);
        }).then(function (streets) {
          res.json(streets);
        });
      });
    }
  });
});

//TODO change this requiest like update order? with param?
/** PATCH Update street
 * @swagger
 * /API/streets/updateStreet:
 *    patch:
 *      tags: [Streets]
 *      description: |
 *        This request is used for updating a street. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - id
 *                - streetName
 *              properties:
 *                id: 
 *                  type: integer
 *                  description: The id of the street that needs to be updated.
 *                streetName:
 *                  type: string
 *                  description: The name of the street that needs to be updated.
 *      responses: 
 *        "200":
 *          description: The updated street.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: object
 *                properties:
 *                  id: 
 *                    type: integer
 *                    description: The id of the street that has been updated.
 *                  streetName:
 *                    type: string
 *                    description: The name of the street that has been updated.
 *                  CityId:
 *                    type: integer
 *                    description: The id of city that the updated street is part of.
 *        "400": 
 *          description: Bad Request, Street can't be updatet because there already exists one with that name.
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
router.patch("/updateStreet", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();

  models.Street.findOne({ where: { streetName: req.body.streetName } }).then(function (result) {
    if (result !== null) {
      res.status(400).json("There does already exist a street with that name.")
    } else {
      models.Street.update({ streetName: req.body.streetName }, { where: { id: req.body.id } }).catch(err => {
        return next(err);
      }).then(() => {
        models.Street.findOne({ attributes: ['id', 'streetName', 'CityId'], where: { id: req.body.id } }).catch(err => {
          return next(err);
        }).then(function (zone) {
          return res.json(zone)
        });
      });
    }
  })
});

//misschien deze weghalen, is gevaarlijk, kan gans systeem omzeep helpen
//TODO superadmin (aka ik kan dit enekel aanhalen)
/** DELETE Delete Street
 * @swagger
 * /API/streets/delete/{streetId}:
 *    delete:
 *      tags: [Streets]
 *      description: |
 *        <b>BE CAREFUL USING THIS, IT CAN FUCK UP THE WHOLE SYSTEM.</b> <br> <br>
 *        This request is used for deleting street. <br> <br>
 *        Returns true when street is deleted successfully, false when it failed. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      parameters:
 *        - in: path
 *          name: streetId
 *          required: true
 *          schema:
 *            type: integer
 *            description: Id of the street.
 *      responses: 
 *        "200":
 *          description: Boolean.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  type: boolean
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
router.param("dStreetId", function (req, res, next, id) {
  models.Street.destroy({ where: { id: id } })
    .catch(err => {
      return next(err);
    }).then(() => {
      //TODO weergeven van straat die verwijderd werd of skip?
      return next();
    });
});
router.delete("/delete/:dStreetId", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();
  res.json(true);
});


module.exports = router;