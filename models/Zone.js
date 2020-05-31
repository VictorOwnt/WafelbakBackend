/**
 * @swagger
 *  components:
 *      schemas: 
 *          Zone:
 *              type: object
 *              required:
 *                  - zoneName
 *              properties:
 *                  id: 
 *                      type: integer
 *                      readOnly: true
 *                      description: The id of the zone.
 *                  zoneName: 
 *                      type: string
 *                      description: The name of the zone.
 */
module.exports = (sequelize, DataTypes) => {
    var Zone = sequelize.define('Zone', {
        zoneName: {type: DataTypes.STRING, allowNull: false}
    });
    
    return Zone;
};