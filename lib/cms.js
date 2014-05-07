var fs = require("fs"),
    path = require("path"),
    flow = require("flow.js").flow,
    metaDataParser = require("./helper/metaDataParser.js"),
    pathMapper = require("./pathMapper");

var mod = module.exports = function (app, context, config) {

    var cache = {
            pathCache: {},
            fileCache: {}
        },
        extensions = Object.keys(config.handlers),
        extensionStripper = /\.([^.]+)$/;

    app.use(function (req, res, next) {

        var pathName = req._parsedUrl.pathname;

        var file = cache.pathCache[context.cacheString()];
        var handleRequest = false;

        if (file) {
            handleRequest = true;
        } else {
            var paths = pathMapper(context.path, context, extensions);

            for (var i = 0; i < paths.length; i++) {
                file = path.join(config.baseUri, "content", paths[i]);
                if (fs.existsSync(file)) {
                    handleRequest = true;
                    break;
                }
            }

            if (handleRequest) {
                cache.pathCache[pathName] = file;
            }
        }

        if (!handleRequest) {
            next();
            return;
        }


        var extension = (extensionStripper.exec(file) || [])[1],
            extensionHandler = config.handlers[extension];

        if (!extensionHandler) {
            throw new Error("No extension handler found for " + extension);
        }

        flow()
            .seq("content", function (cb) {
                fs.readFile(file, "utf8", cb);
            })
            .seq("parts", function () {
                return metaDataParser(this.vars.content);
            })

            .seq("layout", function (cb) {

                var layout = this.vars.parts.meta.layout || "default",
                    Content = require(__dirname + "/cms/Content");

                Content.createLayout(context, layout, cb);
            })
            .seq("meta", function () {
                return this.vars.parts.meta;
            })
            .seq("raw", function (cb) {
                extensionHandler(this.vars.parts.meta, this.vars.parts.content, context, cb);
            })
            .seq("output", function (cb) {

                var paths = pathMapper(context.path, context, ["js"]);
                handleRequest = false;
                for (var i = 0; i < paths.length; i++) {
                    file = path.join(config.baseUri, "content", paths[i]);
                    if (fs.existsSync(file)) {
                        handleRequest = true;
                        break;
                    }
                }
                var output = this.vars.raw;

                if (handleRequest) {
                    flow()
                        .seq("attributes", function (cb) {
                            var handler = require(file);
                            handler(req, res, cb);
                        })
                        .seq("output", function () {
                            var attributes = this.vars.attributes;
                            for (var k in  attributes) {
                                if (attributes.hasOwnProperty(k)) {
                                    output = output.replace("{{" + k + "}}", attributes[k]);
                                }
                            }
                            return output;
                        })
                        .exec(function (err, results) {
                            cb(err, results.output);
                        });
                } else {
                    cb(null, output);
                }


            })
            .seq("result", function (cb) {
                var layout = this.vars.layout;
                this.vars.meta = this.vars.meta || {};

                layout.setContent(this.vars.output);
                // TODO: extend meta data
                layout.applyLayout(this.vars.meta, cb);

            })
            .seq(function (cb) {

                var meta = this.vars.meta,
                    processors = config.processors,
                    document = this.vars.result.document,
                    delegates = [];

                for (var key in meta) {
                    if (meta.hasOwnProperty(key)) {
                        var processor = processors[key];

                        if (processor) {
                            // found a processor for a meta key
                            (function (processor) {
                                delegates.push(function (callback) {
                                    processor(meta, document, context, callback);
                                });
                            })(processor);
                        }
                    }
                }

                flow()
                    .parEach(delegates, function (delegate, cb) {
                        delegate(cb)
                    })
                    .exec(cb);

            })
            .seq(function () {
                this.vars.result.setMetaData(this.vars.parts.meta);
            })
            .exec(function (err, results) {
                if (err) {
                    next(err);
                } else {
                    res.send(results.result.document.toString())
                }
            });

    });

    app.use(function (req, res) {
        res.send(404, "Todo: custom 404 pages");
    });
//
//    app.use(function (error, req, res, next) {
//        res.send(500, "Todo: Custom error pages");
//    });

};


