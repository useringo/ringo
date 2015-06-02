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


var contentType ="application/x-www-form-urlencoded; charset=utf-8";

//user is "finished typing," do something
function doneTyping () {
    var code = document.getElementById("codeArea").value;

    $.ajax({
	  type: "POST",
	  url: "http://gautam-mittal-wwdc.ngrok.com/build",
	  data: "code="+code,
	  success: function(data) {
	  	alert(data);
	  },
	  dataType: 'json',
	  // crossDomain: true,
	  contentType:contentType,
	});

}