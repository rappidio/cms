var assert = require('chai').assert,
    Context = require(__dirname + "/../lib/context.js"),
    pathMapper = require(__dirname + "/../lib/pathMapper");

describe("PathMapping", function () {

    var paths = {
        "/": {
            "": ["index.xml", "index.html", "index.md"]
        },
        // de_AT
        "about": {
            "de_AT": [
                "about.de_AT.xml", "about.de.xml", "about.xml",
                "about.de_AT.html", "about.de.html", "about.html",
                "about.de_AT.md", "about.de.md", "about.md",
                "about/index.de_AT.xml", "about/index.de.xml", "about/index.xml",
                "about/index.de_AT.html", "about/index.de.html", "about/index.html",
                "about/index.de_AT.md", "about/index.de.md", "about/index.md"
            ],
            "de": [
                "about.de.xml", "about.xml",
                "about.de.html", "about.html",
                "about.de.md", "about.md",
                "about/index.de.xml", "about/index.xml",
                "about/index.de.html", "about/index.html",
                "about/index.de.md", "about/index.md"
            ]
        },
        // de_AT
        "about/company": {
            "de_AT": [
                "about/company.de_AT.xml", "about/company.de.xml", "about/company.xml",
                "about/company.de_AT.html", "about/company.de.html", "about/company.html",
                "about/company.de_AT.md", "about/company.de.md", "about/company.md",
                "about/company/index.de_AT.xml", "about/company/index.de.xml", "about/company/index.xml",
                "about/company/index.de_AT.html", "about/company/index.de.html", "about/company/index.html",
                "about/company/index.de_AT.md", "about/company/index.de.md", "about/company/index.md"
            ],
            "de": [
                "about/company.de.xml", "about/company.xml",
                "about/company.de.html", "about/company.html",
                "about/company.de.md", "about/company.md",
                "about/company/index.de.xml", "about/company/index.xml",
                "about/company/index.de.html", "about/company/index.html",
                "about/company/index.de.md", "about/company/index.md"
            ]
        },
        "about/company.html": {
            "de_AT": [
                "about/company.de_AT.html", "about/company.de.html", "about/company.html",
                "about/company/index.de_AT.html", "about/company/index.de.html", "about/company/index.html"
            ],
            "de": [
                "about/company.de.html", "about/company.html",
                "about/company/index.de.html", "about/company/index.html"
            ]
        }
    };

    var context,
        extensions = ["xml", "html", "md"];

    for (var key in paths) {
        if (paths.hasOwnProperty(key)) {

            var path = paths[key];

            for (var locale in path) {

                if (path.hasOwnProperty(locale)) {
                    context = new Context();
                    var res = locale.split("_");
                    context.language = res.length ? res.shift() : null;
                    context.country = res.length ? res.shift() : null;
                    context.path = key;

                    (function (context, result) {

                        it("Path '" + context.path + "' should result in " + result, function () {
                            assert.deepEqual(pathMapper(context.path, context, extensions), result);
                        });

                    })(context, path[locale]);
                }
            }


        }
    }
});
