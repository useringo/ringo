// Copyright 2015 Gautam Mittal

/*

  Dependencies:
  NODE.JS + Xcode 6.3 + Homebrew + Ruby 2.2.2

  $ sudo npm install && gem install nomad-cli && brew install wget zip unzip

  You will also need to populate the .env file with the necessary environment variables in order for this script to run effectively


*/


// might be useful to refer to this: http://stackoverflow.com/questions/4079280/javascript-communication-between-browser-tabs-windows, when thinking about implementing a simulator which opens in an external window



var dotenv = require('dotenv');
dotenv.load();

var async = require('async');
var bodyParser = require('body-parser');
var colors = require('colors');
var fs = require('fs');
var express = require('express');
var request = require('request');
require('shelljs/global');

var exec = require('child_process').exec;

// open the localhost tunnel to the rest of the world!
var ngrok = require('ngrok');

var app = express();

app.use(bodyParser({limit: '50mb'}));
// console.log('Limit file size: '+limit);

app.use(express.static(__dirname + '/build-projects'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var port = 3000;


var build_serverURL = process.env.HOSTNAME;
var secure_serverURL = process.env.SECURE_HOSTNAME;

// initialize the ngrok tunnel
ngrok.connect(port, function (err, url) {
  console.log("Tunnel open: " + url.red + " at "+ new Date());

  // rewrite the env variables
  process.env["SECURE_HOSTNAME"] = url;
  process.env["HOSTNAME"] = url.replace('https', 'http');

  build_serverURL = process.env.HOSTNAME;
  secure_serverURL = process.env.SECURE_HOSTNAME;


});


app.get('/get-secure-tunnel', function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  // send the tunnel url upon request
  res.send({"tunnel_url": process.env.HOSTNAME});
});


// Run an Xcode sandbox
// Try running a while true loop :P
// This has automatic handling to prevent a user from running infinite loops, the system just stops the script from running after a while.
app.post('/build-sandbox', function (req, res) {
  	console.log('Following sandbox executed at '+ new Date());
  	console.log(req.body.code.orange);

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
      exec('wget https://cdn.rawgit.com/phunter/CCRMA-Coursework/5b5ceebea2a3cc488dc46d03e623d594c589ba6a/winter_12/248/shader-demo/renameXcodeProject.sh', function (err, out, stderror) {
        console.log(out);

        exec('chmod 755 renameXcodeProject.sh', function (err, out, stderror) {
          console.log('Successfully downloaded renameXcodeProject.sh at ' + new Date());
        });

      });
    });


  } else {
    console.log('build-projects directory was found at '+ new Date());
  } // end if err


});

var buildProjects_path = process.env.BUILD_PROJECTS_PATH;



// Request to make a new Xcode project
app.post('/create-project', function(req, res) {

  cd(buildProjects_path);

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
        var project_uid = generatePushID();
        project_uid = project_uid.substr(1, project_uid.length);

        console.log(project_uid);

        res.setHeader('Content-Type', 'application/json');

        // Using node's child_process.exec causes asynchronous issues... callbacks are my friend
        exec('mkdir '+ project_uid, function (err, out, stderror) {


            cd(project_uid);

            var template = req.body.template;

            var exec_cmd = ''; // there is a different command that needs to be executed based on the template the user chooses

            if (template == "game") { // generate a SpriteKit game
              exec_cmd = 'git clone https://github.com/gmittal/ringoTemplate && .././renameXcodeProject.sh ringoTemplate "'+ projectName +'" && rm -rf ringoTemplate';

            } else if (template == "mda") { // generates a Master-Detail application
              exec_cmd = 'git clone https://github.com/gmittal/ringoMDATemplate && .././renameXcodeProject.sh ringoMDATemplate "'+ projectName +'" && rm -rf ringoMDATemplate';

            } else if (template == "sva") { // generates a Single View application
              exec_cmd = 'git clone https://github.com/gmittal/ringoSVATemplate && .././renameXcodeProject.sh ringoSVATemplate "'+ projectName +'" && rm -rf ringoSVATemplate';

            } else if (template == "pba") { // generates a Page-based application
              exec_cmd = 'git clone https://github.com/gmittal/ringoPBATemplate && .././renameXcodeProject.sh ringoPBATemplate "'+ projectName +'" && rm -rf ringoPBATemplate';

            } else if (template == "ta") { // generates a Tabbed application
              exec_cmd = 'git clone https://github.com/gmittal/ringoTATemplate && .././renameXcodeProject.sh ringoTATemplate "'+ projectName +'" && rm -rf ringoTATemplate';

            }




            exec(exec_cmd, function (err, out, stderror) {
              console.log(out);
              console.log(err);


              console.log('============================================== \n Successfully created '+project_uid+' at ' + new Date() + '\n');

              // don't send back the code until its actually done
              res.send({"uid": project_uid});
          
            });

            

        });  
  } else {
    res.statusCode = 500;
    res.send({"Error": "Invalid parameters."});
  }


});






// Handle download, upload, git cloning, and creation of Xcode project code

// download your project code in a ZIP file
app.get('/download-project/:id', function (req, res) {
  cd(buildProjects_path);

  cd(req.param('id'));


  var name = ls()[0];

  // before the user can download their file, you have to wipe the project's build directory
  cd(name);

  console.log(pwd());
  console.log(ls())

  exec('rm -rf build', function (err, out, stderror) {
    console.log(out);

    console.log('Successfully cleaned up the build directory from the project that will be downloaded.');
  
    // now that we've removed the build projects directory, we need to move back up to the ID directory
    cd(buildProjects_path + '/' + req.param('id'));

    exec('zip -r "'+name+'" "'+name+'"', function (err, out, stderror) {
      console.log(out.cyan);

      res.sendFile(buildProjects_path+"/"+req.param('id')+"/"+name+".zip");


    });

  });

  
});


app.post('/upload-project-zip', function (req, res) {
  cd(buildProjects_path);

  res.setHeader('Content-Type', 'application/json');

  


  if (req.body.file) {

    cd(buildProjects_path);

    // create a unique ID where this awesome project will live
    var project_uid = generatePushID();
    project_uid = project_uid.substr(1, project_uid.length);

    console.log(project_uid);

    // console.log(req.body.file);

    exec('mkdir '+ project_uid, function (err, out, stderror) {
          cd(project_uid);

          var base64Data = req.body.file.replace(/^data:application\/zip;base64,/, "");

          require("fs").writeFile("anonymous_project.zip", base64Data, 'base64', function(err) {
            if (err) {
              console.log(err);  
            }
            
            console.log('User ZIP project successfully received.'.magenta);

            exec('unzip anonymous_project.zip && rm -rf anonymous_project.zip', function (err, out, stderror) {
              console.log('Took out the garbage.'.yellow);

              console.log('Verifying that the project file tree is compliant with Xcode standards...'.yellow);

                cd(buildProjects_path);

                var id_dir = ls(project_uid)[0];

                var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name
                
                for (var z = 0; z < ls(project_uid + "/" + id_dir).length; z++) {
                  if (ls(project_uid + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
                    xc_projName = ls(project_uid + "/" + id_dir)[z].replace('.xcodeproj', '');
                  }
                }

                // console.log("XC " + xc_projName.length);


                if (xc_projName.length !== 0) {
                  res.send({"id": project_uid});    
                } else {
                  console.log("Does not comply with the standard Xcode project file tree...".red);
                  res.statusCode = 500;
                  res.send({"Error": "Invalid parameters"});
                }

              

              // cd(buildProjects_path);
            });


            

          }); // end write ZIP file

    }); // end create project directory



  } else {
    res.send({"Error": "Invalid parameters"});
  }

});



app.post('/clone-git-project', function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  cd(buildProjects_path);

  

  if (req.body.url) {
    console.log('Received request to git clone a file.');

    // create a unique ID where this awesome project will live
    var project_uid = generatePushID();
    project_uid = project_uid.substr(1, project_uid.length);

    console.log(project_uid);

    exec('mkdir '+ project_uid, function (err, out, stderror) {
      cd(project_uid);

      // actually clone the repository
      exec('git clone ' + req.body.url, function (err, out, stderror) {
        if (out !== undefined) {
          console.log(out.cyan);  
        }
        
        if (err) {
          console.log(err.red);
          res.statusCode = 500;
          res.send({"Error":"Something did not go as expected."});  
        } else {
          res.send({"uid": project_uid});  
        }
        

        
      });


    }); // end $ mkdir project_uid


  } else {
    res.statusCode = 500;
    res.send({"Error" : "Invalid parameters"});
  }

});






// Save the files with updated content -- assumes end user has already made a request to /get-project-contents
app.post('/update-project-contents', function (req, res) {
  cd(buildProjects_path);

  var project_id = req.body.id;
  var files = req.body.files;



  console.log(files.length + " files need to be saved.");

  cd(buildProjects_path);

  var id_dir = ls(project_id)[0];

  var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name
  
  for (var z = 0; z < ls(project_id + "/" + id_dir).length; z++) {
    if (ls(project_id + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
      xc_projName = ls(project_id + "/" + id_dir)[z].replace('.xcodeproj', '');
    }
  }

  console.log(('Xcode Project File Name: ' + xc_projName).red);

  var j = 0;

  writeFiles();

  function writeFiles() {
    var file = files[j];

    fs.writeFile(project_id+"/"+id_dir+"/"+xc_projName+"/"+file.name, file.data, function (err) {
      if (err) {
        return console.log(err);
      }

      console.log(file.name +" was saved at "+ new Date());

      if (j < files.length-1) {
        j++;
        writeFiles();
      } else {
        res.send("Complete");
      }

    });

  } // end writeFiles()

  
});







// GET all of the files and their contents within an Xcode project
app.post('/get-project-contents', function(req, res) {
  var project_id = req.body.id;

  // console.log(req.body.id);

  cd(buildProjects_path);

  var id_dir = ls(project_id)[0];
  console.log(id_dir);
  // var files = ls(project_id+"/"+id_dir+"/"+id_dir);

  var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name
  
  for (var z = 0; z < ls(project_id + "/" + id_dir).length; z++) {
    if (ls(project_id + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
      xc_projName = ls(project_id + "/" + id_dir)[z].replace('.xcodeproj', '');
    }
  }

  console.log(('Xcode Project File Name: ' + xc_projName).red);


  // crawl the file tree
  walk(buildProjects_path + "/" + project_id+"/"+id_dir+"/"+xc_projName, function(err, results) {
    if (err) throw err;

    var filtered = [];

    // filter out all the stuff that is useless
    for (var i = 0; i < results.length; i++) {
      var tmp = results[i];

      tmp = tmp.split("/");

      for (var j = 0; j < 11; j++) { // remove the eleven parent directories of the file
        tmp.shift();
      }

      tmp = tmp.join("/");
      

      if (!(tmp.indexOf("Images") > -1)) {
        // if (!(tmp.indexOf(".lproj") > -1)) {
          if (!(tmp.indexOf(".sks") > -1)) {
            if (!(tmp.indexOf(".playground") > -1)) {
              if (!(tmp.indexOf(".png") > -1)) {
                filtered.push(tmp); 
              }
                  
            } 
          }
                
        // }
      } // end filters
    

    } // end for loop

    console.log(filtered)

    var files = filtered;

    res.setHeader('Content-Type', 'application/json');

    console.log(files);  

    var filesContents = []; // final array of json data

    var i = 0;

    loopFiles();

    function loopFiles() {
        var file = files[i];
        console.log(file);

          fs.readFile(project_id+"/"+id_dir+"/"+xc_projName+"/"+file, 'utf8', function (err, data) {
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

              // console.log("HELLO")
              res.send({"files": filesContents});
              cd(buildProjects_path);
            }

          });


    }


  });


});





// allows you to add a new Xcode image asset to the project asset catalog (requires PNG file)
app.post('/add-image-xcasset', function (req, res) {
  cd(buildProjects_path); // always need this

});

// get the xcasset files
app.post('/get-image-xcassets', function (req, res) {

});


// add new files to the project directory
app.post('/add-file', function (req, res) {

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



      // various methods of filtering through the success build logs
      // $ xcodebuild -sdk iphonesimulator -configuration Debug -verbose > /dev/null


      // various methods of filtering the error logs

      // $ xcodebuild -sdk iphonesimulator -configuration Release -verbose | egrep '^(/.+:[0-9+:[0-9]+:.(error|warning):|fatal|===)' -
      // $ xcodebuild -sdk iphonesimulator -configuration Release -verbose | grep -A 5 error:


      console.log('Attempting to build the project...'.red);

      exec('xcodebuild -sdk iphonesimulator -configuration Release -verbose | grep -A 5 error:', function (err, xcode_out, stderror) {
        cd('build/Release-iphonesimulator');

        
        console.log(xcode_out.green);

        // console.log(normalized);

        cd(buildProjects_path);

        var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name
  
        for (var z = 0; z < ls(projectID + "/" + id_dir).length; z++) {
          if (ls(projectID + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
            xc_projName = ls(projectID + "/" + id_dir)[z].replace('.xcodeproj', '');
          }
        }

        var normalized = xc_projName.split(' ').join('\ ');

        console.log('Normalized NAME: ' + normalized);

        // cd(projectID+"/"+id_dir);
        // well this is important
        cd(projectID+"/"+id_dir + '/build/Release-iphonesimulator');

        console.log(pwd());

        console.log('zip -r "'+projectID+'" "'+xc_projName+'.app"'.green);

        // zip up the simulator executable
        exec('zip -r "'+projectID+'" "'+xc_projName+'.app"', function (err, out, stderror) {
          
          cd(buildProjects_path); // enter build-projects once again (using absolute paths!)
          
          console.log(out.green);
          // console.log(err.red);

          // console.log(pwd());

          var path = projectID + "/" + id_dir + "/build/Release-iphonesimulator/" + projectID + ".zip";
          console.log(buildProjects_path + path);

          var zip_dl_url = build_serverURL + "/" + path;
          console.log(".zip of simulator executable: " + zip_dl_url.cyan);

          console.log(typeof xcode_out)

          // check if the build succeeded
          if (xcode_out == "") { //.indexOf("** BUILD SUCCEEDED **") > -1) {

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
                      console.log("Simulator Public Key: " + public_key.yellow);

                      var screenEmbed = '<iframe src="https://appetize.io/embed/'+public_key+'?device=iphone6&scale=75&autoplay=false&orientation=portrait&deviceColor=white&screenOnly=true" width="282px" height="501px" frameborder="0" scrolling="no"></iframe>';
                      var deviceEmbed = '<iframe src="https://appetize.io/embed/'+public_key+'?device=iphone6&scale=75&autoplay=true&orientation=portrait&deviceColor=white" width="312px" height="653px" frameborder="0" scrolling="no"></iframe>';

                      res.send({'simulatorURL': message.body.publicURL, "screenOnlyEmbedCode": screenEmbed, "fullDeviceEmbedCode": deviceEmbed, "console": out});

                      



                  }
              }); // end request
          } else {// end if build succeeded
            res.send({"BUILD_FAILED": xcode_out});
            // console.log(out);


          }



        }); // end zip exec
        


      }); // end xcodebuild exec


    /* SIMULATOR EMBED CODE:
    
      <iframe src="https://appetize.io/embed/<PUBLIC KEY>?device=iphone6&scale=75&autoplay=true&orientation=portrait&deviceColor=white" width="312px" height="653px" frameborder="0" scrolling="no"></iframe>


    */

  } else {
    res.send({"Error": "Invalid parameters."});
  }

});




// allow user to grab project information such as name, bundle ID, etc.
app.get('/get-project-details/:app_id', function (req, res) {
  cd(buildProjects_path);

  res.setHeader('Content-Type', 'application/json');



  var project_id = req.param('app_id');
  var id_dir = ls(project_id)[0]; // project directory

  var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name
  
  for (var z = 0; z < ls(project_id + "/" + id_dir).length; z++) {
    if (ls(project_id + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
      xc_projName = ls(project_id + "/" + id_dir)[z].replace('.xcodeproj', '');
    }
  }

  console.log(('Xcode Project File Name: ' + xc_projName).red);


  res.send({"project": {"name": xc_projName}});

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

      exec('ipa build -c Release', function (err, out, stderror) {
        
        if (err) {
          res.send({"Error": "There was an error generating your IPA file. Please double check that there are no syntax errors or other issues with your code."});
        } else {
          console.log(out);
          console.log("\n");

          var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name
          
          for (var z = 0; z < ls(project_id + "/" + id_dir).length; z++) {
            if (ls(project_id + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
              xc_projName = ls(project_id + "/" + id_dir)[z].replace('.xcodeproj', '');
            }
          }

          console.log(('Xcode Project File Name: ' + xc_projName).red);

          console.log('IPA for project '+ projectID + ' generated at '+ new Date());
          var ipa_path = projectID +"/"+ id_dir + "/" + xc_projName + ".ipa";
          var ipa_dl_url = secure_serverURL + "/" + ipa_path;

          console.log(ipa_dl_url.cyan);

          console.log('Generating manifest.plist...');

          var manifest_plist_data = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>items</key><array><dict><key>assets</key><array><dict><key>kind</key><string>software-package</string><key>url</key><string>'+ ipa_dl_url +'</string></dict></array><key>metadata</key><dict><key>bundle-identifier</key><string>com.Ringo.'+ id_dir +'</string><key>bundle-version</key><string>1</string><key>kind</key><string>software</string><key>title</key><string>'+id_dir+'</string></dict></dict></array></dict></plist>';



          fs.writeFile("manifest.plist", manifest_plist_data, function(err) {
              if(err) {
                  return console.log(err);
              }

              var mainfest_plist_url = secure_serverURL + "/" + projectID +"/"+ id_dir + "/manifest.plist";
              console.log(mainfest_plist_url);            

              console.log('Successfully generated IPA manifest.plist.');

              var signed_dl_url = "itms-services://?action=download-manifest&url="+encodeURIComponent(mainfest_plist_url);
              console.log(signed_dl_url.cyan);

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



  // function that invokes a crawl through all of the directories and files
  var walk = function(dir, done) {
      var results = [];
      fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var i = 0;
      
          (function next() {
        var file = list[i++];
        if (!file) return done(null, results);
        file = dir + '/' + file;
        fs.stat(file, function(err, stat) {
            if (stat && stat.isDirectory()) {
                walk(file, function(err, res) {
                  results = results.concat(res);
                  next();
              });
            } else {
                results.push(file);
                next();
            }
            });
          })();   
    });
  };


// remove array objects
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


/**
 * Fancy ID generator that creates 20-character string identifiers with the following properties:
 *
 * 1. They're based on timestamp so that they sort *after* any existing ids.
 * 2. They contain 72-bits of random data after the timestamp so that IDs won't collide with other clients' IDs.
 * 3. They sort *lexicographically* (so the timestamp is converted to characters that will sort properly).
 * 4. They're monotonically increasing.  Even if you generate more than one in the same timestamp, the
 *    latter ones will sort after the former ones.  We do this by using the previous random bits
 *    but "incrementing" them by 1 (only in the case of a timestamp collision).
 */
generatePushID = (function() {
  // Modeled after base64 web-safe chars, but ordered by ASCII.
  var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
 
  // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
  var lastPushTime = 0;
 
  // We generate 72-bits of randomness which get turned into 12 characters and appended to the
  // timestamp to prevent collisions with other clients.  We store the last characters we
  // generated because in the event of a collision, we'll use those same characters except
  // "incremented" by one.
  var lastRandChars = [];
 
  return function() {
    var now = new Date().getTime();
    var duplicateTime = (now === lastPushTime);
    lastPushTime = now;
 
    var timeStampChars = new Array(8);
    for (var i = 7; i >= 0; i--) {
      timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
      // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
      now = Math.floor(now / 64);
    }
    if (now !== 0) throw new Error('We should have converted the entire timestamp.');
 
    var id = timeStampChars.join('');
 
    if (!duplicateTime) {
      for (i = 0; i < 12; i++) {
        lastRandChars[i] = Math.floor(Math.random() * 64);
      }
    } else {
      // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
      for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
        lastRandChars[i] = 0;
      }
      lastRandChars[i]++;
    }
    for (i = 0; i < 12; i++) {
      id += PUSH_CHARS.charAt(lastRandChars[i]);
    }
    if(id.length != 20) throw new Error('Length should be 20.');
 
    return id;
  };
})();

