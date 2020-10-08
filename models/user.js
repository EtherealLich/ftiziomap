/**
 * Пользователи в системе
 */

var Sequelize = require('sequelize');
var bcrypt = require('bcrypt-nodejs');
var JsonField = require('sequelize-json');

var roles = require('../config/user_roles');

var User = db.define('users', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1,200]
        }
    },
    login: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1,50]
        }
    },
    password_digest: {
        type: Sequelize.STRING,
        validate: {
            notEmpty: true
        }
    },
    password: {
        type: Sequelize.VIRTUAL,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    password_confirmation: {
        type: Sequelize.VIRTUAL
    },
    roles: JsonField(db, 'User', 'roles'),
    last_login: {
        type: Sequelize.TIME
    }
}, {
    freezeTableName: true,
    indexes: [{unique: true, fields: ['login']}],
    instanceMethods: {
        authenticate: function(value) {
            if (bcrypt.compareSync(value, this.password_digest))
                return this;
            else
                return false;
        },
        getRoles: function() {
            var res = [];
            for (var i = 0; i < this.roles.length; i++) {
                res.push(roles[this.roles[i]]);
            }
            return res;
        },
        doLogin: function(pass) {
            if (this.authenticate(pass)) {
                this.updateAttributes({last_login: db.fn('NOW')});

                return true;
            } else {
                return false;
            }
        },
        hasRole: function(role) {
            return this.roles.indexOf(role) != -1;
        }
    }
});

var hasSecurePassword = function(user, options, callback) {
    if (user.password != user.password_confirmation) {
        throw new Error("Подтверждение пароля не совпадает с паролем");
    }
    bcrypt.hash(user.get('password'), null, null, function(err, hash) {
        if (err) return callback(err);
        user.set('password_digest', hash);
        return callback(null, options);
    });
};

User.beforeCreate(function(user, options, callback) {
    if (user.password)
        hasSecurePassword(user, options, callback);
    else
        return callback(null, options);
})

User.beforeUpdate(function(user, options, callback) {
    if (user.password)
        hasSecurePassword(user, options, callback);
    else
        return callback(null, options);
})

module.exports = User;