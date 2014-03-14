var assert = require('chai').assert,
    cms = require("../lib/cms.js"),
    fs = require("fs");

describe("Yaml", function () {
    var content = fs.readFileSync(__dirname + "/test.md", "utf8");

    describe("Meta", function () {

        it("should have meta data and content", function() {

            var documentParts = cms.getDocumentParts(content);
            assert.deepEqual(documentParts.meta,
                "\n" +
                "title: Company History\n" +
                "layout: about\n" +
                "alias: .*-C5367\n"
            );
            assert.ok(documentParts.content);

        });

        it("should have no meta data", function () {

            var documentParts = cms.getDocumentParts("foo bar");
            assert.isNull(documentParts.meta);
            assert.equal(documentParts.content, "foo bar");

        });

        it("should have no content", function () {

            var documentParts = cms.getDocumentParts("---\nfoobar\n---");
            assert.equal(documentParts.meta, "\nfoobar\n");
            assert.equal(documentParts.content, "");

        });

    });

    describe("Yaml", function () {

        it("should parse yaml within markdown", function () {

            var meta = cms.metaDataParser(content);

            assert.deepEqual(meta, {
                title: "Company History",
                layout: "about",
                alias: ".*-C5367"
            });

        });

        it("should not find meta data for null", function () {
            assert.isNull(cms.metaDataParser(null));
        });

        it("should not find meta data for empty string", function () {
            assert.isNull(cms.metaDataParser(""));
        });

        it("should not find meta data if there is no meta data", function () {
            assert.isNull(cms.metaDataParser("h2\n---\nfoo"));
        });
    });




});
