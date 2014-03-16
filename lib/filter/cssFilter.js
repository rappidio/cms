var cssmin = require("cssmin");

module.exports = function(content, callback) {
    callback(null, cssmin(content));
};

module.exports.contentType = "text/css";