var request = require("request");

module.exports = function (node, context, callback) {

    request({
        json: true,
        url: "http://api.spreadshirt.net/api/v1/shops/205909/printTypes?fullData=true&mediaType=json&locale=" + context.locale()
    }, function(err, res, body) {

        if (err) {
            callback(err);
        } else {
            callback(null, "<ul>" + body.printTypes.map(function(printType) {
                return "<li>" + printType.name + "-" + printType.description + "</li>";
            }).join("") + "</ul>")
        }
    });

};