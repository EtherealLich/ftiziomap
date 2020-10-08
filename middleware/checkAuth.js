exports.checkAuth = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        res.status(403).send('Авторизуйтесь для доступа');
        return;
    }
    next();
}

exports.checkAuthEditor = function(req, res, next) {
    if (!req.session.user || req.session.user.roles.indexOf('editor') == -1) {
        res.redirect('/');
        res.status(403).send('Нет прав на редактирование');
        return;
    }
    next();
}

exports.checkAuthAdmin = function(req, res, next) {
    if (!req.session.user || req.session.user.roles.indexOf('admin') == -1) {
        res.redirect('/');
        res.status(403).send('Нет прав на редактирование');
        return;
    }
    next();
}