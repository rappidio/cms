var flow = require("flow.js").flow,
    fs = require("fs"),
    path = require("path"),
    crypto = require('crypto'),
    moment = require('moment');

var mod = module.exports = function (app, config) {

    var styleCache = {},
        styleUrlMatcher = /^\/style\/([^/]+).css(?:\?([^=]+))?/,
        reloadCss = (config.environment["reloadCss"] === true);

    app.use(function (req, res, next) {

        if (req.method === "GET" || req.method === "HEAD") {
            var match = styleUrlMatcher.exec(req.url);

            if (match) {
                var styleName = match[1],
                    hash = match[2],
                    cache = styleCache,
                    isDevelop = hash === "develop";

                if (isDevelop) {
                    // do not cache
                    cache = {};
                }

                mod.getStyle(styleName, hash, cache, config.baseUri, function (err, style) {

                    if (isDevelop) {
                        // do not cache
                        res.set({
                            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                            'Expires': '-1',
                            'Pragma': 'no-cache'
                        });

                    } else if (style.hash === hash) {
                        // same as requested
                        // TODO: set cache headers
                    }

                    res.set({
                        "Last-Modified": style.date,
                        "Content-Type": "text/css"
                    });

                    if (err) {
                        res.send(500);
                    } else {
                        res.send(200, style.css);
                    }

                });

            } else {
                next();
            }

        } else {
            next();
        }

    });

    app.get("/lib/cssrefresh.js", function (req, res) {
        res.noFilter = true;
        res.sendfile(path.join(__dirname + "/../asset/cssrefresh.js"));
    });

    return function (meta, document, context, callback) {

        var style = meta.style;

        if (!style) {
            callback();
            return;
        }

        // we can handle multiple styles
        if (!(style instanceof Array)) {
            style = [style];
        }

        var styles = [style[0]];
        // remove duplicates
        for (var i = 1; i < style.length; i++) {
            if (styles.indexOf(style[i]) === -1) {
                styles.push(style[i]);
            }
        }

        var usedStyles = {};

        // TODO: use par each, but than we need to make sure the order is still correct
        flow()
            .parEach(styles, function (styleName, cb) {
                mod.getStyle(styleName, null, styleCache, config.baseUri, function(err, style) {

                    usedStyles[styleName] = style;
                    cb(err);

                });
            })
            .seq(function () {

                var head = document.getElementsByTagName("head")[0];

                styles.reverse().forEach(function (styleName) {
                    var styleEntry = usedStyles[styleName],
                        node = document.createElement("link");

                    node.setAttribute("href", "/style/" + styleName + ".css?" + styleEntry.hash);
                    node.setAttribute("rel", "stylesheet");

                    head.insertBefore(node, head.firstChild);
                });

            })
            .seq(function () {
                if (reloadCss) {
                    // embed the reloading script
                    var body = document.body || document.getElementsByTagName("body")[0],
                        node = document.createElement("script");

                    node.setAttribute("src", "/lib/cssrefresh.js");
                    node.setAttribute("async", "async");
                    node.setAttribute("type", "text/javascript");
                    node.textContent = " ";


                    body && body.appendChild(node);
                }
            })
            .exec(function (err) {
                callback(err);
            });

    };
};

mod.getStyle = function (styleName, hash, styleCache, baseUri, callback) {

    var styleEntry = styleCache[styleName + "_" + (hash || "")];
    if (styleEntry) {
        callback && callback(null, styleEntry);
        return;
    }

    flow()
        .seq("info", function (cb) {
            mod.getStylePath(styleName, baseUri, cb);
        })
        .seq("css", function (cb) {
            var style = this.vars.info;
            mod.getCss[style.type](style.path, cb);
        })
        .seq("hash", function () {

            // create a hash of the css
            var hash = crypto.createHash("sha1");
            hash.setEncoding("hex");
            hash.write(this.vars.css);
            hash.end();

            return hash.read();
        })
        .seq("date", function() {
            return moment().format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
        })
        .seq(function() {
            styleCache[styleName + "_" + this.vars.hash] = this.vars;
        })
        .exec(callback);
};

mod.getStylePath = function (style, baseUri, callback) {

    var ret = null;

    flow()
        .seqEach(["scss", "css"], function (extension, cb) {

            var file = path.join(baseUri, extension, style + "." + extension);

            fs.exists(file, function (exists) {
                if (exists) {
                    ret = {
                        type: extension,
                        path: file
                    };
                    cb.end();
                } else {
                    cb();
                }
            });
        })
        .exec(function (err) {
            if (!err && ret) {
                callback(null, ret);
            } else {
                callback(err || new Error("No style found for '" + style + "'"));
            }
        });
};

mod.getCss = {
    scss: function (path, cb) {
        var sass = require("node-sass");
        sass.render({
            file: path,
            success: function (css) {
                cb(null, css);
            },
            error: cb
        })

    },
    css: function (path, cb) {
        fs.readFile(path, "utf8", cb);
    }
};

mod.metaKey = "style";