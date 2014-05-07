var pathMapper = require(__dirname + "/../pathMapper"),
    Path = require("path"),
    fs = require("fs"),
    metaDataParser = require("../helper/metaDataParser.js");

module.exports = {
    getTranslations: function (path, context) {
        var paths = pathMapper(path, context, ["json"]),
            found = false,
            file;
        for (var i = 0; i < paths.length; i++) {
            file = Path.join(context.config.baseUri, "i18n", paths[i]);
            if (fs.existsSync(file)) {
                found = true;
                break;
            }
        }
        if (found) {
            return JSON.parse(fs.readFileSync(file, "utf8"));
        }
        return null;
    }
};