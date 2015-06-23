//setup before functions
var typingTimer;                //timer identifier
var doneTypingInterval = 1000;  //time in ms, 5 second for example

// VERY TERMPORARY
var project_id = "JsXa3C3BxIPUomUwLk5"; //prompt("Type your Ringo Project ID");
var files = [];

loadFiles(); // load the file menu

// need to come up with a better way of asking for project ID


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


}


function loadFiles() {
	$.ajax({
		type: 'POST',
		url: 'http://66737bb1.ngrok.io/get-project-contents',
		data: {"id": project_id},
		error: function (err) {
			console.log(err);
		},
		success: function (data) {
			console.log(data);
			data.files.shift();

			files = data.files;


			for (var i = 0; i < data.files.length; i++) {

				console.log(data.files[i].name);

				$("#fileMenu").append(data.files[i].name + "<br />")
			}

			editor.setValue(files[0].data);


		},
		dataType: "json"
	});

}



// run the app on the iOS simulator
$("#runButton").click(function() {
	$.ajax({
		type: 'POST',
		url: 'http://66737bb1.ngrok.io/build-project',
		data: {"id": project_id},
		error: function (err) {
			console.log(err);
		}, 
		success: function (data) {
			console.log(data);
			$("#outputArea").html(data.fullDeviceEmbedCode);


		},
		dataType: "json"
	});


});

