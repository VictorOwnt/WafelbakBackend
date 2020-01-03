var express = require('express');
var router = express.Router();
var models  = require('../models');
let jwt = require('express-jwt');


let auth = jwt({ secret: process.env.WAFELBAK_BACKEND_SECRET });

/* GET orders listing. */       //TODO enkel orders voor bepaald jaar?
router.get("/", auth, function(req, res, next) {
    // Check permissions
    if (!req.user.admin) return res.status(401).end();
  
    models.Order.findAll({ attributes: ['id', 'amountOfWaffles', 'desiredDeliveryTime', 'comment', 'UserId']})
    .catch(err => {
      return next(err);
    }).then(function(orders) {
      res.json(orders)
    }); 
  });

/* GET order by id. */ //TODO authenticatie?
router.param("orderId", function(req, res, next, id) {
    models.Order.findOne({ attributes: ['id', 'amountOfWaffles', 'desiredDeliveryTime', 'comment', 'UserId'], where: {id: id}})
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

/* GET orders by userid. */ //TODO authenticatie?
router.param("userid", function(req, res, next, userid) {
    models.Order.findAll({ attributes: ['id', 'amountOfWaffles', 'desiredDeliveryTime', 'comment', 'UserId'], where: {Userid: userid}})
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

/* GET orders & users Joined.*/
router.get("/joined", auth, function(req, res, next){
  // Check permissions
  if (!req.user.admin) return res.status(401).end();

  models.User.findAll({ include: {model: models.Order}, attributes: ['Orders.id', 'Orders.amountOfWaffles', 'Orders.desiredDeliveryTime', 'Orders.comment', 'Orders.UserId',
  'firstName', 'lastName','street', 'streetNumber', 'streetExtra', 'postalCode', 'city']})
    .catch(err => {
      return next(err);
    }).then(function(query) {
      return res.json(query)
    })
});

/* GET orders by UserEmail. */ //TODO authenticatie?
router.param("email", function(req, res, next, email) {
    models.User.findAll({ include: {model: models.Order}, attributes: ['Orders.id', 'Orders.amountOfWaffles', 'Orders.desiredDeliveryTime', 'Orders.comment', 'Orders.UserId'], where: {email: email}})
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

/* POST create Order. */
router.post("/create", auth, function(req, res, next) {
    // Check if all required fields are filled in
  if (!req.body.amountOfWaffles || /*!req.body.dateOrdered ||*/ !req.body.desiredDeliveryTime || !req.body.userid)
    return res.status(400).send("Gelieve alle noodzakelijke velden in te vullen."); // TODO - i18n

  let order = models.Order.build({
    amountOfWaffles: req.body.amountOfWaffles,
    desiredDeliveryTime: req.body.desiredDeliveryTime.trim(),
    comment: req.body.comment
  });
  models.User.findOne({where: {id: req.body.userid}}).catch(err => {
      return next(err);
  }).then(function(user) {
    order.save().catch(err => {
        return next(err);
    }).then(() => {
        user.addOrder(order).catch(err => {
            return next(err);
        }).then(() => {
            return res.json(order);
        });
    });
  });
});

/* UPDATE order */
router.patch("/patch", auth, function(req, res, next) {
  models.Order.update({ amountOfWaffles: req.body.amountOfWaffles, 
    desiredDeliveryTime: req.body.desiredDeliveryTime, 
    comment: req.body.comment}, {where: {id: req.body.id}})
    .catch(err => {
      return next(err);
    }).then(() => {
          models.Order.findOne({ attributes: ['id', 'amountOfWaffles', 'desiredDeliveryTime', 'comment', 'UserId'], where: {id: req.body.id}})
          .catch(err => {
            return next(err);
          }).then(function(order) {
            if(!order) {
              return next(new Error("not found " + id));
            } else {
              return res.json(order)
            }
          });
        });
});

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