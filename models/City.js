/**
 * @swagger
 *  components:
 *      schemas: 
 *          City:
 *              type: object
 *              required:
 *                  - cityName
 *                  - postalCode
 *              properties:
 *                  cityName: 
 *                      type: string
 *                      description: The name of the city.
 *                  postalCode: 
 *                      type: integer
 *                      description: The postal code of the city.
 */
module.exports = (sequelize, DataTypes) => {
    var City = sequelize.define('City', {
        cityName: {type: DataTypes.STRING, allowNull: false, unique: true},
        postalCode: {type: DataTypes.INTEGER, allowNull: false}
    });

    return City;
};