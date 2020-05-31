/**
 * @swagger
 *  components:
 *      schemas: 
 *          StreetFromAddress:
 *              type: object
 *              required:
 *                  - streetName
 *                  - City
 *              properties:
 *                  streetName: 
 *                      type: string
 *                      description: The name of the street.
 *                  City: 
 *                      $ref: '#/components/schemas/City'
 *                      description: The city where the street lies in.
 *          Street:
 *              type: object
 *              required:
 *                  - streetName
 *                  - City
 *              properties:
 *                  id:
 *                      type: integer
 *                      readOnly: true
 *                  streetName:
 *                      type: string
 *                      description: The name of the street.
 *                  City: 
 *                      $ref: '#/components/schemas/City'
 *                      description: The city where the street lies in.
 *                  Zone: 
 *                      $ref: '#/components/schemas/Zone'
 *                      nullable: true
 *                      description: The zone in which the street is placed for wafelbak.      
 */
module.exports = (sequelize, DataTypes) => {
    var Street = sequelize.define('Street', {
        streetName: {type: DataTypes.STRING, allowNull: false, unique: true }
    });

    Street.associate = function(models) {
        models.Street.belongsTo(models.City);
        models.Street.belongsTo(models.Zone);
      };
    return Street;
};