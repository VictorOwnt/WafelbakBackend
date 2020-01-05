let crypto = require('crypto');
let jwt = require('jsonwebtoken');

module.exports = (sequelize, DataTypes) => {
    var Order = sequelize.define('Order', {
        amountOfWaffles: {type: DataTypes.INTEGER, allowNull: false},
        // dateOrdered: {type: DataTypes.DATE, allowNull: false},
        desiredDeliveryTime: {type: DataTypes.STRING, allowNull: false},
        comment: {type: DataTypes.STRING},
        status: {type: DataTypes.STRING, defaultValue:"Te Bezorgen"}
    });

    Order.associate = function(models) {
        models.Order.belongsTo(models.User);
      };
    return Order;
};