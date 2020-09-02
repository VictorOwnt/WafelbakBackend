var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
let options = {
  swaggerDefinition: {
    openapi: "3.0.1",
    info: {
      title: 'Wafelbak API', // Title (required)
      version: '1.1.3', // Version (required)
      description: 'The offical documentation of the Wafelbak API.',
    },
    servers: [
      {
        url: "https://wafelbak-api-p4tlzt4yxq-ew.a.run.app",
        description: "Production server"
      },
      {
        url: "http://localhost:3000",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The name of the error.'
                },
                message: {
                  type: 'string',
                  description: 'The message of the error.'
                },
                code: {
                  type: 'string',
                  description: 'The code of the error.'
                },
                status: {
                  type: 'integer',
                  description: 'The status of the error.'
                },
                inner: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      description: 'Inner message of the error.'
                    }
                  }
                }
              }
            }
          }
        }
      },
    },
    security: [
      {
        bearerAuth: []
      }
    ],
  },
  // Path to the API docs
  apis: ['./routes/*.js', './models/*.js'],
};
const swaggerSpec = swaggerJSDoc(options);

// Environment variables
require('dotenv').config();

// Passport
require('./config/passport');

// Routes
var usersRouter = require('./routes/users');
var ordersRouter = require('./routes/orders');
var streetsRouter = require('./routes/streets');
var zonesRouter = require('./routes/zones');

var app = express();

// Swagger endpoint
app.use('/API/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Home page redirect to swagger
app.get('/', (req, res) => {
  res.redirect('/API/docs');
});

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
app.use('/API/orders', ordersRouter);
app.use('/API/streets', streetsRouter);
app.use('/API/zones', zonesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err });
});

module.exports = app;
