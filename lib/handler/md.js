var markdown = require("markdown").markdown,
    flow = require("flow.js").flow;

module.exports = function (meta, content, context, callback) {

    var regEx = /(\{xml\}\n(.+)\n{\/xml})/i,
        replacements = {};

    flow()
        .seq(function () {
            var matches,
                i = 0;
            while ((matches = regEx.exec(content)) !== null) {
                content = content.replace("\n" + matches[1], "cms_include:" + i);
                replacements["" + i] = matches[2];
                i++;
            }
        })
        .seq("content", function () {
            return markdown.toHTML(content)
        })
        .seq(function () {
            for (var key in replacements) {
                if (replacements.hasOwnProperty(key)) {
                    this.vars.content = this.vars.content.replace("cms_include:" + key, replacements[key]);
                }
            }
        })
        .exec(function (err, result) {
            callback && callback(err, err ? null : result.content.toString())
        });

};

module.exports.extension = "md";
