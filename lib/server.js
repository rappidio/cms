var express = require('express'),
    fs = require('fs'),
    _ = require('underscore'),
    path = require('path'),
    cms = require('./cms'),
    flow = require("flow.js").flow,
    Context = require('./context'),
    undefined;

module.exports = function (sites, options) {

    options = options || {};

    var srv = express();

    sites.forEach(function (baseUri) {
        baseUri = baseUri.replace(/^~\//, process.env.HOME + '/');

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
            handlers = {},
            processors = {},
            controllers = {},
            filters = {},
            environment = {};

        config.handlers = handlers;
        config.processors = processors;
        config.controllers = controllers;
        config.environment = environment;

        app.use(function (req, res, next) {
            req.context = context;
            context.path = req.url;
            context.req = req;
            context.res = res;
            context.config = config;

            next();
        });

        app.use(function (req, res, next) {

            var write = res.write,
                end = res.end,
                writeHead = res.writeHead,
                buf = null,
                filterChain,
                responseEnded = false;

            res.writeHead = function() {

                if (res.noFilter) {
                    writeHead.apply(this, Array.prototype.slice.call(arguments));
                    return;
                }

                //test content-type
                var contentType = (res.getHeader('Content-Type') || "").split(";")[0];

                filterChain = filters[contentType];
                if (filterChain) {
                    res.removeHeader('content-length');
                    buf = [];
                }

                writeHead.apply(this, Array.prototype.slice.call(arguments));

            };

            res.write = function (trunk, encoding) {

                if (res.noFilter) {
                    write.apply(this, Array.prototype.slice.call(arguments));
                    return;
                }

                //send header first
                if (!this._header) {
                    this._implicitHeader();
                }

                if (filterChain) {
                    if (trunk === undefined) {
                        return;
                    }

                    if (typeof trunk == 'string') {
                        trunk = new Buffer(trunk, encoding);
                    }

                    buf.push(trunk);
                } else {
                    write.call(this, trunk, encoding);
                }

            };

            res.end = function (trunk, encoding) {

                if (!this._header) {
                    this._implicitHeader();
                }

                if (!filterChain || res.noFilter) {
                    end.apply(this, Array.prototype.slice.call(arguments));
                    return;
                }

                if (responseEnded) {
                    return;
                }

                var self = this;

                if (trunk !== undefined) {
                    res.write.apply(self, arguments);
                }

                responseEnded = true;

                var buffer = Buffer.concat(buf);

                var content = buffer ? buffer.toString(encoding) : "",
                    originalContent = content;

                flow()
                    .seqEach(filterChain, function (filter, cb) {
                        filter(content, function (err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                content = result;
                                cb();
                            }
                        });
                    })
                    .exec(function (err) {
                        var result = err ? originalContent : content;

                        write.call(self, result, "utf8");
                        end.call(self);
                    });

            };


            next();

        });

        controllers["cms"] = path.join(__dirname, "cms");

        // load environment
        ["default", options.environment]
            .forEach(function(env) {

                if (!env) {
                    return;
                }

                var envPath = path.join(baseUri, "env", env + ".json");
                if (!fs.existsSync(envPath)) {
                    return;
                }

                _.extend(environment, JSON.parse(fs.readFileSync(envPath, "utf8")));

            });

        // register controllers
        [path.join(baseUri, "controller")]
            .forEach(function (controllerPath) {

                if (!fs.existsSync(controllerPath)) {
                    return;
                }

                fs.readdirSync(controllerPath).forEach(function (namespace) {
                    var namespaceDir = path.resolve(path.join(controllerPath, namespace));

                    if (!fs.lstatSync(namespaceDir).isDirectory()) {
                        console.warn("'" + namespaceDir + "' is not a directory");
                        return;
                    }

                    controllers[namespace] = namespaceDir;

                });

            });

        // register handlers
        [path.join(__dirname, "handler"), path.join(baseUri, "handler")]
            .forEach(function (handlerPath) {

                if (!fs.existsSync(handlerPath)) {
                    return;
                }

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

        // register meta processors
        [path.join(__dirname, "processor"), path.join(baseUri, "processor")]
            .forEach(function (processorPath) {

                if (!fs.existsSync(processorPath)) {
                    return;
                }

                fs.readdirSync(processorPath).forEach(function (processor) {
                    processor = path.resolve(path.join(processorPath, processor));

                    // pass app to custom processor
                    var processorFactory = require(processor),
                        metaKey = processorFactory.metaKey;

                    if (!metaKey) {
                        console.warn("No metaKey defined for processor '" + processor + "' ");
                        return;
                    }

                    processors[metaKey] = processorFactory(app, config);

                });

            });

        [path.join(__dirname, "middleware"), path.join(baseUri, "middleware")]
            .forEach(function (middlewarePath) {

                if (!fs.existsSync(middlewarePath)) {
                    return;
                }

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

        // register output filter
        [path.join(__dirname, "filter"), path.join(baseUri, "filter")]
            .forEach(function (filterPath) {

                if (!fs.existsSync(filterPath)) {
                    return;
                }

                fs.readdirSync(filterPath).forEach(function (filter) {
                    filter = path.resolve(path.join(filterPath, filter));

                    // pass app to custom filter
                    var filterFunction = require(filter),
                        contentType = filterFunction.contentType;

                    if (!contentType) {
                        console.warn("No contentType defined for filter '" + filter + "' ");
                        return;
                    }

                    filters[contentType] = filters[contentType] || [];
                    filters[contentType].push(filterFunction);

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

}
;