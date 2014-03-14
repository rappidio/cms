module.exports = function (app, context, config) {

    var strip = /^(.+)\/$/;

    app.use(function (req, res, next) {
        var r = strip.exec(req.url);
        if (r) {
            res.redirect(r[1], 301);
        }

        next();
    });

};