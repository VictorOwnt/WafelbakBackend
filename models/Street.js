module.exports = (sequelize, DataTypes) => {
    var Street = sequelize.define('Street', {
        streetName: {type: DataTypes.STRING, allowNull: false}
    });

    Street.associate = function(models) {
        // Haal hieronder uit commentaar indien two way nodig
        // models.Street.belongsTo(models.Address);
        //TODO models.Street.belongsTo(models.City);
        models.Street.belongsTo(models.Zone);
      };
    return Street;
};