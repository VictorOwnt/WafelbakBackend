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

/* GET order by id. */ //TODO authenticatie?
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
        return next(new Error("not found " + id));
      } else {
        req.receivedOrder = order;
        return next();
      }
    });
});
router.get("/id/:orderId", auth, function (req, res, next) {
  res.json(req.receivedOrder);
});

/* GET orders by status. */
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
      if (orders.length === 0) { //TODO error handling met count fzo
        return next(new Error("No orders found with status" + status + "."));
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

/* GET orders by name. */ //TODO authenticatie?
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
        return next(new Error("No orders found for name" + name + "."));
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

/* POST create Order. */
router.post("/create", auth, function (req, res, next) {
  // Check if all required fields are filled in
  if (
    !req.body.name ||
    !req.body.streetName ||
    !req.body.streetNumber ||
    !req.body.amountOfWaffles ||
    !req.body.desiredOrderTime)
    return res.status(400).send("Gelieve alle noodzakelijke velden in te vullen.");

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

/* COMPLETE Order */
router.param("cOrderId", function (req, res, next, id) {
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
          if (!order) {
            return next(new Error("not found " + req.body.id));
          } else {
            req.receivedOrder = order;
            return next();
          }
        });
    });
});
router.patch("/complete/:cOrderId", auth, function (req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();
  res.json(req.receivedOrder);
})

/* UPDATE order */
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
        if (!order) {
          return next(new Error("not found " + req.body.id));
        } else {
          req.receivedOrder = order;
          return next();
        }
      });
  }

  doesCityExist(req.body.cityName).then(exists => {
    if (exists) {
      doesStreetExist(req.body.streetName).then(exists => {
        if (exists) { //Existing street and city
          models.Order.findOne({ where: { id: id } }).catch(err => {
            return next(err);
          }).then(function (order) {
            models.Address.update({ streetNumber: req.body.streetNumber, streetExtra: req.body.streetExtra },
              { where: { id: order.AddressId } }).catch(err => {
                return next(err);
              }).then(() => {
                show();
              });
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

/* DELETE order */
router.param("dOrderId", function (req, res, next, id) {
  models.Order.findOne({ where: { id: id } }).catch(err => {
    return next(err);
  }).then(function (order) {
    models.Address.findOne({ where: { id: order.AddressId } }).catch(err => {
      return next(err);
    }).then(function (address) {
      if (address.UserId == null) {
        models.Address.destroy({ where: { id: address.id } }).catch(err => {
          return next(err);
        });
      }
    });
  }).then(() => {
    models.Order.destroy({ where: { id: id } })
      .catch(err => {
        return next(err);
      }).then(() => {
        //TODO weergeven van order dat verwijderd werd of skip?
        return next();
      });
  })
});
router.delete("/delete/:dOrderId", auth, function (req, res, next) {
  res.json(true);
});


module.exports = router;