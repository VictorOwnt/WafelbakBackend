var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Sequelize = require('sequelize');
var passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Environment variables
require('dotenv').config();

// SQL Server (online) || MySQL (local)
var sequelize = new Sequelize(process.env.WAFELBAK_DATABASE || 'mysql://localhos:3306/WafelbakDatabase')
/*var sequelize = new Sequelize('WafelbakDatabase', 'victorvh', '123Victor', { //@wafelbakserver
  host: 'wafelbakserver.database.windows.net:1433',
  dialect: 'mssql',
  dialectOptions: {
      options: {
          encrypt: true,
          requestTimeout: 30000
      }
  }
});*/


// Models
const normalizedPath = require("path").join(__dirname, "models")
require("fs").readdirSync(normalizedPath).forEach(function(file) {
    sequelize.import('./models/' + file)
});

// Passport
require('./config/passport');

// Routes
var usersRouter = require('./routes/users');
// var ordersRouter = require('./routes/orders);

var app = express();

// Swagger endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// cors for cross origin requests
let cors = require('cors');
app.use(cors({ origin: '*' }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

app.use('/API/users', usersRouter);
//app.use('/API/orders', ordersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err });
});

module.exports = app;
