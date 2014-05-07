var mu = require("mu2");

module.exports = {
    renderToTemplate: function (template, data, callback) {
        var stream = mu.compileAndRender(template, data);


        var bufs = [];
        stream.on('data', function (d) {
            if (d instanceof Buffer) {
                bufs.push(d);
            } else {
                bufs.push(new Buffer(d, "utf8"));
            }
        });
        stream.on('end', function () {
            var buf = Buffer.concat(bufs);
            callback(null, buf.toString("utf8"));
        });
    }
};