module.exports = function(req, res, next) {
    db
      .authenticate()
      .then(function(err) {
        next();
      })
      .catch(function (err) {
        res.send('Ошибка соединения с базой данных: ' + err.message);
      });
}