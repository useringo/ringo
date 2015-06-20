//setup before functions
var typingTimer;                //timer identifier
var doneTypingInterval = 1000;  //time in ms, 5 second for example

//on keyup, start the countdown
$('#codeArea').keyup(function(){
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
});

//on keydown, clear the countdown 
$('#codeArea').keydown(function(){
    clearTimeout(typingTimer);
});


// var contentType ="application/x-www-form-urlencoded; charset=utf-8";

//user is "finished typing," do something
function doneTyping () {
    var code = document.getElementById("codeArea").value;

    $.ajax({
	  type: "POST",
	  url: "http://6ae2a7b7.ngrok.io/build-sandbox",
	  data: {"code": code},
	  error: function(err) { // I have no clue why, but the response gets passed through the error method
	  	console.log(err);
	  	$("#outputArea").text(err.responseText);
	  },
	  dataType: 'json',
	});

}