var Base = require("./Base"),
    xmldom = require("xmldom"),
    _ = require("underscore"),
    xpath = require("xpath"),
    metaDataParser = require("../helper/metaDataParser.js"),
    fs = require("fs"),
    flow = require("flow.js").flow;

var domParser = new xmldom.DOMParser(),
    xmlSerializer = new xmldom.XMLSerializer();

var Content = Base.inherit("metaDataParser.Content", {
    ctor: function (content, context) {

        var parts = metaDataParser(content);

        this.meta = parts.meta;
        this.document = domParser.parseFromString(parts.content);
        this.context = context;

        var doc = this.document.documentElement;

        if (!doc.innerHTML) {
            Object.defineProperty(doc.constructor.prototype, 'innerHTML', {
                get: function () {

                    var ret = "";

                    for (var i = 0; i < this.childNodes.length; i++) {
                        ret += this.childNodes[i].toString() || "";
                    }

                    return ret;
                },
                set: function (data) {
                    data = "<root>" + data + "</root>";

                    var doc = (new xmldom.DOMParser()).parseFromString(data);
                    if (!doc.documentElement) {
                        this.data = data;
                    } else {
                        while (this.firstChild) {
                            this.removeChild(this.firstChild);
                        }

                        while (doc.documentElement.firstChild) {
                            var child = doc.documentElement.firstChild;
                            doc.documentElement.removeChild(child);
                            this.appendChild(child);
                        }
                    }
                }
            });
        }
    },

    setContent: function (content, name) {

        name = name || "main";

        var contentPlaceHolder = this.getContentPlaceHolder(name);

        if (!contentPlaceHolder) {
            throw new Error("ContentPlaceHolder '" + name + "' not found.");
        }

        if (_.isString(content)) {
            contentPlaceHolder.innerHTML = content;
        } else {
            while (contentPlaceHolder.firstChild) {
                contentPlaceHolder.removeChild(contentPlaceHolder.firstChild);
            }

            contentPlaceHolder.appendChild(content);
        }

        // convert content placeholder to div
        contentPlaceHolder.tagName = "div";

    },

    getContentPlaceHolder: function (name) {
        // find content placeholder block
        return xpath.select("//*[local-name(.)='ContentPlaceHolder' and namespace-uri(.)='cms' and @name='" + name + "']", this.document)[0];
    },

    fillContentPlaceHolder: function (fillCallback) {
        Array.prototype.slice.call(xpath.select("//*[local-name(.)='ContentPlaceHolder' and namespace-uri(.)='cms']", this.document))
            .forEach(function (contentPlaceHolder) {
                var name = contentPlaceHolder.getAttribute("name");
                var content = fillCallback(name);

                if (content) {
                    contentPlaceHolder.parentNode.insertBefore(content, contentPlaceHolder);
                    contentPlaceHolder.parentNode.removeChild(contentPlaceHolder);

                    content.tagName = "div";
                    content.removeAttribute("name");
                    content.removeAttribute("layout");

                    // Content.setContent(contentPlaceHolder, content);
                } else {
                    // remove the content place holder
                    contentPlaceHolder.parent.removeChild(contentPlaceHolder);
                }
            });
    },

    processContentElements: function(callback) {

        var document = this.document,
            context = this.context,
            contentElements = Array.prototype.slice.call(xpath.select("//*[namespace-uri(.) !='' and namespace-uri(.) != 'http://www.w3.org/1999/xhtml']", document));

        contentElements = contentElements.filter(function (contentElement) {
            return !(contentElement.namespaceURI === "cms"
                && ["Content", "ContentPlaceHolder"].indexOf(contentElement.localName) !== -1);
        });

        // get all external tags
        // load tag handler
        // create instances
        // call tag handler with context function
        // get content and replace tag with content


        flow()
            .seqEach(contentElements, function (contentElement, cb) {

                // get external tag handler
                // TODO map namespaces
                var factory = require(__dirname + "/../" + contentElement.namespaceURI + "/" + contentElement.localName);
                factory(contentElement, context, function (err, content) {
                    if (!err) {
                        var resultWrapper = document.createElement("div");
                        resultWrapper.innerHTML = content || "";
                        contentElement.parentNode.replaceChild(resultWrapper, contentElement);
                    }

                    cb(err);
                });
            })
            .exec(callback);


    },

    applyLayout: function (callback) {
        var layout = this.meta.layout,
            self = this;

        if (layout) {

            flow()
                .seq("layout", function (cb) {
                    Content.createLayout(self.context, layout, cb);
                })
                .seq(function () {

                    var layout = this.vars.layout;
                    layout.fillContentPlaceHolder(function (name) {
                        return xpath.select("//*[local-name(.)='Content' and namespace-uri(.)='cms' and @name='" + name + "']", self.document)[0];
                    });
                })
                .seq("layout", function (cb) {
                    this.vars.layout.applyLayout(cb);
                })
                .exec(function (err, results) {
                    callback && callback(err, results.layout);
                });

        } else {
            callback && callback(null, this);
        }
    },

    setMetaData: function (metaData) {
        var head = this.document.getElementsByTagName("head").item(0);

        if (head) {
            var matches = head.innerHTML.match(/\{([^}]+?)\}/g),
                context = this.context;

            matches.forEach(function (match) {
                var key = match.substring(1, match.length - 1);
                head.innerHTML = head.innerHTML.replace(match, metaData[key] || context.config.meta[key] || "");
            });
        }
    },

    toString: function () {
        return Content.toString(this.document.documentElement);
    }
}, {

    createLayout: function (context, layout, callback) {

        flow()
            .seq("layout", function (cb) {
                fs.readFile(context.config.baseUri + "/layout/" + layout + ".xml", "utf8", function (err, handle) {
                    cb(null, new Content(handle, context));
                });
            })
            .seq(function (cb) {
                this.vars.layout.processContentElements(cb);
            })
            .exec(function (err, results) {
                callback && callback(err, results.layout);
            });

    },

    removeNodes: function (node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    },


    toString: function (node) {
        return xmlSerializer.serializeToString(node);
    }
});

module.exports = Content;