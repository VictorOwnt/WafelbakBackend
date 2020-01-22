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