const express = require('express');
const router = express.Router();
const models = require('../models');
const jwt = require('express-jwt');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;


const auth = jwt({ secret: process.env.WAFELBAK_API_SECRET });
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

//TODO enkel orders voor bepaald jaar?
/** GET orderslisting.
 * @swagger
 * /API/orders:
 *    get:
 *      tags: [Orders]
 *      description: |
 *        This should return a list of all orders if you are logged in as an admin. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      responses: 
 *        "200":
 *          description: Array containing all orders.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items: 
 *                  $ref: '#/components/schemas/Order'
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
  models.Order.findAll({
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
    }], attributes: ['id', 'name', 'amountOfWaffles', 'desiredOrderTime', 'status', 'comment']
  })
    .catch(err => {
      return next(err);
    }).then(function (orders) {
      res.json(orders)
    });
});

//TODO authenticatie voor admins/members?
/** GET order by id
 * @swagger
 * /API/orders/id/{orderId}:
 *    get:
 *      tags: [Orders]
 *      description: |
 *        This should return an order by entering it's id if you are logged in as an either role. <br> <br>
 *        When you are not logged in, it should return a 401 error. <br> <br>
 *        When you enter an id of an order that doesn't exist, it should return a 400 error.
 *      parameters: 
 *        - in: path
 *          name: orderId
 *          required: true
 *          schema:
 *            type: integer
 *            description: Id of the order.
 *      responses: 
 *        "200":
 *          description: Order with the matching id.
 *          content: 
 *            application/json: 
 *              schema: 
 *                $ref: '#/components/schemas/Order'
 *        "400": 
 *          description: Bad Request, order doesn't exist.
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
router.param("orderId", function (req, res, next, id) {
  models.Order.findOne({
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
    attributes: ['id', 'name', 'amountOfWaffles', 'desiredOrderTime', 'status', 'comment'],
    where: { id: id }
  })
    .catch(err => {
      return next(err);
    }).then(function (order) {
      if (!order) {
        return res.status(400).json("Order with id: " + id + " not found.");
      } else {
        req.receivedOrder = order;
        return next();
      }
    });
});
router.get("/id/:orderId", auth, function (req, res, next) {
  res.json(req.receivedOrder);
});

/** GET orders by status
 * @swagger
 * /API/orders/byStatus/{status}:
 *    get:
 *      tags: [Orders]
 *      description: |
 *        This should return all orders with a certain status if you are logged in as an admin. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error. <br> <br>
 *        When you enter a status and no single order has that status, it should return a 400 error.
 *      parameters: 
 *        - in: path
 *          name: status
 *          required: true
 *          schema:
 *            type: string    
 *            enum: 
 *              - "Te Bezorgen"
 *              - "Bezorgd"
 *            description: The status of the order.
 *      responses: 
 *        "200":
 *          description: Orders with the matching status.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Order'
 *        "400": 
 *          description: Bad Request, no orders with that status.
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
router.param("status", function (req, res, next, status) {
  models.Order.findAll({
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
    attributes: ['id', 'name', 'amountOfWaffles', 'desiredOrderTime', 'status', 'comment'],
    where: { status: status }
  })
    .catch(err => {
      return next(err);
    }).then(function (orders) {
      if (orders.length == 0) {
        return res.status(400).json("No orders found with status: " + status + ".");
      } else {
        req.receivedOrders = orders;
        return next();
      }
    })
});
router.get("/byStatus/:status", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();

  res.json(req.receivedOrders);
});

//TODO authenticatie voor admins/members?
/** GET orders by name
 * @swagger
 * /API/orders/byName/{name}:
 *    get:
 *      tags: [Orders]
 *      description: |
 *        This should return all orders from a certain user if you are logged in as either role. <br> <br>
 *        When you are not logged in, it should return a 401 error. <br> <br>
 *        When you enter a status and no single order has that status, it should return a 400 error.
 *      parameters: 
 *        - in: path
 *          name: name
 *          required: true
 *          schema:
 *            type: string
 *            description: Name of the user who made the order.
 *      responses: 
 *        "200":
 *          description: Orders for the user with the name that was entered.
 *          content: 
 *            application/json: 
 *              schema: 
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Order'
 *        "400": 
 *          description: Bad Request, no orders on that name.
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
  models.Order.findAll({
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
    attributes: ['id', 'name', 'amountOfWaffles', 'desiredOrderTime', 'status', 'comment'],
    where: { name: { [Op.like]: '%' + name + '%' } }
  })
    .catch(err => {
      return next(err);
    }).then(function (orders) {
      if (orders.length === 0) {
        return res.status(400).json("No orders found for name: " + name + ".");
      } else {
        req.receivedOrders = orders;
        return next();
      }
    })
});
router.get("/byName/:name", auth, function (req, res, next) {
  res.json(req.receivedOrders);
});

//TODO orders by address/street/zone

/** POST Create Order
 * @swagger
 * /API/orders/create:
 *    post:
 *      tags: [Orders]
 *      description: |
 *        This request is used for creating orders. <br> <br>
 *        Admins and Members have the option to create orders for other users. <br> <br>
 *        When you are not logged in as either role, it should return a 401 error. <br> <br>
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - name
 *                - streetName
 *                - streetNumber
 *                - streetExtra
 *                - amountOfWaffles
 *                - desiredOrderTime
 *                - comment
 *              properties:
 *                name:
 *                  type: string
 *                  description: The name of (the user) who the order is for.
 *                streetName:
 *                  type: string
 *                  description: The name of the street where the order needs to be delivered.
 *                streetNumber:
 *                  type: integer
 *                  description: The number of the address where the order needs to be delivered.
 *                streetExtra:
 *                  type: string
 *                  nullable: true
 *                  description: Additional info about the address where the order needs to be delivered.
 *                amountOfWaffles: 
 *                  type: string
 *                  enum: 
 *                    - "2"
 *                    - "4"
 *                    - "8"
 *                    - "20"
 *                  description: The amount of waffles that are ordered.
 *                desiredOrderTime: 
 *                  type: string
 *                  enum:
 *                    - "9u-12u"
 *                    - "13u-16u"
 *                    - "16u-18u"
 *                    - "Om het even"
 *                  description: The timeframe in which the user wants their order delivered.
 *                comment: 
 *                  type: string
 *                  nullable: true
 *                  description: Additional remarks to the order.
 *      responses: 
 *        "200":
 *          description: Order that has been created.
 *          content: 
 *            application/json: 
 *              schema: 
 *                $ref: '#/components/schemas/Order'
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
  // Check if all required fields are filled in
  if (
    !req.body.name ||
    !req.body.streetName ||
    !req.body.streetNumber ||
    !req.body.amountOfWaffles ||
    !req.body.desiredOrderTime)
    return res.status(400).json("Please fill out all necessary fields.");

  let order = models.Order.build({
    name: req.body.name,
    amountOfWaffles: req.body.amountOfWaffles,
    desiredOrderTime: req.body.desiredOrderTime.trim(),
    comment: req.body.comment
  });

  function doesAddressExist(streetName, streetNumber, streetExtra) {
    return models.Address.count({ include: { model: models.Street, where: { streetName: streetName } }, where: { streetNumber: streetNumber, streetExtra: streetExtra } }).catch(err => {
      return next(err);
    }).then(count => {
      if (count == 0) {
        return false
      } else {
        return true
      }
    });
  }

  //Creating new Address
  let orderAddress = models.Address.build({
    streetNumber: req.body.streetNumber,
    streetExtra: req.body.streetExtra
  });

  doesAddressExist(req.body.streetName, req.body.streetNumber, req.body.streetExtra).then(exists => {
    if (exists) {
      models.Address.findOne({
        include: { model: models.Street, where: { streetName: req.body.streetName } },
        where: { streetNumber: req.body.streetNumber, streetExtra: req.body.streetExtra }
      }).catch(err => {
        return next(err);
      }).then(function (address) {
        orderAddress = address
      }).then(() => {
        order.save().catch(err => {
          return next(err);
        }).then(() => {
          order.setAddress(orderAddress).catch(err => {
            return next(err);
          });
        }).then(() => {
          return res.json(order);
        })
      })
    } else {
      orderAddress.save().catch(err => {
        return next(err);
      }).then(() => {
        models.Street.findOne({ where: { streetName: req.body.streetName } }).catch(err => {
          return next(err);
        }).then(function (street) {
          orderAddress.setStreet(street);
        }).then(() => {
          order.save().catch(err => {
            return next(err);
          }).then(() => {
            order.setAddress(orderAddress).catch(err => {
              return next(err);
            });
          }).then(() => {
            return res.json(order);
          })
        })
      })
    }
  })
});

/** PATCH Complete Order 
 * @swagger
 * /API/orders/complete/{orderId}:
 *    patch:
 *      tags: [Orders]
 *      description: |
 *        This request is used to complete/uncomplete orders. <br> <br>
 *        If the order doesn't exist, it should return a 400 error. <br> <br>
 *        When you are not logged in as an admin, it should return a 401 error.
 *      parameters:
 *        - in: path
 *          name: orderId
 *          schema:
 *            type: integer
 *            description: The id of the order that needs to be (un)completed.
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - status
 *              properties:
 *                status:
 *                  type: string    
 *                  enum: 
 *                    - "Te Bezorgen"
 *                    - "Bezorgd"
 *                  description: The new status of the order.
 *      responses: 
 *        "200":
 *          description: The (un)completed order.
 *          content: 
 *            application/json: 
 *              schema: 
 *                $ref: '#/components/schemas/Order'
 *        "400": 
 *          description: Bad Request, order doesn't exist.
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
router.param("cOrderId", function (req, res, next, id) {
  models.Order.findOne({ where: { id: id } }).catch(err => {
    return next(err);
  }).then(function (order) {
    if (!order) {
      return res.status(400).json("Order with id: " + id + " not found.");
    } else {
      models.Order.update({ status: req.body.status }, { where: { id: id } })
        .catch(err => {
          return next(err);
        }).then(() => {
          models.Order.findOne({
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
            attributes: ['id', 'name', 'amountOfWaffles', 'desiredOrderTime', 'status', 'comment'],
            where: { id: id }
          })
            .catch(err => {
              return next(err);
            }).then(function (order) {
              req.receivedOrder = order;
              return next();
            });
        });
    };
  });
});
router.patch("/complete/:cOrderId", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();
  res.json(req.receivedOrder);
})

/** PATCH Update order
 * @swagger
 * /API/orders/patch/{orderId}:
 *    patch:
 *      tags: [Orders]
 *      description: |
 *        This request is used for updating an order. <br> <br>
 *        If the order doesn't exist, an error 400 will be thrown. <br> <br>
 *        When you are not logged in, it should return a 401 error.
 *      parameters:
 *        - in: path
 *          name: orderId
 *          schema:
 *            type: integer
 *            description: Id of the order.
 *      requestBody: 
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: 
 *                - name
 *                - amountOfWaffles
 *                - desiredOrderTime
 *                - commment
 *                - streetName
 *                - streetNumber
 *                - streetExtra
 *                - cityName
 *                - postalCode
 *              properties:
 *                name:
 *                  type: string
 *                  description: The name of (the user) who the order is for.
 *                streetName:
 *                  type: string
 *                  description: The name of the street where the order needs to be delivered.
 *                streetNumber:
 *                  type: integer
 *                  description: The number of the address where the order needs to be delivered.
 *                streetExtra:
 *                  type: string
 *                  nullable: true
 *                  description: Extra info about the address where the order needs to be delivered.
 *                cityName:
 *                  type: string
 *                  description: The city of the address where the order needs to be delivered.
 *                postalCode:
 *                  type: integer
 *                  description: The postal code of the city where the order needs to be delivered.
 *                amountOfWaffles: 
 *                  type: string
 *                  enum: 
 *                    - "2"
 *                    - "4"
 *                    - "8"
 *                    - "20"
 *                  description: The amount of waffles that are ordered.
 *                desiredOrderTime: 
 *                  type: string
 *                  enum:
 *                    - "9u-12u"
 *                    - "13u-16u"
 *                    - "16u-18u"
 *                    - "Om het even"
 *                  description: The timeframe in which the user wants their order delivered.
 *                comment: 
 *                  type: string
 *                  nullable: true
 *                  description: Additional remarks to the order.
 *      responses: 
 *        "200":
 *          description: The updated order.
 *          content: 
 *            application/json: 
 *              schema: 
 *               $ref: '#components/schemas/Order'
 *        "400": 
 *          description: Bad Request, Order doesn't exist or fields aren't filled in.
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
router.param("uOrderId", function (req, res, next, id) {
  //Creating City
  let orderCity = models.City.build({
    cityName: req.body.cityName,
    postalCode: req.body.postalCode
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

  //Creating Street
  let orderStreet = models.Street.build({
    streetName: req.body.streetName
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

  function show() {
    models.Order.findOne({
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
      attributes: ['id', 'name', 'amountOfWaffles', 'desiredOrderTime', 'status', 'comment'],
      where: { id: id }
    })
      .catch(err => {
        return next(err);
      }).then(function (order) {
        req.receivedOrder = order;
        return next();
      });
  }

  doesCityExist(req.body.cityName).then(exists => {
    if (exists) {
      doesStreetExist(req.body.streetName).then(exists => {
        if (exists) { //Existing street and city
          models.Order.findOne({ where: { id: id } }).catch(err => {
            return next(err);
          }).then(function (order) {
            if (!order) {
              return res.status(400).json("Order with id: " + id + " not found.");
            } else {
              models.Address.update({ streetNumber: req.body.streetNumber, streetExtra: req.body.streetExtra },
                { where: { id: order.AddressId } }).catch(err => {
                  return next(err);
                }).then(() => {
                  show();
                });
            }
          });
        } else { //Existing city
          //UserAddress == Receiving address for the waffles, changes when order address gets changed
          orderStreet.save().catch(err => {
            return next(err);
          }).then(() => {
            models.City.findOne({ where: { cityName: req.body.cityName } }).catch(err => {
              return next(err);
            }).then(function (city) {
              orderStreet.setCity(city).catch(err => {
                return next(err);
              });
            }).then(() => {
              models.Order.findOne({ where: { id: id } }).catch(err => {
                return next(err);
              }).then(function (order) {
                models.Address.findOne({ where: { id: order.AddressId } }).catch(err => {
                  return next(err);
                }).then(function (address) {
                  address.setStreet(orderStreet);
                  models.Address.update({ streetNumber: req.body.streetNumber, streetExtra: req.body.streetExtra },
                    { where: { id: address.id } }).catch(err => {
                      return next(err);
                    }).then(() => {
                      show();
                    });
                });
              });
            });
          });
        }
      });
    } else { // City doesn't exists ==> street doesn't exist
      orderCity.save().catch(err => {
        return next(err);
      }).then(() => {
        orderStreet.save().catch(err => {
          return next(err);
        }).then(() => {
          orderStreet.setCity(orderCity).catch(err => {
            return next(err);
          });
        }).then(() => {
          models.Order.findOne({ where: { id: id } }).catch(err => {
            return next(err);
          }).then(function (order) {
            models.Address.findOne({ where: { id: order.AddressId } }).catch(err => {
              return next(err);
            }).then(function (address) {
              address.setStreet(orderStreet);
              models.Address.update({ streetNumber: req.body.streetNumber, streetExtra: req.body.streetExtra },
                { where: { id: address.id } }).catch(err => {
                  return next(err);
                }).then(() => {
                  show();
                });
            });
          });
        });
      });
    }
  }).then(() => {
    models.Order.update({
      name: req.body.name, amountOfWaffles: req.body.amountOfWaffles,
      desiredOrderTime: req.body.desiredOrderTime,
      comment: req.body.comment
    }, { where: { id: id } })
      .catch(err => {
        return next(err);
      });
  });
});
router.patch("/patch/:uOrderId", auth, function (req, res, next) {
  res.json(req.receivedOrder);
});

/** DELETE Delete Order
 * @swagger
 * /API/orders/delete/{orderId}:
 *    delete:
 *      tags: [Orders]
 *      description: |
 *        This request is used for deleting an order. <br> <br>
 *        Returns true when order is deleted successfully, false when it failed. <br> <br>
 *        When you are not logged in, it should return a 401 error.
 *      parameters:
 *        - in: path
 *          name: orderId
 *          required: true
 *          schema:
 *            type: integer
 *            description: Id of the order.
 *      responses: 
 *        "200":
 *          description: Boolean.
 *          content: 
 *            application/json: 
 *              schema: 
 *                  type: boolean
 *        "400": 
 *          description: Bad Request, no order with id found.
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
router.param("dOrderId", function (req, res, next, id) {
  models.Order.findOne({ where: { id: id } }).catch(err => {
    return next(err);
  }).then(function (order) {
    if (!order) {
      return res.status(400).json("No order with id: " + id + " found.")
    } else {
      models.Address.findOne({ where: { id: order.AddressId } }).catch(err => {
        return next(err);
      }).then(function (address) {
        if (address.UserId == null) {
          models.Address.destroy({ where: { id: address.id } }).catch(err => {
            return next(err);
          });
        }
      }).then(() => {
        models.Order.destroy({ where: { id: id } })
          .catch(err => {
            return next(err);
          }).then(() => {
            //TODO weergeven van order dat verwijderd werd of skip?
            return next();
          });
      });
    }
  });
});
router.delete("/delete/:dOrderId", auth, function (req, res, next) {
  res.json(true);
});


module.exports = router;