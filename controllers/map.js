var Points = require('../models/points');
var views = require('../config/views');
var map_defaults = require('../config/map');
var async = require('async');

var mapController = {}

// Карта
mapController.actionIndex = function(req, res, next) {
    var Districts = require('../models/districts');
    Districts.findAll()
    .then(function(districts) {
        res.render('map', {
            user: JSON.stringify(req.session.user),
            views: views,
            view: req.session.view || 'cluster',
            map: {
                lat: req.session.lat || map_defaults.lat,
                lng: req.session.lng || map_defaults.lng,
                zoom: req.session.zoom || map_defaults.zoom
            },
            districts: districts,
            filter: req.session.filter
        });
    });
}

// Получение очагов
mapController.actionGetPoints = function(req, res, next) {
    var conditions = {
        where: {}
    };
    if (req.session.filter && req.session.filter.districts) {
        conditions.where.district_id =req.session.filter.districts;
    }

    if (req.query.from_x && req.query.to_x) {
        var Sequelize = require('sequelize');
        conditions.where.range_x =
            Sequelize.where(
                Sequelize.fn('y', Sequelize.col('coords')),
                {
                  $between: [req.query.from_x, req.query.to_x]
                }
            );
    }
    if (req.query.from_y && req.query.to_y) {
        conditions.where.range_y =
            Sequelize.where(
                Sequelize.fn('x', Sequelize.col('coords')),
                {
                  $between: [req.query.from_y, req.query.to_y]
                }
            );
    }
    Points.findAll(conditions).then(function(points) {
      res.send(points);
    });
}

// Добавление очага
mapController.actionAddPoint = function(req, res, next) {
    if (req.body.address && req.body.lat && req.body.lng) {
        async.waterfall([
            function(callback) {
                if (req.body.district_id) {
                    var Districts = require('../models/districts');
                    Districts.findOne({
                        where:{
                            external_id: req.body.district_id
                        }
                    }).then(function(district){
                        callback(null, district ? district.id : null);
                    });
                } else {
                    callback(null, null)
                }
            },
            function(district_id, callback) {
                console.log(req.session.user);
                Points.create({
                    fio: '',
                    address: req.body.address,
                    coords: { type: 'Point', coordinates: [req.body.lat, req.body.lng], crs: { type: 'name', properties: { name: 'EPSG:4326'} }},
                    fio: req.body.fio,
                    comment: req.body.comment,
                    district_id: district_id,
                    tubform: req.body.tubform,
                    created_by: req.session.user.id
                })
                .then(function(point){
                    res.send({success: true, id: point.id});
                });
            }
        ]);
    } else {
        res.status(500).send({success: false});
    }
}

// Удаление очага
mapController.actionDeletePoint = function(req, res, next) {
    if (req.params.id) {
        Points.findById(req.params.id).then(function(point) {
            point.destroy({ force: true })
            .then(function(){
                res.send({success: true});
            });
        });
    } else {
        res.status(500).send({success: false});
    }
}

// Переключение режима просмотра
mapController.actionSetView = function(req, res, next) {
    if (req.params.view && views[req.params.view]) {
        req.session.view = req.params.view;
        req.session.lat = req.query.lat;
        req.session.lng = req.query.lng;
        req.session.zoom = req.query.zoom;
        res.send({success: true});
    } else {
        res.status(500).send({success: false});
    }
}

// Редактирование очага
mapController.actionEditPoint = function(req, res, next) {
    if (req.params.id) {
        Points.findById(req.params.id).then(function(point) {
            point.address = req.body.address;
            point.fio = req.body.fio;
            point.comment = req.body.comment;
            point.district_id = req.body.district_id;
            point.tubform = req.body.tubform;
            point.save()
            .then(function(){
                res.send({success: true});
            });
        });
    } else {
        res.status(500).send({success: false});
    }
}

// Установка фильтров
mapController.actionSetFilter = function(req, res, next) {
    if (req.query.districts) {
        req.session.filter = {districts: req.query.districts};
        res.send({success: true});
    } else {
        res.status(500).send({success: false});
    }
}

// Сброс фильтров
mapController.actionResetFilter = function(req, res, next) {
    req.session.filter = null
    res.send({success: true});
}

mapController.actionDownloadPointsReport = function(req, res, next) {
    var conditions = {
        where: {}
    };
    if (req.query.from_x && req.query.to_x) {
        var Sequelize = require('sequelize');
        conditions.where.range_x =
            Sequelize.where(
                Sequelize.fn('y', Sequelize.col('coords')),
                {
                  $between: [req.query.from_x, req.query.to_x]
                }
            );
    }
    if (req.query.from_y && req.query.to_y) {
        conditions.where.range_y =
            Sequelize.where(
                Sequelize.fn('x', Sequelize.col('coords')),
                {
                  $between: [req.query.from_y, req.query.to_y]
                }
            );
    }

    Points.findAll(conditions).then(function(points) {
        var csv = '"ФИО";"Адрес";"Комментарии";"Форма;"' + '\r\n';
        points.forEach(function(item) {
            csv += '"' + item.fio + '";'
                + '"' + item.address + '";'
                + '"' + (item.comment ? item.comment : '')+ '";'
                + '"' + (item.tubform ? item.tubform : 'БК-') + '";' + '\r\n';
        });
        res.setHeader('Content-Encoding', 'UTF-8');
        res.setHeader('Content-disposition', 'attachment; filename=export.csv');
        res.setHeader('Content-type', 'text/csv');
        res.send(csv);
    });
}

module.exports = mapController;