module.exports = (sequelize, DataTypes) => {
    var Zone = sequelize.define('Zone', {
        zoneName: {type: DataTypes.STRING, allowNull: false}
    });
    
    return Zone;
};