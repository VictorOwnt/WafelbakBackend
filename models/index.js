const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

//switch uncommented/commented for envrionment switch
var sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: `/cloudsql/${process.env.DATABASE_SERVER}`, // process.env.DATABASE_SERVER 
  // port should be in comments for production
  // port: '3306',
  dialect: process.env.DATABASE_DIALECT,
  dialectOptions: {
    // ssl should be in comments for production
    socketPath: `/cloudsql/${process.env.DATABASE_SERVER}`
    /*ssl: {
      key: cKey,
      cert: cCert,
      ca: cCA,
    }*/
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


Object.keys(db).forEach(function (modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

