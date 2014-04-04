var pathMapper = require(__dirname + "/../pathMapper"),
    Path = require("path"),
    fs = require("fs");

module.exports = function (node, context, callback) {

    var config = context.config,
        baseUri = config.baseUri,
        path = node.getAttribute("path"),
        enableFallback = node.getAttribute("enableFallback") != "false",
        file, found = false;

    var paths = pathMapper(path, context, Object.keys(config.handlers), enableFallback);


    for (var i = 0; i < paths.length; i++) {
        file = Path.join(baseUri, "includes", paths[i]);
        if (fs.existsSync(file)) {
            found = true;
            break;
        }
    }

    if (!found) {
        console.log("WARN: Couldn't find included file " + file);
        callback && callback(null, "");
        return;
    }

    fs.readFile(file, "utf8", callback);

};