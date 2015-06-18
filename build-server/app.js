// Copyright 2015 Gautam Mittal

/*

  Dependencies:
  NODE.JS + Xcode 6.3 + Homebrew + Ruby 2.2.2

  $ sudo npm install && gem install nomad-cli && brew install wget

  You will also need to populate the .env file with the necessary environment variables in order for this script to run effectively


*/


var dotenv = require('dotenv');
dotenv.load();

var async = require('async');
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
var secure_serverURL = process.env.SECURE_HOSTNAME;



// Run an Xcode sandbox
// Try running a while true loop :P
// This has automatic handling to prevent a user from running infinite loops, the system just stops the script from running after a while.
app.post('/build-sandbox', function (req, res) {
  	console.log('Following sandbox executed at '+ new Date());
  	console.log(req.body.code);

	// console.log((req.body.code).length);

  if (req.body.code && (req.body.code).length != 0) {
  	fs.writeFile("code.swift", req.body.code, function(err) {
	    if(err) {
	        return console.log(err);
	    }

      exec("swift code.swift", function (err, out, stderror) {
        if (stderror) { // if user has buggy code, tell them what they did wrong
          res.send(stderror);
        } else { // if user doesn't, show them the given output
          res.send(out);  
        }
        
      });

	    

	    // console.log("The file was saved!");
	}); 

  } else {
  	res.send("Nothing to compile.");
  }

});





// This is where we want to store the generated Xcode projects

exec('cd build-projects', function (err, out, stderror) {
  if (err) { // if error, assume that the directory is non-existent
    console.log('build-projects directory does not exist! creating one instead.');
    console.log('downloading renameXcodeProject.sh...');

    exec('mkdir build-projects', function (err, out, stderror) {
      cd('build-projects');
      
      // download the great
      exec('wget https://cdn.rawgit.com/gmittal/ringo/d63d7a40828f2d6a738cd2a109d7bcfd7a33d950/build-server/renameXcodeProject.sh', function (err, out, stderror) {
        console.log(out);

        exec('chmod 755 renameXcodeProject.sh', function (err, out, stderror) {
          console.log('Successfully downloaded renameXcodeProject.sh...');
        });

      });
    });


  } else {
    console.log('build-projects directory was found.');
  } // end if err


});

var buildProjects_path = process.env.BUILD_PROJECTS_PATH;



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
              console.log(err);


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
  var project_id = req.body.id;

  cd(buildProjects_path)

  var id_dir = ls(project_id)[0];
  var files = ls(project_id+"/"+id_dir+"/"+id_dir);

  files.remove('Images.xcassets');
  files.remove('Base.lproj');


  res.setHeader('Content-Type', 'application/json');

  console.log(files);  

  var filesContents = []; // final array of json data

  var i = 0;

  loopFiles();

  function loopFiles() {
      var file = files[i];
      console.log(file);

        fs.readFile(project_id+"/"+id_dir+"/"+id_dir+"/"+file, 'utf8', function (err, data) {
          if (err) {
            return console.log(err);
          }



          var contentForFile = {};
          contentForFile["name"] = file;

          // console.log(data);
          contentForFile["data"] = data;

          filesContents.push(contentForFile);

          // console.log(filesContents)

          if (i < files.length) {
            
            console.log(i);
            loopFiles();
            i++;
          } else {

            console.log("HELLO")
            res.send({"files": filesContents});
          }

        });


  }

});



// allows you to add a new Xcode image asset to the project asset catalog (requires PNG file)
app.post('/add-image-xcasset', function (req, res) {
  cd(buildProjects_path); // always need this

});




// Build an Xcode Project using the appetize.io on-screen simulator
app.post('/build-project', function (req, res) {
  // take the app back to the build-projects directory, as another route may have thrown the build server into a project directory instead
  cd(buildProjects_path);

  if (req.body.id) {
      var projectID = req.body.id;

      // $ xcodebuild -sdk iphonesimulator -project XCODEPROJ_PATH
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

                  var screenEmbed = '<iframe src="https://appetize.io/embed/'+public_key+'?device=iphone6&scale=75&autoplay=false&orientation=portrait&deviceColor=white&screenOnly=true" width="282px" height="501px" frameborder="0" scrolling="no"></iframe>';
                  var deviceEmbed = '<iframe src="https://appetize.io/embed/'+public_key+'?device=iphone6&scale=75&autoplay=true&orientation=portrait&deviceColor=white" width="312px" height="653px" frameborder="0" scrolling="no"></iframe>';

                  res.send({'simulatorURL': message.body.publicURL, "screenOnlyEmbedCode": screenEmbed, "fullDeviceEmbedCode": deviceEmbed});

                  



              }
          }); // end request


        }); // end zip exec
        


      }); // end xcodebuild exec


    /* SIMULATOR EMBED CODE:
    
      <iframe src="https://appetize.io/embed/<PUBLIC KEY>?device=iphone6&scale=75&autoplay=true&orientation=portrait&deviceColor=white" width="312px" height="653px" frameborder="0" scrolling="no"></iframe>


    */

  } else {
    res.send({"Error": "Invalid parameters."});
  }

});





// Route that generates an ad-hoc IPA file for the user to download onto their device (is this against Apple's terms?)
app.post('/create-ipa', function (req, res) {
  // $ ipa build

  // take the app back to the build-projects directory, as another route may have thrown the build server into a project directory instead
  cd(buildProjects_path);
  
  // json headers
  res.setHeader('Content-Type', 'application/json');

  if (req.body.id) {
      console.log('Attempting to generate a .ipa file.');

      var projectID = req.body.id;

      var id_dir = ls(projectID)[0]; // project name e.g. WWDC
      var project_dir = ls(projectID+"/"+id_dir);

      // go into the directory
      cd(projectID+"/"+id_dir);

      exec('ipa build', function (err, out, stderror) {
        
        if (err) {
          res.send({"Error": "There was an error generating your IPA file."});
        } else {
          console.log(out);
          console.log("\n");

          console.log('IPA for project '+ projectID + ' generated at '+ new Date());
          var ipa_path = projectID +"/"+ id_dir + "/" + id_dir + ".ipa";
          var ipa_dl_url = secure_serverURL + "/" + ipa_path;

          console.log(ipa_dl_url);

          console.log('Generating manifest.plist...');

          var manifest_plist_data = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>items</key><array><dict><key>assets</key><array><dict><key>kind</key><string>software-package</string><key>url</key><string>'+ ipa_dl_url +'</string></dict></array><key>metadata</key><dict><key>bundle-identifier</key><string>Ringo.'+ id_dir +'</string><key>bundle-version</key><string>1</string><key>kind</key><string>software</string><key>title</key><string>'+id_dir+'</string></dict></dict></array></dict></plist>';



          fs.writeFile("manifest.plist", manifest_plist_data, function(err) {
              if(err) {
                  return console.log(err);
              }

              var mainfest_plist_url = secure_serverURL + "/" + projectID +"/"+ id_dir + "/manifest.plist";
              console.log(mainfest_plist_url);            

              console.log('Successfully generated IPA manifest.plist.');

              var signed_dl_url = "itms-services://?action=download-manifest&url="+mainfest_plist_url;

              // raw_ipa_url is the link that directly downloads the IPA file, the signed_dl_url allows you to download the IPA file on an iOS device
              res.send({"raw_ipa_url": ipa_dl_url, "signed_dl_url": signed_dl_url}); 
          
          }); 



           






        }

      });
  } else {
    res.send({"Error": "Invalid parameters."});
  }

  





});



// fire up the server!
var server = app.listen(port, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});


Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};


