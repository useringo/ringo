var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
require('shelljs/global');

var app = express();

app.use(bodyParser());

var port = 3000;

app.get('/build', function (req, res) {
  res.send('Hello World!');
});


// fire up the server!
var server = app.listen(port, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});