module.exports = function (app, context, config) {

    var domains = {
        "en_EU": {
            tld: "net"
        },
        "de_DE": {
            tld: "de"
        },
        "de_AT": {
            tld: "at"
        },
        "be_NL": {
            tld: "be",
            dir: "nl"
        },
        "be_FR": {
            tld: "be"
        }
    };

    app.use(function (req, res, next) {
        var domain = req.header("Host").split(":")[0] || "",
            url = context.path,
            tld = (/\.([^.]+)$/.exec(domain) || [])[1],
            dir = url.split("/")[1];

        for (var key in domains) {
            if (domains.hasOwnProperty(key)) {
                var d = domains[key];

                if (tld === d.tld &&
                    (!d.dir || d.dir === dir)) {
                    var s = key.split("_");

                    req.context.language = s[0];
                    req.context.country = s[1];

                    if (d.dir) {
                        context.path = context.path.substr(dir.length + 1);
                    }

                    next();
                    return;
                }

            }
        }

        // TODO: make this dynamic
        res.redirect("cms.de:3000");
    });

};