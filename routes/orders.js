var express = require('express');
var router = express.Router();
var models  = require('../models');
let jwt = require('express-jwt');
var Sequelize = require('sequelize');
var Op = Sequelize.Op;


let auth = jwt({ secret: process.env.WAFELBAK_BACKEND_SECRET });


/* GET orders listing. */       //TODO enkel orders voor bepaald jaar?
router.get("/", auth, function(req, res, next) {
    // Check permissions
    if (req.user.role != "admin") return res.status(401).end();
    models.Order.findAll({ include: [{
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
  }], attributes: ['id', 'name', 'amountOfWaffles', 'desiredOrderTime', 'status', 'comment']})
    .catch(err => {
      return next(err);
    }).then(function(orders) {
      res.json(orders)
    }); 
  });

/* GET order by id. */ //TODO authenticatie?
router.param("orderId", function(req, res, next, id) {
  models.Order.findOne({ include: [{
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
where: {id: id} })
    .catch(err => {
      return next(err);
    }).then(function(order) {
      if(!order) {
        return next(new Error("not found " + id));
      } else {
        req.receivedOrder = order;
        return next();
      }
    });
  });
  router.get("/id/:orderId", auth, function(req, res, next) {
    res.json(req.receivedOrder);
  });

/* GET orders by status. */
router.param("status", function(req, res, next, status) {
  models.Order.findAll({ include: [{
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
where: {status: status} })
  .catch(err => {
    return next(err);
  }).then(function(orders) {
    if(orders.length === 0) { //TODO error handling met count fzo
      return next(new Error("No orders found with status" + status + "."));
    } else {
      req.receivedOrders = orders;
      return next();
    }
  })
});
router.get("/byStatus/:status", auth, function(req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();

  res.json(req.receivedOrders);
});

/* GET orders by name. */ //TODO authenticatie?
router.param("name", function(req, res, next, name) {
  models.Order.findAll({ include: [{
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
where: {name: {[Op.like]: '%' + name + '%'}}})
    .catch(err => {
      return next(err);
    }).then(function(orders) {
      if(orders.length === 0) {
        return next(new Error("No orders found for name" + name + "."));
      } else {
        req.receivedOrders = orders;
        return next();
      }
    })
});
router.get("/byName/:name", auth, function(req, res, next) {  
    res.json(req.receivedOrders);
});

//TODO orders by address/street/zone
 
/* POST create Order. */
router.post("/create", auth, function(req, res, next) {
    // Check if all required fields are filled in
  if (
    !req.body.name ||
    !req.body.streetName ||
    !req.body.streetNumber ||
    !req.body.amountOfWaffles ||
    !req.body.desiredOrderTime )
    return res.status(400).send("Gelieve alle noodzakelijke velden in te vullen.");

  let order = models.Order.build({
    name: req.body.name,
    amountOfWaffles: req.body.amountOfWaffles,
    desiredOrderTime: req.body.desiredOrderTime.trim(),
    comment: req.body.comment
  });

  function doesAddressExist(streetName, streetNumber, streetExtra) {
    return models.Address.count({include: {model: models.Street, where: {streetName: streetName}}, where: {streetNumber: streetNumber, streetExtra: streetExtra}}).catch(err => {
      return next(err);
    }).then(count => {
      if(count == 0) {
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
    if(exists) {
      models.Address.findOne({include: {model: models.Street, where: {streetName: req.body.streetName}},
         where: {streetNumber: req.body.streetNumber, streetExtra: req.body.streetExtra}}).catch(err => {
           return next(err);
         }).then(function(address) {
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
        models.Street.findOne({where: {streetName: req.body.streetName}}).catch(err => {
          return next(err);
        }).then(function(street) {
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
router.param("orderId", function(req, res, next, id) {
  models.Order.update({ status: req.body.status }, {where: {id: id}})
  .catch(err => {
    return next(err);
  }).then(() => {
    models.Order.findOne({ include: [{
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
  where: {id: id} })
        .catch(err => {
          return next(err);
        }).then(function(order) {
          if(!order) {
            return next(new Error("not found " + req.body.id));
          } else {
            req.receivedOrder = order;
            return next();
          }
        });
      });
});
router.patch("/complete/:orderId", auth, function(req, res, next) {
  // Check permissions
  if (req.user.role != "admin") return res.status(401).end();
  res.json(req.receivedOrder);
})

//TODO
/* UPDATE order */ //streetNumber, streetName, streetExtra, cityName, postalCode
router.param("orderId", function(req, res, next, id) {
  models.Order.update({ name: req.body.name, amountOfWaffles: req.body.amountOfWaffles, 
    desiredOrderTime: req.body.desiredOrderTime, 
    comment: req.body.comment}, {where: {id: id}})
    .catch(err => {
      return next(err);
    }).then(() => {
      models.Order.findOne({ include: [{
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
    where: {id: id} })
          .catch(err => {
            return next(err);
          }).then(function(order) {
            if(!order) {
              return next(new Error("not found " + req.body.id));
            } else {
              req.receivedOrder = order;
              return next();
            }
          });
        });
});
router.patch("/patch/:orderId", auth, function(req, res, next) {
    res.json(req.receivedOrder);
});

//TODO
/* DELETE order */
router.delete("/delete", auth, function (req, res, next) {
  models.Order.destroy({where: {id: req.body.id}})
    .catch(err => {
      return next(err);
    }).then(() => {
      return res.json(req.body)
    });
});
  

module.exports = router;