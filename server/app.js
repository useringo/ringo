// Copyright 2015 Gautam Mittal

var bodyParser = require('body-parser');
var fs = require('fs');
var express = require('express');
var request = require('request');
require('shelljs/global');

var app = express();

app.use(bodyParser());

var port = 3000;



// Run an Xcode sandbox
app.post('/build-sandbox', function (req, res) {
  	console.log('Following sandbox executed at '+ new Date());
  	console.log(req.body.code);

	// console.log((req.body.code).length);

  if (req.body.code && (req.body.code).length != 0) {
  	fs.writeFile("code.swift", req.body.code, function(err) {
	    if(err) {
	        return console.log(err);
	    }

	   res.send(exec("swift code.swift").output); 

	    // console.log("The file was saved!");
	}); 

  } else {
  	res.send("Nothing to compile.");
  }

});


// Build an Xcode Project
app.post('/build-project', function (req, res) {
  	console.log('Following sandbox executed at '+ new Date());
  	console.log(req.body.code);

	// console.log((req.body.code).length);

  if (req.body.code && (req.body.code).length != 0) {
  	fs.writeFile("code.swift", req.body.code, function(err) {
	    if(err) {
	        return console.log(err);
	    }

	   res.send(exec("swift code.swift").output); 

	    // console.log("The file was saved!");
	}); 

  } else {
  	res.send("Nothing to compile.");
  }

});


// fire up the server!
var server = app.listen(port, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});