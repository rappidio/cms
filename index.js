var server = require("./lib/server"),
    http = require('http');

var app = server(["site"]);

app.use(require('morgan'));
app.use(require("body-parser")());

http.createServer(app).listen(3000);

