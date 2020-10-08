/**
 * Районы города
 */

var Sequelize = require('sequelize');

var Districts = db.define('districts', {
	name: Sequelize.STRING,
    external_id: Sequelize.BIGINT
});

 module.exports = Districts;