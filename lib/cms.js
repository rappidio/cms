var fs = require("fs"),
    path = require("path"),
    yaml = require('js-yaml'),
    flow = require("flow.js").flow,
    pathMapper = require("./pathMapper");

var mod = module.exports = function (app, context, config) {

    var cache = {
            pathCache: {},
            fileCache: {}
        },
        extensions = Object.keys(config.handlers),
        extensionStripper = /\.([^.]+)$/;

    app.use(function (req, res, next) {

        var d = Date.now();

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
                var parts = mod.getDocumentParts(this.vars.content),
                    meta = mod.metaDataParser(parts.meta, true);

                return {
                    content: parts.content,
                    meta: meta
                };
            })
            .seq("layout", function (cb) {

                var layout = this.vars.parts.meta.layout || "default",
                    Content = require(__dirname + "/cms/Content");

                Content.createLayout(context, layout, cb);
            })
            .seq("output", function (cb) {
                extensionHandler(this.vars.parts.meta, this.vars.parts.content, context, cb);
            })
            .seq("result", function (cb) {
                var layout = this.vars.layout;

                layout.setContent(this.vars.output);
                layout.applyLayout(cb);

            })
            .seq(function (cb) {

                // TODO: include processors from directory and remove this example processor
                var processors = [
                    // example sass processor
                    {
                        isResponsible: function (parts, context) {
                            return !!parts.meta.sass;
                        },
                        process: function (parts, result, cb) {
                            console.log(parts.meta.sass);
                            cb();
                        }
                    }
                ];
                var self = this;
                flow()
                    .parEach(processors, function (processor, cb) {
                        if (processor.isResponsible(self.vars.parts, context)) {
                            processor.process(self.vars.parts, self.vars.result, cb);
                        } else {
                            cb();
                        }
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

module.exports.getDocumentParts = function (content) {
    var meta = null,
        body = null;

    if (/^---/.test(content)) {
        var tmp = content.split("---");
        tmp.shift();
        meta = tmp.shift();
        body = tmp.join("---");
    } else {
        body = content;
    }

    return {
        meta: meta,
        content: body
    }
};

module.exports.metaDataParser = function (content, justMetaData) {

    var meta = justMetaData ? content : mod.getDocumentParts(content).meta;

    if (meta) {
        return yaml.safeLoad(meta);
    }

    return null;
};

