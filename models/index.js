var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(__filename);
var db = {};

// SQL Server (online)
var sequelize = new Sequelize(process.env.WAFELBAK_DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_SERVER,
  dialect: process.env.DATABASE_DIALECT,
  dialectOptions: {
      options: {
          encrypt: true,
          requestTimeout: 30000
      }
  }
});

// Models
fs.readdirSync(__dirname).filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });


Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

