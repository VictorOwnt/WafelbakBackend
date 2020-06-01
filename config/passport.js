const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const models = require('../models');

passport.use(
    new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, function (email, password, done) {
        models.User.findOne({ where: { email: email } }).catch(err => {
            return done(err);
        }).then(function (user) {
            if (!user) {
                return done(null, false, "Ongeldig emailadres."); // TODO - i18n
            }
            if (!user.validPassword(password)) {
                return done(null, false, "Ongeldig wachtwoord."); // TODO - i18n
            }
            return done(null, user);
        });
    })
);