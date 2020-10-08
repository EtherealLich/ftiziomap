var express = require('express');
var router = express.Router();
var auth = require('../middleware/checkAuth');

var mapController = require('../controllers/map');
var userController = require('../controllers/user');

// Cтраница логина
router.get('/', userController.actionIndex);

// Вход
router.post('/login', userController.actionLogin);
// Выход
router.post('/logout', auth.checkAuth, userController.actionLogout);

// Общая страница карты
router.get('/map', auth.checkAuth, mapController.actionIndex);
// Переключение вида карты
router.get('/map/view/:view', auth.checkAuth, mapController.actionSetView);

// Установка фильтров
router.get('/map/setFilter', auth.checkAuth, mapController.actionSetFilter);
// Сброс фильтров
router.get('/map/resetFilter', auth.checkAuth, mapController.actionResetFilter);

// Получение очагов
router.get('/points', auth.checkAuth, mapController.actionGetPoints);
// Добавление очага
router.post('/points', auth.checkAuthEditor, mapController.actionAddPoint);
// Удаление очага
router.delete('/points/:id', auth.checkAuthEditor, mapController.actionDeletePoint);
//Редактирование очага
router.put('/points/:id', auth.checkAuthEditor, mapController.actionEditPoint);

// Список пользователей
router.get('/users', auth.checkAuthAdmin, userController.actionGetUserList);
// Добавление пользователя
router.post('/users', auth.checkAuthAdmin, userController.actionAddUser);
// Получение данных пользователя для редактирования
router.get('/users/:id', auth.checkAuthAdmin, userController.actionGetUser);
// Удаление пользователя
router.delete('/users/:id', auth.checkAuthAdmin, userController.actionDeleteUser);
// Редактирование пользователя
router.put('/users/:id', auth.checkAuthAdmin, userController.actionEditUser);

// Загрузка списка очагов
router.get('/points_report', auth.checkAuth, mapController.actionDownloadPointsReport);

module.exports = router;
