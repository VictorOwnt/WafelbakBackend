module.exports = (sequelize, DataTypes) => {
    var City = sequelize.define('City', {
        cityName: {type: DataTypes.STRING, allowNull: false, unique: true},
        postalCode: {type: DataTypes.INTEGER, allowNull: false}
    });

    return City;
};