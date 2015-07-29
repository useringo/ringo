var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var port = 3001;

app.use(bodyParser());


var servers = [];
var currentServer = 0;

// We only have two servers at the moment

// Endpoint to serve the user so that it 
app.get('/get-server-url', function (req, res) {
  if (currentServer == 0) {

  	res.send();
  }

  
});


app.get('/register-server', function (req, res) {
	if (req.body.tunnel) {
		if (req.body.server_id) {
			var server_data = {};
			server_data[req.body.server_id] = req.body.tunnel;
			servers.push(server_data);
			
			console.log(servers);
		
		}
		
	}
});



var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});