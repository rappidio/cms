module.exports = function (path, context, extensions, includeFallback) {
    path = path.replace(/\/$/, "");


    var match = path.match(/^(.+?)\.(.+)$/),
        extension;

    if (match) {
        path = match[1];
        extension = match[2];
        if (extensions.indexOf(extension) > -1) {
            extensions = [extension];
        } else {
            return [];
        }
    }

    includeFallback = (typeof(includeFallback) === "undefined") ? true : !!includeFallback;

    if (path === "") {
        return ["index.xml", "index.md"];
    }

    var ret = [],
        paths = [path, path + "/index"];

    paths.forEach(function (p) {
        extensions.forEach(function (ext) {


            if (context.language) {
                if (context.country) {
                    // {path}.{locale}.{extension}
                    var locale = context.language + "_" + context.country;
                    ret.push([p, locale, ext].join("."));
                }
                // {path}.{language}.{extension}
                ret.push([p, context.language, ext].join("."));
            }

            if (includeFallback) {
                // {path}.{extension}
                ret.push(p + "." + ext);
            }
        })
    });

    return ret;

};