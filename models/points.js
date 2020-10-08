/**
 * Очаги туберкулеза
 */

var Sequelize = require('sequelize');

var Points = db.define('points', {
    fio: Sequelize.STRING,
    address: Sequelize.STRING,
    coords: Sequelize.GEOMETRY,
    comment: Sequelize.TEXT,
    district_id: Sequelize.INTEGER,
    created_by: Sequelize.INTEGER,
    updated_by: Sequelize.INTEGER,
    tubform: Sequelize.ENUM('BK-', 'BK+')
});

 module.exports = Points;