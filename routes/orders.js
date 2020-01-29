var express = require('express');
var router = express.Router();
var models  = require('../models');
let jwt = require('express-jwt');


let auth = jwt({ secret: process.env.WAFELBAK_BACKEND_SECRET });

//TODO
/* GET orders listing. */       //TODO enkel orders voor bepaald jaar?
router.get("/", auth, function(req, res, next) {
    // Check permissions
    if (!req.user.admin) return res.status(401).end();
  
    models.Order.findAll({ attributes: ['id', 'amountOfWaffles', 'desiredOrderTime', 'comment', 'status', 'UserId']})
    .catch(err => {
      return next(err);
    }).then(function(orders) {
      res.json(orders)
    }); 
  });

//TODO
/* GET order by id. */ //TODO authenticatie?
router.param("orderId", function(req, res, next, id) {
    models.Order.findOne({ attributes: ['id', 'amountOfWaffles', 'desiredOrderTime', 'comment', 'status', 'UserId'], where: {id: id}})
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

//TODO
/* GET orders by status. */
router.param("status", function(req, res, next, status) {
  models.Order.findAll({ attributes: ['id', 'amountOfWaffles', 'desiredOrderTime', 'comment', 'status', 'UserId'], where: {status: status}})
  .catch(err => {
    return next(err);
  }).then(function(orders) {
    if(orders.length === 0) {
      return next(new Error("No orders found with status" + status + "."));
    } else {
      req.receivedOrders = orders;
      return next();
    }
  })
});
router.get("/byStatus/:status", auth, function(req, res, next) {
  // Check permissions
  if (!req.user.admin) return res.status(401).end();

  res.json(req.receivedOrders);
});

//TODO
/* GET orders by userid. */ //TODO authenticatie?
router.param("userid", function(req, res, next, userid) {
    models.Order.findAll({ attributes: ['id', 'amountOfWaffles', 'desiredOrderTime', 'comment', 'status', 'UserId'], where: {Userid: userid}})
    .catch(err => {
      return next(err);
    }).then(function(orders) {
      if(orders.length === 0) {
        return next(new Error("No orders found for user" + userid + "."));
      } else {
        req.receivedOrders = orders;
        return next();
      }
    })
});
router.get("/byUserId/:userid", auth, function(req, res, next) {  
    res.json(req.receivedOrders);
});

//TODO
/* GET orders & users Joined.*/
router.get("/joined", auth, function(req, res, next){
  // Check permissions
  if (!req.user.admin) return res.status(401).end();

  models.Order.findAll({ include: {model: models.User}, attributes: ['id', 'amountOfWaffles', 'desiredOrderTime', 'comment', 'status', 'UserId',
  'User.firstName','User.lastName','User.street', 'User.streetNumber', 'User.streetExtra', 'User.postalCode', 'User.city']})
    .catch(err => {
      return next(err);
    }).then(function(query) {
      return res.json(query)
    })
});

//TODO
/* GET orders by UserEmail. */ //TODO authenticatie?
router.param("email", function(req, res, next, email) {
    models.User.findAll({ include: {model: models.Order}, attributes: ['Orders.id', 'Orders.amountOfWaffles', 'Orders.desiredOrderTime', 'Orders.comment', 'Orders.status', 'Orders.UserId'], where: {email: email}})
    .catch(err => {
      return next(err);
    }).then(function(orders) {
      if(orders.length === 0) {
        return next(new Error("No orders found for user with email" + email + "."));
      } else {
        req.receivedOrders = orders;
        return next();
      }
    })
});
router.get("/byUserMail/:email", auth, function(req, res, next) {  
    res.json(req.receivedOrders);
});

//TODO
  // CREATE ORDER ==> order met dropdownlijst van straat
  // straten worden appart gemaakt, dus findone op street 
  // voor de straat van de order
  //order.save.then.user.addorder 
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
 /* TODO in deze stijl
  let orderAddress = models.Address.build({
    streetNumber: req.body.streetNumber,
    streetExtra: req.body.streetExtra
  })

  let orderStreet = models.Street.build({
    streetName: req.body.streetName
  })

  models.Address.findOrCreate({
    where: {streetNumber: req.body.streetNumber, streetExtra: req.body.streetExtra},
    include: {model: models.Street}
  }).catch(err => {
      return next(err);
  }).then(function(address) {
      orderAddress = address;
  }).then(() => {
    models.Street.findOrCreate({
      where: {streetName: req.body.streetName}
    }).catch(err => {
      return next(err);
    }).then(function(street) {
      orderStreet = street; 
    })
  });

  orderAddress.setStreet(orderStreet);
  order.save().catch(err => {
    return next(err);
  }).then(() => {
    order.setAddress(orderAddress)
  }).then(() => {
    return res.json(order);
  });*/
});

//TODO
/* COMPLETE Order */
router.patch("/complete", auth, function(req, res, next) {
  // Check permissions
  if (!req.user.admin) return res.status(401).end();

  models.Order.update({ status: req.body.status }, {where: {id: req.body.id}})
  .catch(err => {
    return next(err);
  }).then(() => {
        models.Order.findOne({ attributes: ['id', 'amountOfWaffles', 'desiredOrderTime', 'comment', 'UserId'], where: {id: req.body.id}})
        .catch(err => {
          return next(err);
        }).then(function(order) {
          if(!order) {
            return next(new Error("not found " + req.body.id));
          } else {
            return res.json(order)
          }
        });
      });
})

//TODO
/* UPDATE order */
router.patch("/patch", auth, function(req, res, next) {
  models.Order.update({ amountOfWaffles: req.body.amountOfWaffles, 
    desiredOrderTime: req.body.desiredOrderTime, 
    comment: req.body.comment}, {where: {id: req.body.id}})
    .catch(err => {
      return next(err);
    }).then(() => {
          models.Order.findOne({ attributes: ['id', 'amountOfWaffles', 'desiredOrderTime', 'comment', 'UserId'], where: {id: req.body.id}})
          .catch(err => {
            return next(err);
          }).then(function(order) {
            if(!order) {
              return next(new Error("not found " + req.body.id));
            } else {
              return res.json(order)
            }
          });
        });
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