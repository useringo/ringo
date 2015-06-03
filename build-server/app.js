// Copyright 2015 Gautam Mittal

var bodyParser = require('body-parser');
var Firebase = require('firebase');
var fs = require('fs');
var express = require('express');
var request = require('request');
require('shelljs/global');

var exec = require('child_process').exec;

var app = express();

app.use(bodyParser());

var port = 3000;

var uid_maker = new Firebase("https://hgy-sms-jmjypwax.firebaseio.com/"); // utilizing Firebase to generate unique keys :P



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





// This is where we want to store the generated Xcode projects
cd('build-projects');

// Request to make a new Xcode project
app.post('/create-project', function(req, res) {
  var projectName = req.body.projectName;
  var project_uid = uid_maker.push().key();
  project_uid = project_uid.substr(1, project_uid.length);


  // creates a project with a unique id. The app that's trying to build the app will need to access the app via that unique ID from this point forward
  var exec_cmd = 'liftoff --no-git --no-open --no-cocoapods --strict-prompts -n '+ project_uid +' -c C_NAME -a AUTHOR_NAME -i C_NAME.AUTHOR -p PREFIX';
  exec(exec_cmd, function (err, out, stderror) {
    console.log(out);
  });


  res.send(project_uid);

});



// GET all of the files and their contents within an Xcode project
app.get('/get-project-contents', function(req, res) {
  var project_id = req.body.projectID;
});



// Build an Xcode Project using the appetize.io on-screen simulator
app.post('/build-project', function (req, res) {
  var projectID = req.body.id;

  // $ xcodebuild -sdk iphonesimulator
  // this generates the build directory where you can zip up the file to upload to appetize

});





// Route that generates an ad-hoc IPA file for the user to download onto their device (is this against Apple's terms?)
app.post('/create-ipa', function (req, res) {
  // $ ipa build

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