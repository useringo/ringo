//setup before functions
var typingTimer;                //timer identifier
var doneTypingInterval = 1000;  //time in ms, 5 second for example


// IF YOU WANT TO USE YOUR OWN DEV SERVER RUNNING THE RINGO SERVER, SET HOSTNAME TO YOUR SERVERS ADDRESS
var lb = "http://localhost:3001";
var hostname = "";

$.get(lb+"/get-server-url", function (server_tunnel) {
	hostname = server_tunnel;
});


//on keyup, start the countdown
$('#editor').keyup(function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
});


//on keydown, clear the countdown
$('#editor').keydown(function(){
    clearTimeout(typingTimer);
});

$("#statusTime").text(moment().calendar());

// var contentType ="application/x-www-form-urlencoded; charset=utf-8";

//user is "finished typing," do something
function doneTyping () {
    var code = editor.getValue();

    $("#statusValue").html('Compiling');

    $.ajax({
	  type: "POST",
	  url: hostname + "/build-sandbox",
	  data: {"code": code},
	  error: function(err) { // I have no clue why, but the response gets passed through the error method
	  	console.log(err);

	  	$("#statusValue").text("Ready");
	  	$("#statusTime").text(moment().calendar());

	  	$("#outputArea").text(err.responseText);
	  	$("#outputArea").html($("#outputArea").text().split("\n").join("<br />"));
	  	$("#outputArea").append("<br /><br />");
	  },
	  dataType: 'json',
	});

}


// execute onload
$(document).ready(function () {
	setTimeout(doneTyping, 2000); // wait after 2 seconds
});





var marker;

marker = null;

require(["ace/range"], function(range) {
  return marker = editor.getSession().addMarker(new range.Range(7, 0, 7, 2000), "warning", "line", true);
});

setTimeout(function() {
  return editor.getSession().removeMarker(marker);
}, 3000);
