module.exports = function(req, res, next) {
    /*req.session.user = {
        name: 'Администратор',
        roles: ['admin', 'editor', 'viewer']
    };*/
    next();
}