let crypto = require('crypto');
let jwt = require('jsonwebtoken');

module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('User', {
        firstName: {type: DataTypes.STRING, allowNull: false},
        lastName: {type: DataTypes.STRING, allowNull: false},
        email: {type: DataTypes.STRING, allowNull: false, unique: true},
        birthday: {type: DataTypes.DATE, allowNull: false},
        admin: {type: DataTypes.BOOLEAN, defaultValue: false},
        address: {
            street: {type: DataTypes.STRING, allowNull: false},
            streetNumber: {type: DataTypes.INTEGER, allowNull: false},
            streetExtra: {type: DataTypes.STRING},
            postalCode: {type: DataTypes.STRING, allowNull: false},
            city: {type: DataTypes.STRING, allowNull: false}
        },
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
                birthday: this.birthday,
                admin: this.admin,
                //picture: this.picture,
                address: this.address,
                exp: exp.getTime() / 1000
            },
            process.env.WAFELBAK_BACKEND_SECRET
        );
    };
  
    /* Voor mapping i guess
    User.associate = function(models) {
      models.User.hasMany(models.Task);
    };*/
  
    return User;
  };