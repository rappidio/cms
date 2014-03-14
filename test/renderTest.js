var assert = require('chai').assert,
    fs = require("fs"),
    requirejs = require("requirejs"),
    cms = require("../lib/cms"),
    path = require("path");

describe("Render", function () {

    var content = fs.readFileSync(__dirname + "/test.md", "utf8");

    it("should convert markdown to html with the layout", function(done) {
        var baseUri = __dirname + "/../site";

        cms.processMarkdown({
            baseUri: baseUri
        }, content, done);
    });

});
