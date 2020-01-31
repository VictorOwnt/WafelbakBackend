var express = require('express');
var router = express.Router();
var models  = require('../models');
let jwt = require('express-jwt');
var Sequelize = require('sequelize');
var Op = Sequelize.Op;

let auth = jwt({ secret: process.env.WAFELBAK_BACKEND_SECRET });

/* GET street listing. */
router.get("/", auth, function(req, res, next) {
    // Check permissions
    if (req.user.role != "admin") return res.status(401).end();
    models.Street.findAll({ include: [{
      model: models.City,
    attributes: ['cityName', 'postalCode']
  }, {
      model: models.Zone,
    attributes: ['zoneName']
  }], attributes: ['id', 'streetName']})
    .catch(err => {
      return next(err);
    }).then(function(streets) {
      res.json(streets)
    }); 
});

/* GET street by id. */ //TODO authenticatie?
router.param("streetId", function(req, res, next, id) {
  models.Street.findOne({ include: [{
    model: models.City,
  attributes: ['cityName', 'postalCode']
}, {
    model: models.Zone,
  attributes: ['zoneName']
}], attributes: ['id', 'streetName'],
where: {id: id} })
    .catch(err => {
      return next(err);
    }).then(function(street) {
      if(!street) {
        return next(new Error("not found " + id));
      } else {
        req.receivedStreet = street;
        return next();
      }
    });
  });
  router.get("/id/:streetId", auth, function(req, res, next) {
    res.json(req.receivedStreet);
  });

/* GET streets by name. */ //TODO authenticatie?
router.param("name", function(req, res, next, name) {
  models.Street.findAll({ include: [{
    model: models.City,
  attributes: ['cityName', 'postalCode']
}, {
    model: models.Zone,
  attributes: ['zoneName']
}], attributes: ['id', 'streetName'],
where: {streetName: {[Op.like]: '%' + name + '%'}}})
    .catch(err => {
      return next(err);
    }).then(function(streets) {
      if(!streets) {
        return next(new Error("No streets found with name" + name + "."));
      } else {
        req.receivedStreets = streets;
        return next();
      }
    });
});
router.get("/byName/:name", auth, function(req, res, next) {
  res.json(req.receivedStreets);
});


/* GET streets by city. */ //TODO authenticatie?
router.param("cityName", function(req, res, next, cityName) {
  models.Street.findAll({ include: [{
    model: models.City,
  attributes: ['cityName', 'postalCode'],
  where: {cityName: cityName}
}, {
    model: models.Zone,
  attributes: ['zoneName']
}], attributes: ['id', 'streetName']})
    .catch(err => {
      return next(err);
    }).then(function(streets) {
      if(!streets) {
        return next(new Error("No streets found in city:" + cityName + "."));
      } else {
        req.receivedStreets = streets;
        return next();
      }
    });
});
router.get("/byCity/:cityName", auth, function(req, res, next) {  
    res.json(req.receivedStreets);
});

/* GET streets by zone. */ //TODO authenticatie?
router.param("zoneName", function(req, res, next, zoneName) {
  models.Street.findAll({ include: [{
    model: models.City,
  attributes: ['cityName', 'postalCode']
}, {
    model: models.Zone,
  attributes: ['zoneName'],
  where: {zoneName: zoneName}
}], attributes: ['id', 'streetName']})
    .catch(err => {
      return next(err);
    }).then(function(streets) {
      if(!streets) {
        return next(new Error("No streets found in zone:" + zoneName + "."));
      } else {
        req.receivedStreets = streets;
        return next();
      }
    });
});
router.get("/byZone/:zoneName", auth, function(req, res, next) {  
    res.json(req.receivedStreets);
});
 
/* POST create Street. */
router.post("/create", auth, function(req, res, next) {
    // Check if all required fields are filled in
  if (
    !req.body.streetName ||
    !req.body.cityName ||
    !req.body.postalCode )
    return res.status(400).send("Gelieve alle noodzakelijke velden in te vullen.");

   //Creating City
   let city = models.City.build({
    cityName: req.body.cityName,
    postalCode: req.body.postalCode
  });

  function doesCityExist(cityName, postalCode) {
    return models.City.count({where: {cityName: cityName, postalCode: postalCode}}).catch(err => {
      return next(err);
    }).then(count => {
      if(count == 0) {
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
    if(exists) {
      street.save().catch(err => {
        return next(err);
      }).then(() => {
        models.City.findOne({where: {cityName: req.body.cityName}}).catch(err => {
          return next(err);
        }).then(function(city) {
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

//TODO update? is dit noodzakelijk? wel nog nodig ==> toekennen straat aan zone

/* DELETE street */ 
router.param("dStreetId", function(req, res, next, id) {
  models.Street.destroy({where: {id: id}})
  .catch(err => {
    return next(err);
  }).then(() => {
    //TODO weergeven van straat die verwijderd werd of skip?
      return next();
    });
});
router.delete("/delete/:dStreetId", auth, function (req, res, next) {
    res.json(true);
});
  

module.exports = router;