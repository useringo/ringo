// Copyright 2015 Gautam Mittal under MIT License

var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var colors = require('colors');
var Jetty = require('jetty');
var jetty = new Jetty(process.stdout);
var prettyjson = require('prettyjson');

jetty.clear(); // clear the console

var port = 3001;

app.use(bodyParser());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var servers = {};
var ids = [];
var loadStats = [];

// Endpoint to serve the user so that it
app.get('/get-server-url', function (req, res) {
	if (ids.length > 0) { // at least one server has to have been registered
		var relaxedServer = loadStats[0];
    for (var id in servers) {
      if (servers[id].load == relaxedServer) {
        console.log('Server #['+id+'] with url['+servers[id].accessURL+']');
        res.send(servers[id].accessURL);
      }
    }

	} else {
		res.send("No servers have been registered.");
	}

});


// Register the server with the load balancer
app.post('/register-server', function (req, res) {
  if (req.body.key == process.env.BALANCER_AUTH_KEY) { // for security reasons, we have a secret key which prevents random people from registering their own servers with the production load balancer
  	if (req.body.tunnel) {
  		if (req.body.server_id) {
        if (req.body.load) {
          servers[req.body.server_id] = {
              'accessURL': req.body.tunnel,
              'load': req.body.load
          };

          if (ids.indexOf(req.body.server_id) == -1) { // if it doesn't already exist
            ids.push(req.body.server_id);
          }

          loadStats = [];
          for (var loadVal in servers) {
            var tmpLoadVal = servers[loadVal].load;
            loadStats.push(tmpLoadVal);
          }

          loadStats.sort(function(a,b){return a-b});

          // console.log(servers);
         
	  jetty.moveTo([0,0]);
	  jetty.text("Ringo Server Load Balancer\n\n".bold.underline.white + "SERVER IDs: ".bold.white + JSON.stringify(ids).cyan + "\n" + "SERVER LOAD: ".bold.white + JSON.stringify(loadStats).green+"\n\n");
	 
	  

          res.send("Successfully registered server in the load balancer.");
        } else {
          res.send(500, "There was an error registering the server with the load balancer. Missing load parameter.");
        } // end if req.body.load

  		} else {
  			res.send(500, "There was an error registering the server with the load balancer. Missing server_id parameter.");
  		}

  	} else {
  		res.send(500, "There was an error registering the server with the load balancer. Missing tunnel parameter.");
  	}
  } else {
    res.send(500, "Error. Unauthorized request.");
  }// end auth
});



// When a server dies, the load balancer should know
app.post('/unregister-server', function (req, res) {
if (req.body.key == process.env.BALANCER_AUTH_KEY) { // more security
  	if (req.body.server_id) {
  		var idIndex = ids.indexOf(req.body.server_id);
  		if (idIndex !== -1) { // make sure it exists
  			ids.splice(idIndex, 1); // delete it from the server id array

        // delete the load value from the loadStats array
        for (var i = 0; i < loadStats.length; i++) {
          if (loadStats[i] == servers[req.body.server_id].load) {
            loadStats.splice(i, 1);
          }
        }

  			delete servers[req.body.server_id]; // delete from the json object

  			console.log(servers);
  			console.log(ids);

  			res.send(200, "Server successfully removed from load balancer registry.");

  		} else {
  			res.send(500, "You cannot unregister servers that have not already been registered.");
  		}
  	} else {
  		res.send(500, "Invalid parameters. Error unregistering server with load balancer.");
  	}
  }
});


var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  //console.log(('Ringo load balancer listening at http://0.0.0.0:'+ port));
});
