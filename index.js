var server = require("./lib/server"),
    http = require('http'),
    express = require("express");

var app = server(["site"]);

app.use(express.logger());
app.use(express.bodyParser());

http.createServer(app).listen(3000);

