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