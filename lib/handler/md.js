var markdown = require("markdown").markdown,
    flow = require("flow.js").flow;

module.exports = function (meta, content, context, callback) {

    flow()
        .seq("content", function () {
            return markdown.toHTML(content)
        })
        .exec(function (err, result) {
            callback && callback(err, err ? null : result.content.toString())
        });

};

module.exports.extension = "md";
