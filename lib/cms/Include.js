var pathMapper = require(__dirname + "/../pathMapper"),
    Path = require("path"),
    fs = require("fs");

module.exports = function(node, context, callback) {

    var config = context.config,
        baseUri = config.baseUri,
        path = node.getAttribute("path"),
        file, found = false;

    var paths = pathMapper(path, context, Object.keys(config.handlers));

    for (var i = 0; i < paths.length; i++) {
        file = Path.join(baseUri, "includes", paths[i]);
        if (fs.existsSync(file)) {
            found = true;
            break;
        }
    }

    if (!found) {
        callback && callback("Include file not found " + path);
        return;
    }

    fs.readFile(file, "utf8", callback);

};