var yaml = require('js-yaml');

var mod = module.exports = function (content) {

    var documentParts = mod.getDocumentParts(content);
    if (documentParts.meta) {
        documentParts.meta = yaml.safeLoad(documentParts.meta);
    } else {
        documentParts.meta = {};
    }

    return documentParts;
};

module.exports.getDocumentParts = function (content) {
    var meta = null,
        body = null;

    if (/^---/.test(content)) {
        var tmp = content.split("---");
        tmp.shift();
        meta = tmp.shift();
        body = tmp.join("---");
    } else {
        body = content;
    }

    return {
        meta: meta,
        content: body
    }
};
