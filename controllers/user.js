var User = require('../models/user.js');
var async = require('async');

var userController = {}

// Страница логина
userController.actionIndex = function(req, res, next) {
    res.render('index');
}

// Вход
userController.actionLogin = function(req, res, next) {
    var login = req.body.login;
    var pass = req.body.pass;

    User.findOne({
        where:{
            login: login
        }
    }).then(function(user) {
        if ( !user || !user.doLogin(pass)) {
            res.status(403).send({
                success: false,
                message: 'Неверный логин или пароль'
            });
            return false;
        }
        req.session.user = {
            id: user.id,
            name: user.name,
            roles: user.roles
        };
        res.send({
            success: true
        });
    });
}

// Выход
userController.actionLogout = function(req, res, next) {
    req.session.destroy();
    res.send({
        success: true
    });
}

// Список пользователей
userController.actionGetUserList = function(req, res, next) {
    User.findAll()
    .then(function(users) {
        res.render('users', {
            users: users
        });
    });
}

// Информация о пользователе
userController.actionGetUser = function(req, res, next) {
    var id = req.params.id;

    User.findOne({
        where:{
            id: id
        }
    })
    .then(function(user) {
        res.send(user);
    });
}

// Добавление пользователя
userController.actionAddUser = function(req, res, next) {
    if (!req.body.userRole) {
        res.send({success: false, msg: "Выберите хотя бы одну роль"});
        return;
    }
    if (req.body.login && req.body.name && req.body.pass && req.body.pass_confirm) {
        User.findOne({
            where:{
                login: req.body.login
            }
        })
        .then(function(user){
            if (user) {
                res.send({success: false, msg: "Пользователь с таким логином уже существует в системе"});
            } else {
                var roles = [].concat(req.body.userRole) || [];
                User.create({
                    login: req.body.login,
                    name: req.body.name,
                    password: req.body.pass,
                    password_confirmation: req.body.pass_confirm,
                    roles: roles
                })
                .then(function(user){
                    res.send({success: true, id: user.id});
                })
                .catch(function(error){
                    res.send({success: false, msg: error.message});
                });
            }
        });
    } else {
        res.send({success: false, msg: "Не заполнено одно из обязательных полей"});
    }
}

// Удаление пользователя
userController.actionDeleteUser = function(req, res, next) {
    if (req.params.id && req.params.id != 1) {
        User.findById(req.params.id).then(function(user) {
            if (user) {
                user.destroy({ force: true })
                .then(function(){
                    res.send({success: true});
                });
            } else {
                res.send({success: false, msg: "Пользователь не найден"});
            }
        });
    } else {
        res.status(200).send({success: false, msg: "Нельзя удалять этого пользователя"});
    }
}

// Редактирование пользователя
userController.actionEditUser = function(req, res, next) {
    if (req.params.id && req.params.id != 1) {
        User.findById(req.params.id).then(function(user) {
            if (user) {
                if (!req.body.userRole) {
                    res.send({success: false, msg: "Выберите хотя бы одну роль"});
                    return;
                }
                user.name = req.body.name;
                if (req.body.pass) {
                    if (!req.body.pass_confirm) {
                        res.send({success: false, msg: "Введите подтверждение пароля для его смены"});
                        return;
                    } else {
                        user.password = req.body.pass;
                        user.password_confirmation = req.body.pass_confirm;
                    }
                }
                user.roles = [].concat(req.body.userRole) || [];

                async.waterfall([
                    function(callback) {
                        if (user.login != req.body.login) {
                            // редактирование пользователя с изменением логина,
                            // проверяем что новый логин еще не существует
                            User.findOne({
                                where: {
                                    login: req.body.login,
                                    id: {
                                      $ne: req.params.id
                                    }
                                }
                            })
                            .then(function(found_user){
                                if (found_user) {
                                    res.send({success: false, msg: "Пользователь с таким логином уже существует в системе"});
                                } else {
                                    user.login = req.body.login;
                                    callback(null);
                                }
                            });
                        } else {
                            callback(null);
                        }
                    },
                    function(callback) {
                        user.save()
                        .then(function(){
                            res.send({success: true});
                        })
                        .catch(function(error){
                            res.send({success: false, msg: error.message});
                        });
                    }
                ]);
            } else {
                res.send({success: false, msg: "Пользователь не найден"});
            }
        });
    } else {
        res.status(200).send({success: false, msg: "Нельзя редактировать этого пользователя"});
    }
}

module.exports = userController