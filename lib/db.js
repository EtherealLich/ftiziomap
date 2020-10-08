var Sequelize = require('sequelize');

var db = new Sequelize(db_config.database, db_config.user, db_config.password, {
    host: db_config.host,
    port: db_config.port,
    dialect: db_config.dialect,
    protocol: db_config.protocol || null,
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    define: {
        timestamps: true // true by default
    },
    logging: true
})

module.exports = db;

