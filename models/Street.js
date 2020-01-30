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