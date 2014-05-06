var pathMapper = require(__dirname + "/../pathMapper"),
    Path = require("path"),
    fs = require("fs"),
    metaDataParser = require("../helper/metaDataParser.js");

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

    if (found) {
        fs.readFile(file, "utf8", function (err, content) {
            if (!err) {
                paths = pathMapper(path, context, ["json"]);
                found = false;
                for (var i = 0; i < paths.length; i++) {
                    file = Path.join(baseUri, "i18n/includes", paths[i]);
                    if (fs.existsSync(file)) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    var json = JSON.parse(fs.readFileSync(file, "utf8"));

                    for (var k in json) {
                        if (json.hasOwnProperty(k)) {
                            // TODO: allow paths
                            content = content.replace("{{" + k + "}}", json[k]);
                        }
                    }
                }
            }
            callback(err, content);
        });
    } else {
        console.log("WARN: Couldn't find included file " + file);
        callback && callback(null, "");
    }


};