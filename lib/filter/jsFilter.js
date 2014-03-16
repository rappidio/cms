var UglifyJS = require("uglify-js");

module.exports = function(content, callback) {
    callback(null, UglifyJS.minify(content, {
        fromString: true
    }).code);
};

module.exports.contentType = "application/javascript";