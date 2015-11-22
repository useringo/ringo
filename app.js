// Ringo Core Build Server
// Copyright 2015 Gautam Mittal under MIT License

//  Dependencies: NODE.JS + Xcode 7
//  You will also need to populate the .env file with the necessary environment variables in order for this script to run effectively

var dotenv = require('dotenv');
dotenv.load();
var bodyParser = require('body-parser');
var colors = require('colors');
var express = require('express');
var fs = require('fs');
var getIP = require('external-ip')();
var Keen = require("keen.io");
var request = require('request');
var satelize = require('satelize');
var serialNumber = require('serial-number');
serialNumber.preferUUID = true;
require('shelljs/global');


var sendgrid;
if (process.env.REPORT_TO && process.env.SEND_REPORTS == "YES") {
  sendgrid = require('sendgrid')(process.env.SENDGRID_KEY);
}
var client;
if (process.env.KEEN_PROJECT_ID) {
  console.log("Keen analytics starting up...".magenta);
  client = Keen.configure({
      projectId: process.env.KEEN_PROJECT_ID,
      writeKey: process.env.KEEN_WRITE_KEY
  });
}


var reportBalancerTimer;
var exec = require('child_process').exec;
var ngrok = require('ngrok');

var app = express();
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(__dirname + '/build-projects')); // serve the files within build-projects
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var port = 3000;

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log(('Ringo core server listening at http://0.0.0.0:'+ port).blue);
});

var build_serverURL = process.env.HOSTNAME;
var secure_serverURL = process.env.SECURE_HOSTNAME;

getIP(function (err, ip) {
    if (err) {
        console.log(err);
    }

    if (typeof client != "undefined") {
      satelize.satelize({ip:ip}, function(err, geoData) {
        if (err) {
          // do something
        } else {

            var obj = JSON.parse(geoData);

            var location = obj.city + ", " + obj.region_code + ", " + obj.country_code3;
            var isp = obj.isp;
            var country = obj.country;
            var timezone = obj.timezone;
            client.addEvent("on_start_server", {"location": location, "isp": isp, "country": country, "timezone": timezone});


          }
        });
    }
});



ngrok.connect(port, function (err, url) {
  console.log("Tunnel open: " + (url).red + " at "+ new Date());
  process.env["SECURE_HOSTNAME"] = url;
  process.env["HOSTNAME"] = url.replace('https', 'http');
  build_serverURL = process.env.HOSTNAME;
  secure_serverURL = process.env.SECURE_HOSTNAME;

  reportBalancerTimer = setInterval(reportToLoadBalancer, 1000); // send data to load balancer
});



function reportToLoadBalancer() {
  if (process.env.LOAD_BALANCER_URL) {
    serialNumber(function (err, value) {
        if (err) {
          console.log('Error getting the server unique ID, will have difficulty registering with the load balancer'.red);
        }

        // get the amount of stress on the server
        getServerLoad(function (server_load) {
                request({
                    url: process.env.LOAD_BALANCER_URL + '/register-server/', //URL to hit
                    method: 'POST',
                    json: {
                        server_id: value,
                        tunnel: process.env.HOSTNAME,
                        load:server_load,
                        key: process.env.BALANCER_AUTH_KEY
                    }
                }, function(error, response, body){
                    if(error) {
                        // console.log(error);
                    }

                });
        });
    });
  }
}

// Get the ngrok tunnel url
// GET (no parameters)
app.get('/get-secure-tunnel', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send({"tunnel_url": process.env.HOSTNAME});
});


// Run an Xcode Swift sandbox
// POST {'code':string}
app.post('/build-sandbox', function (req, res) {
  cd(buildProjects_path);

  if (req.body.code && (req.body.code).length != 0) {
      var ip = req.connection.remoteAddress;
      if (typeof client != "undefined") { // only run if the user has set up analytics
        satelize.satelize({ip:ip}, function(err, geoData) {
          // if data is JSON, we may wrap it in js object
          if (err) {
            // console.log("There was an error getting the user's location.");
          } else {
              // console.log(geoData);

              var obj = JSON.parse(geoData);
              var location = obj.city + ", " + obj.region_code + ", " + obj.country_code3;
              var isp = obj.isp;
              var country = obj.country;
              var timezone = obj.timezone;
              var lengthOfCode = (req.body.code).length

              client.addEvent("built_sandbox", {"location": location, "isp": isp, "country": country, "timezone": timezone, "code_length": lengthOfCode});
          } // end error handling
        }); // end satelize
      }


    console.log('Sandbox executed at '+ new Date());


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



var buildProjects_path = "";
exec('cd build-projects', function (err, out, stderror) {
  // set the build-projects path
  process.env["BUILD_PROJECTS_PATH"] = pwd() + "/build-projects";

  buildProjects_path = process.env.BUILD_PROJECTS_PATH;

  if (err) { // if error, assume that the directory is non-existent
    console.log('build-projects directory does not exist! creating one instead.'.red);
    console.log('downloading renameXcodeProject.sh...'.cyan);
    console.log('downloading XcodeProjAdder...'.cyan)

    exec('mkdir build-projects', function (err, out, stderror) {
      cd('build-projects');

      // download the great
      exec('wget http://cdn.rawgit.com/gmittal/ringoPeripherals/master/cli-helpers/renameXcodeProject.sh && wget http://cdn.rawgit.com/gmittal/ringoPeripherals/master/cli-helpers/XcodeProjAdder', function (err, out, stderror) {
        console.log(out);

        exec('chmod 755 renameXcodeProject.sh && chmod a+x XcodeProjAdder', function (err, out, stderror) {
          console.log(('Successfully downloaded renameXcodeProject.sh at ' + new Date()).green);
          console.log(('Successfully downloaded XcodeProjAdder at ' + new Date()).green);

          cleanBuildProjects();
          setInterval(cleanBuildProjects, 60000); // clean the build-projects directory every minute

        });

      });
    });


  } else {
    console.log('build-projects directory was found.'.green);
    cleanBuildProjects();
    setInterval(cleanBuildProjects, 60000); // clean the build-projects directory every one minute

  } // end if err



});






// Destroy any projects that haven't been touched for more than 48 hours
function cleanBuildProjects() {
  cd(buildProjects_path);

  // console.log("Checking the build-projects directory");
  var projects = ls();

  var i = 0;

  loopProjects();

  function loopProjects() {

    if (projects[i] != "XcodeProjAdder") {
      if (projects[i] != "renameXcodeProject.sh") {

          fs.stat(projects[i], function (err, stats) {
            // console.log(stats);

            var lastModifiedTime = (new Date(stats.mtime)).getTime();
            var currentTime = (new Date()).getTime();

            // if the time since now and the time when the file was last modified is greater than 172800s (48h) -> destroy!
            if (currentTime - lastModifiedTime > 172800000) {
              console.log((projects[i] + " is too old. Destroying now.").red);

              // destroy the directory
              rm('-rf', projects[i]);
            }


            if (i < projects.length) {
              i++;
              loopProjects();
            }

          });
      } // end if not renameXcodeProject.sh
    } // end if not XcodeProjAdder

  } // end loopFiles()
} // end cleanBuildProjects







// Request to make a new Xcode project
// POST {'projectName':string, 'template':string}
app.post('/create-project', function(req, res) {
  cd(buildProjects_path);
  // only execute if they specify the required parameters
  if (req.body.projectName) {
      // analytics
        var ip = req.connection.remoteAddress;
        // console.log("Request made from: " + ip);

        if (typeof client != "undefined") {
          satelize.satelize({ip:ip}, function(err, geoData) {
              // if data is JSON, we may wrap it in js object
              if (err) {
                // console.log("There was an error getting the user's location.");
              } else {
                  // console.log(geoData);

                  var obj = JSON.parse(geoData);

                  var location = obj.city + ", " + obj.region_code + ", " + obj.country_code3;
                  var isp = obj.isp;
                  var country = obj.country;
                  var timezone = obj.timezone;

                  // console.log(location);

                  var project_nomen = req.body.projectName

                  client.addEvent("project_created", {"location": location, "isp": isp, "country": country, "timezone": timezone, "name": project_nomen}, function(err, res) {
                      // if (err) {
                      //     // console.log("Oh no, an error logging project_created".red);
                      // } else {
                      //     // console.log("Event project_created logged".green);
                      // }
                  }); // end client addEvent



              } // end error handling
            }); // end satelize
        }

        var projectName = req.body.projectName;
        var project_uid = generatePushID();
        project_uid = project_uid.substr(1, project_uid.length);

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
              // console.log(out);
              // console.log(err);
              console.log('Successfully created '+(project_uid).magenta+' at ' + new Date() + '\n');

              // don't send back the code until its actually done
              res.send({"uid": project_uid});

            });
        });
  } else {
    res.statusCode = 500;
    res.send({"Error": "Invalid parameters."});
  }
});



// download your project code in a ZIP file
// GET /download/project/{ID_STRING}
app.get('/download-project/:id', function (req, res) {
  cd(buildProjects_path);


  // analytics
  var ip = req.connection.remoteAddress;
  // console.log("Request made from: " + ip);

  if (typeof client != "undefined") {
    satelize.satelize({ip:ip}, function(err, geoData) {
        // if data is JSON, we may wrap it in js object
        if (err) {
          // console.log("There was an error getting the user's location.");
        } else {
            // console.log(geoData);

            var obj = JSON.parse(geoData);

            var location = obj.city + ", " + obj.region_code + ", " + obj.country_code3;
            var isp = obj.isp;
            var country = obj.country;
            var timezone = obj.timezone;

            // console.log(location);


            client.addEvent("project_code_downloaded", {"location": location, "isp": isp, "country": country, "timezone": timezone, "project_id": req.params.id}, function(err, res) {
                // if (err) {
                //     console.log("Oh no, an error logging project_code_downloaded".red);
                // } else {
                //     console.log("Event project_code_downloaded logged".green);
                // }
            }); // end client addEvent



        } // end error handling
      }); // end satelize
  } // end if undefined




  cd(req.params.id);


  var name = ls()[0];

  // before the user can download their file, you have to wipe the project's build directory
  cd(name);

  // console.log(pwd());
  // console.log(ls())

  exec('rm -rf build', function (err, out, stderror) {
    // console.log(out);

    console.log('Successfully cleaned up the build directory from the project that will be downloaded.');

    // now that we've removed the build projects directory, we need to move back up to the ID directory
    cd(buildProjects_path + '/' + req.params.id);

    exec('zip -r "'+name+'" "'+name+'"', function (err, out, stderror) {
      // console.log(out.cyan);

      res.sendFile(buildProjects_path+"/"+req.params.id+"/"+name+".zip");


    });

  });


});




// Upload an Xcode project to be edited
// POST {'file':base64_file_string}
app.post('/upload-project-zip', function (req, res) {
  cd(buildProjects_path);

  res.setHeader('Content-Type', 'application/json');

  if (req.body.file) {

    // analytics
    var ip = req.connection.remoteAddress;
    console.log("Request made from: " + ip);


    if (typeof client != "undefined") {
      satelize.satelize({ip:ip}, function(err, geoData) {
          // if data is JSON, we may wrap it in js object
          if (err) {
            console.log("There was an error getting the user's location.");
          } else {
              // console.log(geoData);

              var obj = JSON.parse(geoData);

              var location = obj.city + ", " + obj.region_code + ", " + obj.country_code3;
              var isp = obj.isp;
              var country = obj.country;
              var timezone = obj.timezone;

              // console.log(location);

              var fileSize = ((req.body.file.length*3)/4)/1000000;
              fileSize = Math.round(fileSize*2)/2;

              // console.log(fileSize + "MB");

              client.addEvent("upload_project_zip", {"location": location, "isp": isp, "country": country, "timezone": timezone, "size_mb": fileSize}, function(err, res) {
                  if (err) {
                      console.log("Oh no, an error logging upload_project_zip".red);
                  } else {
                      console.log("Event upload_project_zip logged".green);
                  }
              }); // end client addEvent

          } // end error handling
        }); // end satelize
    } // end if undefined

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

                // sometimes operating systems like OS X generate a __MACOSX directory which confuses the system
                rm('-rf', project_uid + "/__MACOSX");

                var id_dir = ls(project_uid)[0];


                var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

                for (var z = 0; z < ls(project_uid + "/" + id_dir).length; z++) {
                  if (ls(project_uid + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
                    xc_projName = ls(project_uid + "/" + id_dir)[z].replace('.xcodeproj', '');
                  }
                }

                if (xc_projName.length !== 0) {
                  res.send({"id": project_uid});
                } else {
                  console.log("Does not comply with the standard Xcode project file tree...".red);
                  res.statusCode = 500;
                  res.send({"Error": "Invalid parameters"});
                }
            });

          }); // end write ZIP file

    }); // end create project directory

  } else {
    res.statusCode = 500;
    res.send({"Error": "Invalid parameters"});
  }

});


// Clone a git project to edited
// POST {'url':string}
app.post('/clone-git-project', function (req, res) {
  cd(buildProjects_path);
  res.setHeader('Content-Type', 'application/json');

  if (req.body.url) {
    console.log('Received request to git clone a file.');

      // analytics
      var ip = req.connection.remoteAddress;
      console.log("Request made from: " + ip);

      if (typeof client != "undefined") {
        satelize.satelize({ip:ip}, function(err, geoData) {
            // if data is JSON, we may wrap it in js object
            if (err) {
              console.log("There was an error getting the user's location.");
            } else {
                var obj = JSON.parse(geoData);
                var location = obj.city + ", " + obj.region_code + ", " + obj.country_code3;
                var isp = obj.isp;
                var country = obj.country;
                var timezone = obj.timezone;

                var source = "unknown";
                if ((req.body.url).substr(0, 4) == "http") {
                  source = (req.body.url).split("/")[2];
                }

                // console.log(source);

                client.addEvent("clone_git_project", {"location": location, "isp": isp, "country": country, "timezone": timezone, "source": source}, function(err, res) {
                    if (err) {
                        // console.log("Oh no, an error logging clone_git_project".red);
                    } else {
                        // console.log("Event clone_git_project logged".green);
                    }
                }); // end client addEvent
            } // end error handling
          }); // end satelize
      } // end if undefined

    // create a unique ID where this awesome project will live
    var project_uid = generatePushID();
    project_uid = project_uid.substr(1, project_uid.length);

    console.log(project_uid);

    exec('mkdir '+ project_uid, function (err, out, stderror) {
      cd(project_uid);

      // clone the repository
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
// POST {'id':string, 'files':object_array}
app.post('/update-project-contents', function (req, res) {
  cd(buildProjects_path);

  var project_id = req.body.id;
  var files = req.body.files;

  console.log(files.length + " files need to be saved for "+ project_id.magenta);

  cd(buildProjects_path);

  var id_dir = ls(project_id)[0];
  var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

  for (var z = 0; z < ls(project_id + "/" + id_dir).length; z++) {
    if (ls(project_id + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
      xc_projName = ls(project_id + "/" + id_dir)[z].replace('.xcodeproj', '');
    }
  }

  var j = 0;

  writeFiles();

  function writeFiles() {
    var file = files[j];

    fs.writeFile(project_id+"/"+id_dir+"/"+xc_projName+"/"+file.name, file.data, function (err) {
      if (err) {
        return console.log(err);
      }

      // console.log(file.name +" was saved at "+ new Date());

      if (j < files.length-1) {
        j++;
        writeFiles();
      } else {
        res.send("Complete");
      }

    });

  } // end writeFiles()

});



// Get all of the files and their contents within an Xcode project
// POST {'id':string}
app.post('/get-project-contents', function(req, res) {
  cd(buildProjects_path);

  var project_id = req.body.id;
  var id_dir = ls(project_id)[0];
  var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

  for (var z = 0; z < ls(project_id + "/" + id_dir).length; z++) {
    if (ls(project_id + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
      xc_projName = ls(project_id + "/" + id_dir)[z].replace('.xcodeproj', '');
    }
  }

  // console.log(('Xcode Project File Name: ' + xc_projName).red);

  // crawl the file tree
  walk(buildProjects_path + "/" + project_id+"/"+id_dir+"/"+xc_projName, function(err, results) {
    if (err) throw err;

    var filtered = [];

    // filter out all the stuff that is useless
    for (var i = 0; i < results.length; i++) {
      var tmp = results[i];

      tmp = tmp.split("/");

      // find all of the unnecessary top level directories
      var dirCount = 0;

      for (var k = 0; k < tmp.length; k++) {
        if (tmp[k] == project_id) {
          break;
        } else {
          dirCount++;
        }
      }

      // console.log(dirCount+3) // should be the number of directories that need to be removed

      for (var j = 0; j < dirCount+3; j++) { // remove the parent directories of the file
        tmp.shift();
      }

      tmp = tmp.join("/");


      if (!(tmp.indexOf(".xcassets") > -1)) {
        if (!(tmp.indexOf(".DS_Store") > -1)) {
          if (!(tmp.indexOf(".sks") > -1)) {
            if (!(tmp.indexOf(".playground") > -1)) {
              if (!(tmp.indexOf(".png") > -1)) {
                filtered.push(tmp);
              }

            }
          }

        }
      } // end filters


    } // end for loop

    var files = filtered;

    res.setHeader('Content-Type', 'application/json');

    var i = 0;

    loopFiles();

    res.write("{");
    // uses file streams to grab contents of each file without maxing out RAM
    function loopFiles() {
        var file = files[i];
        var contentForFile = {};
        contentForFile["name"] = file;
        contentForFile["data"] = "";

        var fileChunks = fs.createReadStream(project_id+"/"+id_dir+"/"+xc_projName+"/"+file, {encoding: 'utf-8'});

        fileChunks.on('data', function (chunk) {
            contentForFile["data"] += chunk;
        });

        fileChunks.on('end', function() {
          console.log(contentForFile.name);


          if (i < files.length-1) {
              res.write(JSON.stringify(contentForFile)+", ");
              i++;
              loopFiles();
            } else {
              res.write(JSON.stringify(contentForFile));
              res.write(', {"count": '+ files.length + '}}');

              res.send();
              cd(buildProjects_path);
            }


        });

    }

  });

});



// allows you to add a new Xcode image asset to the project asset catalog (requires PNG file)
// POST {'id':string, 'assetName':string, 'file':base64_file_string}
app.post('/add-image-xcasset', function (req, res) {
  cd(buildProjects_path); // always need this

  if (req.body.id) {
    var project_id = req.body.id;
    var newImage = req.body.file;
    var xcassetName = req.body.assetName;
    var id_dir = ls(project_id)[0];
    var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

    for (var z = 0; z < ls(project_id + "/" + id_dir).length; z++) {
      if (ls(project_id + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
        xc_projName = ls(project_id + "/" + id_dir)[z].replace('.xcodeproj', '');
      }
    }

    // console.log(('Xcode Project File Name: ' + xc_projName).red);

    var xcassetsDirName = "";

    // contents of the xcode project files directory (one level below the .xcodeproj file's directory)
    var xcProjDirectory = ls(project_id + "/" + id_dir + "/" + xc_projName);

    for (var z = 0; z < xcProjDirectory.length; z++) {
      if (xcProjDirectory[z].indexOf('.xcassets') > -1) {
        xcassetsDirName = xcProjDirectory[z];
      }
    }

    // console.log(('.xcassets Directory Name: ' + xcassetsDirName).cyan);

    var base64Data = req.body.file.replace(/^data:image\/png;base64,/, "");

    cd(project_id + "/" + id_dir + "/" + xc_projName + "/" + xcassetsDirName);

    exec('mkdir "'+xcassetName+'.imageset"', function (err, out, stderror) {
        if (err) {
          console.log(err);
        }
          cd(buildProjects_path + "/"+project_id + "/" + id_dir + "/" + xc_projName + "/" + xcassetsDirName); // lets take it from the top

          fs.writeFile(xcassetName + ".imageset/"+xcassetName+".png", base64Data, 'base64', function (err) {
              // console.log(ls());

              if (err) {
                console.log(err);

                res.statusCode = 500;
                res.send({"Error": "There was an error creating your xcasset"});
              } else {

                  var imageSetJSON = '{\n\
  "images" : [\n\
    {\n\
      "idiom" : "universal",\n\
      "scale" : "1x",\n\
      "filename" : "'+ xcassetName +'.png"\n\
    },\n\
    {\n\
      "idiom" : "universal",\n\
      "scale" : "2x"\n\
    },\n\
    {\n\
      "idiom" : "universal",\n\
      "scale" : "3x"\n\
    }\n\
  ],\n\
  "info" : {\n\
    "version" : 1,\n\
    "author" : "xcode"\n\
  }\n\
}';

                  fs.writeFile(xcassetName + ".imageset/Contents.json", imageSetJSON, function(err) {
                    if (err) {
                      console.log(err);
                      res.statusCode = 500;
                      res.send({"Error": "There was an error creating your xcasset"});
                    } else {
                      res.send({"Success":"Image xcasset successfully added."});

                    }

                  }); // end writeFile JSON
              }

          }); // end writeFile PNG
    }); // end exec mkdir

  } else {
    res.statusCode = 500;
    res.send({"Error": "Invalid parameters"});

  } // end if req.body.id

});


// get the xcasset files
// POST {'id':string}
app.post('/get-image-xcassets', function (req, res) {
  cd(buildProjects_path);


  if (req.body.id) {
      var project_id = req.body.id;
      var id_dir = ls(project_id)[0];

      var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

      for (var z = 0; z < ls(project_id + "/" + id_dir).length; z++) {
        if (ls(project_id + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
          xc_projName = ls(project_id + "/" + id_dir)[z].replace('.xcodeproj', '');
        }
      }

      // console.log(('Xcode Project File Name: ' + xc_projName).red);

      // crawl the file tree
      walk(buildProjects_path + "/" + project_id+"/"+id_dir+"/"+xc_projName, function(err, results) {
        if (err) throw err;

        var filtered = [];

        // filter out all the stuff that is useless
        for (var i = 0; i < results.length; i++) {
          var tmp = results[i];

          tmp = tmp.split("/");

          // find all of the unnecessary top level directories
          var dirCount = 0;

          for (var k = 0; k < tmp.length; k++) {
            if (tmp[k] == project_id) {
              break;
            } else {
              dirCount++;
            }
          }


          for (var j = 0; j < dirCount+3; j++) { // remove the parent directories
            tmp.shift();
          }

          tmp = tmp.join("/");

          // filter through all of the stuff that we don't want
          if (!(tmp.indexOf(".swift") > -1)) {
            if (!(tmp.indexOf(".lproj") > -1)) {
              if (!(tmp.indexOf(".sks") > -1)) {
                if (!(tmp.indexOf(".playground") > -1)) {
                  if (!(tmp.indexOf(".plist") > -1)) {
                    if (!(tmp.indexOf(".m") > -1)) {
                      if (!(tmp.indexOf(".h") > -1)) {
                        if (!(tmp.indexOf(".json") > -1)) {
                          if (!(tmp.indexOf(".DS_Store") > -1)) {
                            filtered.push(tmp);
                          }

                        }

                      }
                    }

                  }

                }
              }

            }
          } // end filters

        } // end for loop

        var files = [];

        for (var n = 0; n < filtered.length; n++) {
          var t = filtered[n];

          // push the un-altered copy to the files array
          files.push(t);

          var imageSetPathSplit = t.split("/");
          var imageSetName = imageSetPathSplit[1]; // usually the second folder's name in the path hierarchy

          filtered[n] = imageSetName;
        }

        // only present one of the many images that may be within an imageset
        for (var o = 0; o < filtered.length; o++) {
          var u = filtered[o];
          if (u == filtered[o+1]) {
            filtered.splice(o, 1);
            files.splice(o, 1)
          }
        }

        res.setHeader('Content-Type', 'application/json');

        // console.log(filtered)
        // console.log(files);

        var filesContents = []; // final array of json data
        var i = 0;

        if (files.length > 0) {
            loopFiles();
        } else {
          console.log("No Xcode image assets were found".cyan);
          res.send({"files": []});
          cd(buildProjects_path);
        }


        function loopFiles() {
            var file = files[i];
            // console.log(file);

              fs.readFile(project_id+"/"+id_dir+"/"+xc_projName+"/"+file, function (err, data) {
                if (err) {
                  return console.log(err);
                }

                var contentForFile = {};
                contentForFile["name"] = filtered[i];

                contentForFile["data"] = new Buffer(data).toString('base64');
                filesContents.push(contentForFile);

                if (i < files.length) {
                  loopFiles();
                  i++;
                } else {
                  res.send({"files": filesContents});
                  cd(buildProjects_path);
                }
              });
        }

      });
  }
});


// add new files to the project directory
// POST {'id':string, 'fileName':string}
app.post('/add-file', function (req, res) {
  cd(buildProjects_path);
  res.setHeader('Content-Type', 'application/json');

  if (req.body.id) {
    var project_uid = req.body.id;
    var newFileName = req.body.fileName;

    //removeAllSpaces
    newFileName = newFileName.split(" ").join("");

    var id_dir = ls(project_uid)[0];
    var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

    for (var z = 0; z < ls(project_uid + "/" + id_dir).length; z++) {
      if (ls(project_uid + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
        xc_projName = ls(project_uid + "/" + id_dir)[z].replace('.xcodeproj', '');
      }
    }

    var xcpath = buildProjects_path + "/" + project_uid + "/" + id_dir + "/"+ xc_projName + ".xcodeproj";
    cd(project_uid + "/" + id_dir + "/" + xc_projName);

    // make sure there are no copies of the exact same file
    var currentFiles = ls();

    for (var l = 0; l < currentFiles.length; l++) {
      if (currentFiles[l] == newFileName + ".swift") {
        console.log("The file that is being added already exists".red);
        newFileName += "Copy";
      }
    }

    // download a vanilla swift class file
    exec('wget cdn.rawgit.com/gmittal/ringoPeripherals/master/new-class-templates/R6roHpOHU8qa3Z2TvHsG.swift', function (err, out, stderror) {
      // rename file after downloading from GitHub
      exec('mv "R6roHpOHU8qa3Z2TvHsG.swift" "'+ newFileName + '.swift"', function (err, out, stderror) {
        var filePath = xc_projName + "/" + newFileName + '.swift';

        // now the important step: adding the file reference to the .xcodeproj file
        cd(buildProjects_path);
        exec('./XcodeProjAdder -XCP "'+xcpath+'" -SCSV "'+ filePath + '"', function (err, out, stderror) {
          // console.log(xcpath);
          res.send({"Success":"Successfully added file named "+newFileName+".swift"});

        }); // end exec

      });

    });
  } else {
    res.statusCode = 500;
    res.send({"Error": "Invalid parameters"});

  }

  // note: the file has to already have been made and added into the directory, the following command just links it to the .xcodeproj so Xcode can run its debuggers through it
  // $ ./XcodeProjAdder -XCP PROJECT_ID/XC_PROJECT_NAME/XC_PROJECT_NAME.xcodeproj -SCSV PROJECT_NAME/NEW_FILE.swift

});


// Delete a file from the Xcode project directory
// POST {'id':string, 'fileName':string}
app.post('/delete-file', function (req, res) {
    cd(buildProjects_path);
    res.setHeader('Content-Type', 'application/json');

    if (req.body.id) {
        var project_uid = req.body.id;
        var deleteFileName = req.body.fileName;

        var id_dir = ls(project_uid)[0];
        var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

        for (var z = 0; z < ls(project_uid + "/" + id_dir).length; z++) {
          if (ls(project_uid + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
            xc_projName = ls(project_uid + "/" + id_dir)[z].replace('.xcodeproj', '');
          }
        }

        var xcpath = buildProjects_path + "/" + project_uid + "/" + id_dir + "/"+ xc_projName + ".xcodeproj";
        cd(project_uid + "/" + id_dir + "/" + xc_projName);

        // delete the file (this is way simpler than adding a new file)
        exec('rm -rf "'+ deleteFileName +'"', function (err, out, stderror) {
          console.log(('Attempting to remove file named '+deleteFileName).cyan);
          // console.log(JSON.stringify(ls()).yellow);

          if (err) {
            res.statusCode = 500;
            res.send({"Error": "There was an error deleting the file."});

          } else {
            cd(buildProjects_path + "/" + project_uid + "/" + id_dir + "/" + xc_projName + ".xcodeproj");

            // unfortunately we have to dig down to farthest depths of the project filetree to delete the file, as well as modify the core file of the .xcodeproj
            fs.readFile("project.pbxproj", 'utf-8', function (err, data) {
              if (err) {
                res.statusCode = 500;
                res.send({"Error": "There was an error deleting the file."});
              } else {
                // console.log(data);
                var lines = data.split('\n');
                console.log((lines.length + ' lines of code in the project.pbxproj').green);

                for (var h = 0; h < lines.length; h++) {
                  // find the various lines that contain the file we want to delete
                  if (lines[h].indexOf(deleteFileName) > -1) {
                    console.log(("Line "+ (h+1).toString() + " contains " + deleteFileName).red);
                    lines.splice(h, 1); // delete the line

                  }
                }

                var newFile = lines.join('\n');

                fs.writeFile("project.pbxproj", newFile, function (err) {
                  if (err) {
                    res.statusCode = 500;
                    res.send({"Error": "There was an error deleting the file."});

                  } else {
                    console.log(('Successfully rewrote project.pbxproj and deleted file named '+deleteFileName).green);
                    res.send({"Success": "Successfully deleted file named "+deleteFileName}); // finally, after that long process, we can finally notify the user that all is well

                  } //
                }); // end writeFile

              } // end if err within readFile

            }); // end readFile
          } // end if err rm -rf

        }); // end exec rm -rf
    } else {
      res.statusCode = 500;
      res.send({"Error": "Invalid parameters"});

    }
});


// Build an Xcode Project using the appetize.io on-screen simulator
// POST {'id':string}
app.post('/build-project', function (req, res) {
  // take the app back to the build-projects directory, as another route may have thrown the build server into a project directory instead
  cd(buildProjects_path);

  if (req.body.id) {
    // analytics
      var ip = req.connection.remoteAddress;
      // console.log("Request made from: " + ip);

      if (typeof client != "undefined") {
        satelize.satelize({ip:ip}, function(err, geoData) {
            // if data is JSON, we may wrap it in js object
            if (err) {
              // console.log("There was an error getting the user's location.");
            } else {
                var obj = JSON.parse(geoData);
                var location = obj.city + ", " + obj.region_code + ", " + obj.country_code3;
                var isp = obj.isp;
                var country = obj.country;
                var timezone = obj.timezone;

                client.addEvent("built_project", {"location": location, "isp": isp, "country": country, "timezone": timezone, "project_id": req.body.id}, function(err, res) {
                    // if (err) {
                    //     console.log("Oh no, an error logging built_project".red);
                    // } else {
                    //     console.log("Event built_project logged".green);
                    // }
                }); // end client addEvent

            } // end error handling
          }); // end satelize
      } // end if undefined

      var projectID = req.body.id;

      // $ xcodebuild -sdk iphonesimulator -project XCODEPROJ_PATH
      // this generates the build directory where you can zip up the file to upload to appetize

      var id_dir = ls(projectID)[0]; // project name e.g. WWDC
      var project_dir = ls(projectID+"/"+id_dir);

      // go into the directory
      cd(projectID+"/"+id_dir);

      // various methods of filtering through the success build logs
      // $ xcodebuild -sdk iphonesimulator -configuration Debug -verbose > /dev/null

      // various methods of filtering the error logs
      // $ xcodebuild -sdk iphonesimulator -configuration Release -verbose | egrep '^(/.+:[0-9+:[0-9]+:.(error|warning):|fatal|===)' -
      // $ xcodebuild -sdk iphonesimulator -configuration Release -verbose | grep -A 5 error:

      console.log('Attempting to build the project...'.red);

      // build using Xcode
      exec('xcodebuild -sdk iphonesimulator -configuration Release -verbose | grep -A 5 error:', function (err, xcode_out, stderror) {
        cd('build/Release-iphonesimulator');
        console.log(xcode_out.green);

        cd(buildProjects_path);
        var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

        for (var z = 0; z < ls(projectID + "/" + id_dir).length; z++) {
          if (ls(projectID + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
            xc_projName = ls(projectID + "/" + id_dir)[z].replace('.xcodeproj', '');
          }
        }

        var normalized = xc_projName.split(' ').join('\ ');
        // console.log('Normalized NAME: ' + normalized);
        // well this is important
        cd(projectID+"/"+id_dir + '/build/Release-iphonesimulator');

        // zip up the simulator executable
        exec('zip -r "'+projectID+'" "'+xc_projName+'.app"', function (err, out, stderror) {
          cd(buildProjects_path); // enter build-projects once again (using absolute paths!)
          // console.log(out.green);

          var path = projectID + "/" + id_dir + "/build/Release-iphonesimulator/" + projectID + ".zip";
          // console.log(buildProjects_path + path);

          var zip_dl_url = build_serverURL + "/" + path;
          console.log(".zip of simulator executable: " + zip_dl_url.cyan);
          // console.log(typeof xcode_out)

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
                      // console.log(message.body);
                      // console.log(message.body.publicURL != null);

                      if (message.body.publicURL != null) {
                          var public_key = (message.body.publicURL).split("/")[4];
                          console.log("Simulator Public Key: " + public_key.yellow);

                          var osVersion = "9.0"; // the version of iOS appetize should build for

                          var screenEmbed = '<iframe src="https://appetize.io/embed/'+public_key+'?device=iphone6&scale=75&autoplay=false&orientation=portrait&deviceColor=black&screenOnly=true&xdocMsg=true&osVersion='+ osVersion.toString() +'" width="282px" height="501px" frameborder="0" scrolling="no"></iframe>';
                          var deviceEmbed = '<iframe src="https://appetize.io/embed/'+public_key+'?device=iphone6&scale=75&autoplay=true&orientation=portrait&deviceColor=black&xdocMsg=true&osVersion='+ osVersion.toString() +'" width="312px" height="653px" frameborder="0" scrolling="no"></iframe>';

                          res.send({'simulatorURL': message.body.publicURL, "screenOnlyEmbedCode": screenEmbed, "fullDeviceEmbedCode": deviceEmbed, "console": xcode_out});
                        } else {
                          res.send({"BUILD_FAILED": "There was an error building your application."});
                        }
                  }
              }); // end request
          } else {// end if build succeeded
            res.send({"BUILD_FAILED": xcode_out});

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
// GET /get-project-details/{ID_STRING}
app.get('/get-project-details/:app_id', function (req, res) {
  cd(buildProjects_path);
  res.setHeader('Content-Type', 'application/json');

  var project_id = req.params.app_id;
  var id_dir = ls(project_id)[0]; // project directory

  var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

  for (var z = 0; z < ls(project_id + "/" + id_dir).length; z++) {
    if (ls(project_id + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
      xc_projName = ls(project_id + "/" + id_dir)[z].replace('.xcodeproj', '');
    }
  }

  var fileList = ls(project_id + "/" + id_dir + "/" + xc_projName);
  var assetCatalogDirname = "";
  for (var x = 0; x < fileList.length; x++) {
    var fileobj = fileList[x];
    if (fileobj.indexOf(".xcassets") > -1) {
      assetCatalogDirname = fileList[x];
      fileList.splice(x, 1);
    }
  }

  var assetCatalogList = ls(project_id + "/" + id_dir + "/" + xc_projName + "/" + assetCatalogDirname);

  res.send({"project": {"name": xc_projName, "file_count": fileList.length, "asset_count": assetCatalogList.length}});

});



// Route that generates an ad-hoc IPA file for the user to download onto their device (is this against Apple's terms?)
// POST {'id':string}
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
          // console.log(out);
          // console.log("\n");
          var xc_projName = ""; // suprisingly enough, people like to name their repository name differently than their .xcodeproj name

          for (var z = 0; z < ls(projectID + "/" + id_dir).length; z++) {
            if (ls(projectID + "/" + id_dir)[z].indexOf('.xcodeproj') > -1) {
              xc_projName = ls(projectID + "/" + id_dir)[z].replace('.xcodeproj', '');
            }
          }
          // console.log(('Xcode Project File Name: ' + xc_projName).red);
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
              // console.log(mainfest_plist_url);

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



// what happens when someone kills the server
process.on('SIGINT', function() {
    console.log("Killing Ringo Core server...".red);

    if (process.env.LOAD_BALANCER_URL) { // lets unregister this dead server
          clearInterval(reportBalancerTimer); // stop sending events to the load balancer

          serialNumber(function (err, value) { // basically for generating a unique id
              // console.log(value);

              request({
                  url: process.env.LOAD_BALANCER_URL + '/unregister-server/', //URL to hit
                  method: 'POST',
                  //Lets post the following key/values as form
                  json: {
                      server_id: value,
                      key: process.env.BALANCER_AUTH_KEY
                  }
              }, function(error, response, body){
                  if(error) {
                      // console.log(error);
                      console.log("Uh oh! The load balancer is probably down. Exiting anyway...".red);
                      if (process.env.NGROK_TUNNEL_PID) {
                        // ngrok.stop(process.env.NGROK_TUNNEL_PID);
                      }

                      process.exit(); // kill the application

                  } else {
                      console.log((response.statusCode, body).green);

                      if (process.env.NGROK_TUNNEL_PID) {
                        // ngrok.stop(process.env.NGROK_TUNNEL_PID);
                      }

                      process.exit();
              }
              }); // end request

          }); // end serial
    }

});


// what happens when an error occurs
process.on('uncaughtException', function (uncaughterr) {
  console.log(('Caught exception: ' + uncaughterr).red);

  if (typeof sendgrid !== "undefined") {
      getIP(function (err, ip) {
          if (err) {
              // every service in the list has failed
              console.log(err);
          } else {
              console.log("Attempting to send error report to " + process.env.REPORT_TO);

              sendgrid.send({
                to:       process.env.REPORT_TO,
                from:     'ringo-error@useringo.github.io',
                subject:  'Ringo Internal Error',
                text:     'The Ringo internal server error on machine with address ' + ip + ' ran into error: \n\n' + uncaughterr
              }, function(err, json) {
                if (err) { return console.error(err); }
                // console.log(json);
              });
          }

      }); // end getIP
  } // end typeof sendgrid

});


// function that returns the CPU load of the server (OS X compatible only)
// meant to be used as getServerLoad(function(out) { console.log(out); });
function getServerLoad(callback) {
  exec('uptime', function (err, out, stderror) {
    var uptimeStr = out;
    var sysValues = uptimeStr.split(', ');

    // find the amount of stress being put on the server CPU
    var loadLastMin;

    for (var i = 0; i < sysValues.length; i++) {
      if (sysValues[i].indexOf("load average") > -1) {
        var loadAvg = sysValues[i];
        loadLastMin = parseFloat(sysValues[i].split(' ')[2], 10);
      }
    }

    // find the number of CPUs (OS X only command) -- this is why you get a Mac server
    exec('sysctl -a | grep machdep.cpu | grep core_count', function (grepErr, grepOut, grepSTDError) {
      var numCPU = parseInt(grepOut.split(' ')[1].replace('\n', ''), 10);

      var loadPercentage = (loadLastMin/numCPU)*100;
      callback(loadPercentage); // return the load in a callback

    });

  }); // end $ uptime

} // end getServerLoad


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
