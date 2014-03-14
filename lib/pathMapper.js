module.exports = function (path, context, extensions) {
    path = path.replace(/\/$/, "");

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

            // {path}.{extension}
            ret.push(p + "." + ext);
        })
    });

    return ret;

};