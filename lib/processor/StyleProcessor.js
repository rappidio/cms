var flow = require("flow.js").flow,
    fs = require("fs"),
    path = require("path"),
    crypto = require('crypto');

var mod = module.exports = function(app, config) {

    var styleCache = {};

    app.use(function(req, res, next) {
        next();
    });

    return function(meta, document, context, callback) {

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

        var styleResults = {};

        // TODO: use par each, but than we need to make sure the order is still correct
        flow()
            .parEach(styles, function(styleName, cb) {

                var styleEntry = styleCache[styleName];
                if (styleEntry) {
                    styleResults[styleName] = styleEntry;
                    cb();
                } else {

                    flow()
                        .seq("info", function (cb) {
                            mod.getStylePath(styleName, config.baseUri, cb);
                        })
                        .seq("css", function (cb) {
                            var style = this.vars.info;
                            mod.getCss[style.type](style.path, cb);
                        })
                        .seq("hash", function () {
                            // TODO: live vs. dev mode

                            // create a hash of the css
                            var hash = crypto.createHash("sha1");
                            hash.setEncoding("hex");
                            hash.write(this.vars.css);
                            hash.end();

                            return hash.read();
                        })
                        .exec(function (err, results) {
                            if (err) {
                                cb(err);
                            } else {
                                styleCache[styleName] = results;
                                styleResults[styleName] = results;

                                cb();
                            }
                        });
                }
            })
            .seq(function() {

                var head = document.getElementsByTagName("head")[0];

                styles.reverse().forEach(function(styleName) {
                    var styleEntry = styleResults[styleName],
                        node = document.createElement("link");

                    node.setAttribute("src", "/style/" + style + "_" + styleEntry.hash + ".css");
                    node.setAttribute("rel", "stylesheet");

                    head.insertBefore(node, head.firstChild);
                });

            })
            .exec(function(err) {
                callback(err);
            });

    };
};

mod.getStylePath = function(style, baseUri, callback) {

    var ret = null;

    flow()
        .seqEach(["scss", "css"], function(extension, cb) {

            var file = path.join(baseUri, extension, style + "." + extension);

            fs.exists(file, function(exists) {
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
        .exec(function(err) {
            if (!err && ret) {
                callback(null, ret);
            } else {
                callback(err || new Error("No style found for '"+ style + "'"));
            }
        });
};

mod.getCss = {
    scss: function(path, cb) {
        var sass = require("node-sass");
        sass.render({
            file: path,
            success: function(css) {
                cb(null, css);
            },
            error: cb
        })

    },
    css: function(path, cb) {
        fs.readFile(path, "utf8", cb);
    }
};

mod.metaKey = "style";