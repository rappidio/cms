module.exports = function(app, config) {

    return function(meta, document, context, callback) {
        callback && callback();
    };
};

module.exports.metaKey = "meta";