module.exports = (sequelize, DataTypes) => {
    var City = sequelize.define('City', {
        cityName: {type: DataTypes.STRING, allowNull: false},
        postalCode: {type: DataTypes.INTEGER, allowNull: false}
    });

    /* TODO
    City.associate = function(models) {
        models.City.hasMany(models.Street);
      };*/
    return City;
};