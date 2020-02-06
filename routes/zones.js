var express = require('express');
var router = express.Router();
var models  = require('../models');
let jwt = require('express-jwt');

let auth = jwt({ secret: process.env.WAFELBAK_BACKEND_SECRET });

/* GET zones listing. */
router.get("/", auth, function(req, res, next) {
    // Check permissions
    if (req.user.role != "admin") return res.status(401).end();
    models.Zone.findAll({attributes: ['id', 'zoneName']})
    .catch(err => {
      return next(err);
    }).then(function(zones) {
      res.json(zones)
    }); 
});

/* GET zone by id. */ //TODO authenticatie?
router.param("zoneId", function(req, res, next, id) {
    models.Zone.findOne({attributes: ['id', 'zoneName'], where: {id: id}})
      .catch(err => {
        return next(err);
      }).then(function(zone) {
        if(!zone) {
          return next(new Error("not found " + id));
        } else {
          req.receivedZone = zone;
          return next();
        }
      });
    });
router.get("/id/:zoneId", auth, function(req, res, next) {
      res.json(req.receivedZone);
});

//TODO evt get zone by name, allhoewel er niet zoveel zijn dus weet niet of nodig

/* CREATE zone */
router.post("/create", auth, function(req, res, next) {
    if (req.user.role != "admin") return res.status(401).end();
    
    if (!req.body.zoneName)
        return res.status(400).send("Gelieve alle noodzakelijke velden in te vullen.");
    
    //Creating Zone
    let zone = models.Zone.build({
        zoneName: req.body.zoneName
    });

    zone.save().catch(err => {
        return next(err);
    }).then(() => {
        return res.json(zone);
    })
});

/* DELETE zone */
router.param("dZoneId", function(req, res, next, id) {
    models.Zone.destroy({where: {id: id}})
    .catch(err => {
      return next(err);
    }).then(() => {
      //TODO weergeven van zone die verwijderd werd of skip?
        return next();
      });
  });
  router.delete("/delete/:dZoneId", auth, function (req, res, next) {
    if (req.user.role != "admin") return res.status(401).end();
      res.json(true);
  });


module.exports = router;