var yaml = require('js-yaml'),
    fs = require('fs');

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
        body = null,
        tmp;

    if (/^---/.test(content)) {
        tmp = content.split("---");
        tmp.shift();
        meta = tmp.shift();
        body = tmp.join("---").replace(/^\n/, "");
    } else if (/^<!--/.test(content)) {
        tmp = content.split("-->");
        meta = tmp.shift().substr(4);
        body = tmp.join("-->").replace(/^\n/, "");
    } else {
        body = content;
    }

    return {
        meta: meta,
        content: body
    }
};

module.exports.getMetaDataForPath = function (path) {

    // get files for path
    var file = this.getRealPath(path);


};
