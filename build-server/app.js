// Copyright 2015 Gautam Mittal

var bodyParser = require('body-parser');
var Firebase = require('firebase');
var fs = require('fs');
var express = require('express');
var request = require('request');
require('shelljs/global');

var app = express();

app.use(bodyParser());

var port = 3000;

var uid_maker = new Firebase("https://hgy-sms-jmjypwax.firebaseio.com/");


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
  var projectID = req.body.id;


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



// Request to make a new Xcode project
app.post('/create-project', function(req, res) {
  var projectName = req.body.projectName;
  var project_uid = uid_maker.push().key();

  var projID = projectName + project_uid;

  console.log(projID);

  var exec_cmd = 'liftoff --no-git --no-open --no-cocoapods --strict-prompts -n TROLL -c C_NAME -a AUTHOR_NAME -i C_NAME.AUTHOR -p PREFIX';
  exec(exec_cmd);


  res.send(project_uid);

});


app.post('/create-ipa', function (req, res) {

});


// fire up the server!
var server = app.listen(port, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

























function stripslashes(str) {
  //       discuss at: http://phpjs.org/functions/stripslashes/
  //      original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //      improved by: Ates Goral (http://magnetiq.com)
  //      improved by: marrtins
  //      improved by: rezna
  //         fixed by: Mick@el
  //      bugfixed by: Onno Marsman
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //         input by: Rick Waldron
  //         input by: Brant Messenger (http://www.brantmessenger.com/)
  // reimplemented by: Brett Zamir (http://brett-zamir.me)
  //        example 1: stripslashes('Kevin\'s code');
  //        returns 1: "Kevin's code"
  //        example 2: stripslashes('Kevin\\\'s code');
  //        returns 2: "Kevin\'s code"

  return (str + '')
    .replace(/\\(.?)/g, function(s, n1) {
      switch (n1) {
        case '\\':
          return '\\';
        case '0':
          return '\u0000';
        case '':
          return '';
        default:
          return n1;
      }
    });
}