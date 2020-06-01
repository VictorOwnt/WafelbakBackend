const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 *  components:
 *      schemas: 
 *          User:
 *              type: object
 *              required:
 *                  - email
 *                  - role
 *              properties:
 *                  id: 
 *                      type: integer
 *                      readOnly: true
 *                      description: The id of the user.
 *                  firstName: 
 *                      type: string
 *                      nullable: true
 *                      description: The first name of the user.
 *                  lastName: 
 *                      type: string
 *                      nullable: true
 *                      description: The last name of the user.
 *                  email: 
 *                      type: string
 *                      format: email
 *                      description: The email of the user.
 *                  birthday: 
 *                      type: string
 *                      nullable: true
 *                      format: date-time
 *                      description: The birthday of the user.
 *                  role: 
 *                      type: string
 *                      description: The role of the user.
 *                  Address: 
 *                      $ref: '#/components/schemas/Address'
 *                      nullable: true
 *                      description: The address of the user.
 */
module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('User', {
        firstName: { type: DataTypes.STRING },
        lastName: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        birthday: { type: DataTypes.DATE },
        role: { type: DataTypes.ENUM("admin", "user", "member"), allowNull: false, defaultValue: "user" },
        hash: { type: DataTypes.STRING },
        salt: { type: DataTypes.STRING },
        token: { type: DataTypes.STRING }
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
            process.env.WAFELBAK_API_SECRET
        );
    };

    User.associate = function (models) {
        models.User.hasOne(models.Address);
    };

    return User;
};