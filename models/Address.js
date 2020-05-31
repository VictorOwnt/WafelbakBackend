/**
 * @swagger
 *  components:
 *      schemas: 
 *          Address:
 *              type: object
 *              required:
 *                  - streetNumber
 *                  - Street
 *              properties:
 *                  streetNumber: 
 *                      type: integer
 *                      description: The street number of the address.
 *                  streetExtra: 
 *                      type: string
 *                      nullable: true
 *                      description: Additional elements to the street number of the address.
 *                  Street: 
 *                      $ref: '#/components/schemas/StreetFromAddress'
 *                      description: The street of the address.
 */
module.exports = (sequelize, DataTypes) => {
    var Address = sequelize.define('Address', {
        streetNumber: {type: DataTypes.INTEGER, allowNull: false},
        streetExtra: {type: DataTypes.STRING}
    });

    Address.associate = function(models) {
        models.Address.belongsTo(models.Street);
      };
    return Address;
};