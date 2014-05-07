var xmldom = require("xmldom"),
    domParser = new xmldom.DOMParser(),
    xmlSerializer = new xmldom.XMLSerializer(),
    cssmin = require("cssmin");

var mod = module.exports = function (content, callback) {
    callback(null, mod.transform(content));
};

module.exports.transform = function (content, options) {
    var document = domParser.parseFromString(content);

    // move css to the top and combine it
    var imgNodes = document.getElementsByTagName("img");
    if (imgNodes.length > 0) {
        for (var i = 0; i < imgNodes.length; i++) {
            var node = imgNodes[i];


            node.setAttribute("data-original", node.getAttribute("src"));
            node.setAttribute("src", "/loader.gif");
        }
    }

    return xmlSerializer.serializeToString(document.documentElement);
};

module.exports.contentType = "text/html";