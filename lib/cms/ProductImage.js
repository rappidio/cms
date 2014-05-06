var request = require("request");

module.exports = function (node, context, callback) {

    var productId = node.getAttribute("productId"),
        url = ['http://image.spreadshirt.net/image-server/v1/products/' + productId];


    url.push("/views/1?width=900");
    if (context.req.params.length > 2 && context.req.params[2]) {
        url.push("&appearanceId=" + context.req.params[2]);
    }

    callback && callback(null, '<img src="' + url.join("") + '"/>');
};