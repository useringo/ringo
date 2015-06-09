// Copyright 2015 Gautam Mittal

var dotenv = require('dotenv');
dotenv.load();

var bodyParser = require('body-parser');
var Firebase = require('firebase');
var fs = require('fs');
var express = require('express');
var request = require('request');
require('shelljs/global');

var exec = require('child_process').exec;

var app = express();

app.use(bodyParser());
app.use(express.static(__dirname + '/build-projects'));

var port = 3000;

var uid_maker = new Firebase(process.env.FIREBASE); // utilizing Firebase to generate unique keys :P

var build_serverURL = process.env.HOSTNAME;


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
var buildProjects_path = '/Users/gautam/Desktop/git-repos/ringo/build-server/build-projects';



// Request to make a new Xcode project
app.post('/create-project', function(req, res) {

  // Figure out what directory the app is in
  if (pwd() != '/Users/gautam/Desktop/git-repos/ringo/build-server/build-projects') {
    cd('build-projects');
     
    if (pwd() != '/Users/gautam/Desktop/git-repos/ringo/build-server/build-projects') {
      cd('../');
    }
  }

  // only execute if they specify the required parameters
  if (req.body.projectName) {
        var projectName = req.body.projectName;
        var project_uid = uid_maker.push().key();
        project_uid = project_uid.substr(1, project_uid.length);

        res.setHeader('Content-Type', 'application/json');

        // Using node's child_process.exec causes asynchronous issues... callbacks are my friend
        exec('mkdir '+ project_uid, function (err, out, stderror) {
            cd(project_uid);


            // creates a project with a unique id. The app that's trying to build the app will need to access the app via that unique ID from this point forward
            var exec_cmd = 'git clone http://www.github.com/gmittal/ringoTemplate && .././renameXcodeProject.sh ringoTemplate "'+ projectName +'" && rm -rf ringoTemplate';
            exec(exec_cmd, function (err, out, stderror) {
              console.log(out);
              console.log('============================================== \n Successfully created '+project_uid+' at ' + new Date() + '\n');
          
            });

            res.send({"uid": project_uid});

        });  
  } else {
    res.send({"Error": "Invalid parameters."});
  }

  



});



// GET all of the files and their contents within an Xcode project
app.post('/get-project-contents', function(req, res) {
  var project_id = req.body.projectID;

  var id_dir = ls(project_id)[0];
  var files = ls(project_id+"/"+id_dir+"/"+id_dir);

  res.setHeader('Content-Type', 'application/json');

  console.log(files);  

  res.send({"files": files});

});



// Build an Xcode Project using the appetize.io on-screen simulator
app.post('/build-project', function (req, res) {
 

  if (req.body.id) {
      var projectID = req.body.id;

      // $ xcodebuild -sdk iphonesimulator
      // this generates the build directory where you can zip up the file to upload to appetize



      var id_dir = ls(projectID)[0]; // project name e.g. WWDC
      var project_dir = ls(projectID+"/"+id_dir);
      // console.log(project_dir);

      // go into the directory
      cd(projectID+"/"+id_dir);


      exec('xcodebuild -sdk iphonesimulator', function (err, out, stderror) {
        cd('build/Release-iphonesimulator');


        
        console.log(out);

        var normalized = id_dir.split(' ').join('\\ ');

        console.log(normalized);

        exec('zip -r '+projectID+' '+normalized+".app", function (err, out, stderror) {
          console.log(ls());
          cd(buildProjects_path); // enter build-projects once again (using absolute paths!)
          
          console.log(pwd());

          var path = projectID + "/" + id_dir + "/build/Release-iphonesimulator/" + projectID + ".zip";
          console.log(path);

          var zip_dl_url = build_serverURL + "/" + path;


          // use the 'request' module from npm
          var request = require('request');
          request.post({
              url: 'https://api.appetize.io/v1/app/update',
              json: {
                  token : process.env.APPETIZE_TOKEN,
                  url : zip_dl_url,
                  platform : 'ios',
              }
          }, function(err, message, response) {
              if (err) {
                  // error
                  console.log(err);
                  res.send({'ERROR': err});

              } else {
                  // success
                  console.log(message.body);

                  var public_key = (message.body.publicURL).split("/")[4];
                  console.log("Simulator Public Key: " + public_key);

                  var screenEmbed = '<iframe src="https://appetize.io/embed/<PUBLIC KEY>?device=iphone6&scale=75&autoplay=false&orientation=portrait&deviceColor=white&screenOnly=true" width="282px" height="501px" frameborder="0" scrolling="no"></iframe>';
                  var deviceEmbed = '<iframe src="https://appetize.io/embed/<PUBLIC KEY>?device=iphone6&scale=75&autoplay=true&orientation=portrait&deviceColor=white" width="312px" height="653px" frameborder="0" scrolling="no"></iframe>';

                  res.send({'simulatorURL': message.body.publicURL, "screenOnlyEmbedCode": screenEmbed, "fullDeviceEmbedCode": deviceEmbed});

                  



              }
          }); // end request


        }); // end zip exec
        


      }); // end xcodebuild exec


    /* SIMULATOR EMBED CODE:
    
      <iframe src="https://appetize.io/embed/<PUBLIC KEY>?device=iphone6&scale=75&autoplay=true&orientation=portrait&deviceColor=white" width="312px" height="653px" frameborder="0" scrolling="no"></iframe>


    */

  }

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