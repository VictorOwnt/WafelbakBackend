let crypto = require('crypto');
let jwt = require('jsonwebtoken');

module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('User', {
        firstName: {type: DataTypes.STRING},
        lastName: {type: DataTypes.STRING},
        email: {type: DataTypes.STRING, allowNull: false, unique: true},
        birthday: {type: DataTypes.DATE},
        role: {type: DataTypes.ENUM("admin", "user", "member"), allowNull: false, defaultValue: "user"},
        hash: {type: DataTypes.STRING},
        salt: {type: DataTypes.STRING},
        token: {type: DataTypes.STRING}
    });

    User.prototype.setPassword = function (password) {
        this.salt = crypto.randomBytes(32).toString('hex');
        this.hash = crypto
            .pbkdf2Sync(password, this.salt, 10000, 64, 'sha512')
            .toString('hex');
    };
    
    User.prototype.validPassword = function (password) {
        let hash = crypto
            .pbkdf2Sync(password, this.salt, 10000, 64, 'sha512')
            .toString('hex');
        return this.hash === hash;
    };
    
    User.prototype.generateJWT = function () {
        var today = new Date();
        var exp = new Date(today);
        exp.setDate(today.getDate() + 60);
        return jwt.sign(
            {
                _id: this._id,
                firstName: this.firstName,
                lastName: this.lastName,
                email: this.email,
                role: this.role,
                birthday: this.birthday,
                exp: exp.getTime() / 1000
            },
            process.env.WAFELBAK_BACKEND_SECRET
        );
    };
    
    User.associate = function(models) {
      models.User.hasOne(models.Address);
    };
  
    return User;
  };