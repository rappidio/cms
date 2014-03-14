var Context = module.exports = function (language, country) {
    this.language = language;
    this.country = country;
    this.path = null;
};

Context.prototype = {

    locale: function () {
        return (this.language || "") + "_" + (this.country || "");
    },
    cacheString: function () {
        return this.locale() + "/" + this.path;
    }
};
