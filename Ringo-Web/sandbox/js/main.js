//setup before functions
var typingTimer;                //timer identifier
var doneTypingInterval = 1000;  //time in ms, 5 second for example

var hostname = "https://2e9ab5a8.ngrok.com"

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

    $("#statusValue").html('<img src="img/loading.gif" />&nbsp;&nbsp;Compiling');

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






var marker;

marker = null;

require(["ace/range"], function(range) {
  return marker = editor.getSession().addMarker(new range.Range(7, 0, 7, 2000), "warning", "line", true);
});

setTimeout(function() {
  return editor.getSession().removeMarker(marker);
}, 3000);



