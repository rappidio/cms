var UglifyJS = require("uglify-js");

module.exports = function(content, callback) {
    callback(null, UglifyJS)
};

module.exports.contentType = "application/javascript";