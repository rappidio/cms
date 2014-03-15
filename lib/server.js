var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    cms = require('./cms'),
    Context = require('./context');

module.exports = function (sites) {

    var srv = express();

    sites.forEach(function (baseUri) {
        baseUri = path.resolve(baseUri);

        var config = {},
            configPath = path.join(baseUri, "config.json");

        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath));
        }

        config.baseUri = baseUri;
        config.meta = config.meta || {};

        var app = express();

        var context = new Context(),
            handlers = {};

        config.handlers = handlers;

        app.use(function (req, res, next) {
            req.context = context;
            context.path = req.url;
            context.req = req;
            context.res = res;
            context.config = config;

            next();
        });

        // register handlers
        [path.join(__dirname, "handler"), path.join(baseUri, "handler")]
            .forEach(function (handlerPath) {

                fs.readdirSync(handlerPath).forEach(function (handler) {
                    handler = path.resolve(path.join(handlerPath, handler));

                    if (!/\.js$/i.test(handler)) {
                        console.warn("'" + handler + "' is not a handler");
                        return;
                    }

                    // pass app to custom handler
                    var handlerFunction = require(handler),
                        extension = handlerFunction.extension;

                    if (!extension) {
                        console.warn("No extension defined for handler '" + handler + "' ");
                        return;
                    }

                    handlers[extension] = handlerFunction;

                });

            });

        [path.join(__dirname, "middleware"), path.join(baseUri, "middleware")]
            .forEach(function (middlewarePath) {
                fs.readdirSync(middlewarePath).forEach(function (middleware) {

                    middleware = path.resolve(path.join(middlewarePath, middleware));

                    if (!/\.js$/i.test(middleware)) {
                        console.warn("'" + middleware + "' is not a valid middleware");
                        return;
                    }

                    // pass app to custom middleware
                    require(middleware)(app, context, config);
                });
            });

        var documentRoot = path.join(baseUri, "public");

        app.use(express.static(documentRoot));

        cms(app, context, config);

        if (config.domains && config.domains.length) {
            config.domains.forEach(function (domain) {
                srv.use(express.vhost(domain, app));
            });
        } else {
            srv.use(app);
        }

    });

    return srv;

};