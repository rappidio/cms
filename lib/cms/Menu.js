var fs = require("fs"),
    path = require("path"),
    flow = require("flow.js").flow,
    pathMapper = require("../pathMapper"),
    cmsUtil = require('../util'),
    metaDataParser = require("../helper/metaDataParser"),
    _ = require('underscore');

module.exports = function (node, context, callback) {

    var pagePath = context.path,
        root = node.getAttribute("root");

    var rootDir = path.join(context.config.baseUri, "content", pagePath),
        elements = rootDir.split("/"),
        lastElement,
        stack = [];

    elements = context.path.split("/");

    var startIndex = elements.indexOf(root),
        element,
        tmp,
        lastDir,
        stats,
        tree,
        childrenCache;

    for (var i = startIndex; i < elements.length; i++) {
        element = elements.slice(0, i + 1).join("/");
        tmp = {
            path: element,
            meta: cmsUtil.getMetaDataSync(element, context),
            children: []
        };
        if (lastDir) {
            lastDir.selectedChild = tmp;
        }
        var p = path.join(context.config.baseUri, "content", element);
        if (fs.existsSync(p)) {
            stats = fs.lstatSync(p);
            if (stats.isDirectory()) {
                var children = fs.readdirSync(p);
                childrenCache = {};
                children.forEach(function (child) {
                    var name = child.split(".").shift();
                    if (name.indexOf("index") == -1 && !childrenCache.hasOwnProperty(name)) {
                        childrenCache[name] = true;
                        tmp.children.push({
                            path: element + "/" + name,
                            name: name,
                            meta: cmsUtil.getMetaDataSync(element + "/" + name, context)
                        });
                    }

                });

                if (!lastDir) {
                    tree = tmp;
                }
                lastDir = tmp;
            } else {
                lastDir = null;
            }
        }
    }

    function renderTree(tree, depth) {
        depth = depth || 1;

        var ret = [];
        if (tree.children.length) {
            ret.push('<ul class="level-{level}">'.replace("{level}", depth));
            var child,
                selected;
            //        ret.push("<li>",tree.meta.title,"</li>");
            for (var i = 0; i < tree.children.length; i++) {
                child = tree.children[i];

                selected = tree.selectedChild && child.path == tree.selectedChild.path;
                ret.push('<li class="{active}"><a href="{path}">'.replace("{path}", child.path).replace("{active}", selected ? "active" : ""), child.meta.title, '</a></li>');
                if (selected && tree.selectedChild.children.length) {
                    ret.push("<li>", renderTree(tree.selectedChild, depth + 1), "</li>")
                }
            }

            ret.push("</ul>");
        }

        return ret.join("");

    }

    callback(null, "<h3>" + tree.meta.title + "</h3>" + renderTree(tree));

};