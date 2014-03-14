module.exports = function (app, context, config) {

    app.use(function (req, res, next) {

        if (config.noCache) {
            res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            res.header('Expires', '-1');
            res.header('Pragma', 'no-cache');
        }

        next();
    });
};