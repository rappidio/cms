var xmldom = require("xmldom"),
    domParser = new xmldom.DOMParser(),
    xmlSerializer = new xmldom.XMLSerializer(),
    cssmin = require("cssmin");

var mod = module.exports = function(content, callback) {
    callback(null, mod.transform(content));
};

module.exports.transform = function(content, options) {
    var document = domParser.parseFromString(content);

    // move css to the top and combine it
    var styleNodes = document.getElementsByTagName("style");
    if (styleNodes.length > 0) {
        var css = "";
        for (var i = 0; i < styleNodes.length; i++) {
            var node = styleNodes[i];
            for (var j = 0; j < node.childNodes.length; j++) {
                css += node.childNodes[j].toString();
            }

            node.parentNode.removeChild(node);
        }

        // minify css
        css = cssmin(css);

        // attach it to the body
        var style = document.createElement("style"),
            head = document.getElementsByTagName("head")[0];

        style.setAttribute("type", "text/css");
        style.textContent = css;

        head.appendChild(style);

    }

    return xmlSerializer.serializeToString(document.documentElement);
};

module.exports.contentType = "text/html";