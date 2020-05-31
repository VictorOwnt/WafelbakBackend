/**
 * @swagger
 *  components:
 *      schemas: 
 *          Order:
 *              type: object
 *              required:
 *                  - name
 *                  - amountOfWaffles
 *                  - desiredOrderTime
 *                  - status
 *              properties:
 *                  id:
 *                      type: integer
 *                      readOnly: true
 *                  name:
 *                      type: string
 *                      description: The name the user who made the order.
 *                  amountOfWaffles: 
 *                      type: string
 *                      enum: 
 *                          - "2"
 *                          - "4"
 *                          - "8"
 *                          - "20"
 *                      description: The amount of waffles that where ordered.
 *                  desiredOrderTime: 
 *                      type: string
 *                      enum:
 *                          - "9u-12u"
 *                          - "13u-16u"
 *                          - "16u-18u"
 *                          - "Om het even"
 *                      description: The timeframe in which the user wants their order delivered.
 *                  status:
 *                      type: string    
 *                      enum: 
 *                          - "Te Bezorgen"
 *                          - "Bezorgd"
 *                      description: The status of the order.
 *                  comment:
 *                      type: string
 *                      nullable: true
 *                      description: Remarks or comments on the order.
 *                  Address: 
 *                      $ref: '#/components/schemas/Address'
 *                      description: The address where the order needs to be delivered.
 */
module.exports = (sequelize, DataTypes) => {
    var Order = sequelize.define('Order', {
        name: {type: DataTypes.STRING, allowNull: false},
        amountOfWaffles: {type: DataTypes.ENUM("2","4","8","20"), allowNull: false, defaultValue: "4"},
        desiredOrderTime: {type: DataTypes.ENUM("9u-12u","13u-16u","16u-18u","Om het even"), allowNull: false, defaultValue: "Om het even"},
        status: {type: DataTypes.ENUM("Te Bezorgen", "Bezorgd"), defaultValue:"Te Bezorgen"},
        comment: {type: DataTypes.STRING},
    });

    Order.associate = function(models) {
        models.Order.belongsTo(models.Address);
      };
    return Order;
};