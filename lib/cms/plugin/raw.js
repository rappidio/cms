define([], function () {
    var fs, createXhr,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        fetchRaw = function (url, callback) {
            throw new Error('Environment unsupported.');
        },
        buildMap = {};


    if (typeof process !== "undefined" && process.versions && !!process.versions.node) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        fetchRaw = function (path, callback) {
            fs.readFile(path, "utf8", callback);
        };
    }

    return {

        version: '0.1.0',

        load: function (name, parentRequire, load, config) {

            var url = parentRequire.toUrl(name);

            fetchRaw(url, function (err, raw) {
                if (!err) {
                    load(raw);
                } else {
                    load.error(new Error("Raw for " + url + " not found"));
                }
            });
        }
    };
});


