module.exports = function (app, context, config) {

    app.use(function (req, res, next) {

        var domains = config.domains || {};

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

        var defaultDomain = config.defaultDomain;
        if (defaultDomain) {
            var port = req.header("Host").split(":")[1];
            res.redirect(req.protocol + "://" + defaultDomain + (port ? (":"  + port) : "") + req.path);
        }

    });

};