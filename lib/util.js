var fs = require("fs"),
    path = require("path"),
    pathMapper = require("./pathMapper"),
    metaDataParser = require("./helper/metaDataParser"),
    _ = require('underscore');


var exports = module.exports;

var getContent = exports.getContent = function (pagePath, context, callback) {
    var paths = pathMapper(pagePath, context, _.keys(context.config.handlers)),
        file;

    for (var i = 0; i < paths.length; i++) {
        file = path.join(context.config.baseUri, "content", paths[i]);
        if (fs.existsSync(file)) {
            callback && callback(null, fs.readFileSync(file, "utf8"));
            return;
        }
    }

    callback && callback("PAGE_NOT_FOUND");
};

var getPage = exports.getPage = function (pagePath, context, callback) {

    getContent(pagePath, context, function (err, content) {
        try {
            callback && callback(null, metaDataParser(content));
        } catch (e) {
            callback && callback(e);
        }
    });

};

exports.getMetaData = function (pagePath, callback) {

    getPage(pagePath, function (err, page) {
        callback(err, page ? (page.meta || {}) : {});
    });

};

var getContentSync = exports.getContentSync = function (pagePath, context) {
    var paths = pathMapper(pagePath, context, _.keys(context.config.handlers)),
        file;

    for (var i = 0; i < paths.length; i++) {
        file = path.join(context.config.baseUri, "content", paths[i]);
        if (fs.existsSync(file)) {
            return fs.readFileSync(file, "utf8");
        }
    }

    throw new Error("PAGE_NOT_FOUND: " + pagePath);
};

var getPageSync = exports.getPageSync = function (pagePath, context) {
    return metaDataParser(getContentSync(pagePath, context));
};

exports.getMetaDataSync = function (pagePath, context) {
    var ret = getPageSync(pagePath, context);
    return ret ? ret.meta || {} : {};
};
