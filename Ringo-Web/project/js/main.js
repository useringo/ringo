//setup before functions
var typingTimer;                //timer identifier
var doneTypingInterval = 1000;  //time in ms, 5 second for example

var hostname = "https://32f358f.ngrok.com"

// VERY TERMPORARY
var project_id = "JtepQZ0rgVKN1VSh1y9"; //prompt("Type your Ringo Project ID");
var project_name = "";
var files = [];

var currentFile = "";

var currentData = editor.getValue();


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

    if (code != currentData) {

    	currentData = code;

	    for (var k = 0; k < files.length; k++) {
	    	var filedata = files[k];
	    	if (filedata.name == currentFile) {
	    		filedata.data = code;
	    	}
	    }

		$.ajax({
			type: 'POST',
			url: hostname+'/update-project-contents',
			data: {"id": project_id, "files": files},
			error: function (err) {
				console.log(err);
			}, 
			success: function (data) {
				console.log(data);

				// $("#statusValue").text("Ready");
			  	// $("#statusTime").text(moment().calendar());

				// $("#outputArea").html("<center>"+ data.fullDeviceEmbedCode +"</center>");


			},
			dataType: "json"
		});

	}


}


function loadFiles() {
	$.ajax({
		type: 'POST',
		url: hostname+'/get-project-contents',
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

				$("#fileMenu").append('<div name="'+ data.files[i].name +'" onclick=\"javascript: currentFile = $(this).attr(\'name\'); $(\'#fileMenu div\').css({\'background-color\': \'transparent\', \'font-weight\': \'normal\', \'color\': \'black\'}); $(this).css({\'background-color\': \'rgb(14, 101, 227)\', \'font-weight\':\'bold\', \'color\':\'white\'}); updateEditor();\">'+start_and_end(data.files[i].name) + '</div>');
			}

			editor.setValue(files[0].data, -1);
			editor.scrollToLine(0);
			currentFile = files[0].name;

			$.get(hostname+'/get-project-details/'+project_id, function (data) {
				console.log(data)

				project_name = data.project.name;

				$("#appName").text(project_name);
				$("#fileMenu").prepend("<div style=\"margin-top: 5px;\"><b><img height=\"20pt\" style=\"vertical-align:middle;margin-top: -5px;\" src=\"img/folder-icon.svg\" />&nbsp;"+ data.project.name +"</b></div>")
			
				// buildProject();

			});



		},
		dataType: "json"
	});

}



// run the app on the iOS simulator
$("#runButton").click(function() {
	buildProject();

});


// enable keyboard shortcuts
var listener = new window.keypress.Listener();

// use alt-R to do the same thing as the #runButton
listener.simple_combo("alt r", function() {
    // console.log("used keyboard shortcut to start buildProject()");

    buildProject();
});


function buildProject() {
	

	// save files, then build	
	    var code = editor.getValue();

	    // if (code != currentData) {

	    	$("#statusValue").html('<img src="img/loading.gif" />&nbsp;&nbsp;Building');
			$("#outputArea").html('<center>Building your application...</center>');

	    	// currentData = code;

		    for (var k = 0; k < files.length; k++) {
		    	var filedata = files[k];
		    	if (filedata.name == currentFile) {
		    		filedata.data = code;
		    	}
		    }

			$.ajax({
				type: 'POST',
				url: hostname+'/update-project-contents',
				data: {"id": project_id, "files": files},
				error: function (err) {
					console.log(err);
					console.log("Saving files prior to building...");

					// after successfully saving the files, build for simulator
						$.ajax({
							type: 'POST',
							url: hostname +'/build-project',
							data: {"id": project_id},
							error: function (err) {
								console.log(err);
							}, 
							success: function (data) {
								console.log(data);

								$("#statusValue").text("Ready");
							  	$("#statusTime").text(moment().calendar());

								$("#outputArea").html("<center>"+ data.fullDeviceEmbedCode +"</center>");

								if (data.BUILD_FAILED) {
									$("#statusValue").text("Failed");
									$("#outputArea").text(data.BUILD_FAILED);
									var normalized = ($("#outputArea").text()).split("\n").join("<br />");
									$("#outputArea").html("<div style=\"margin-left: 10px; margin-right: 10px;\"><span style=\"color:red; font-weight:bold;\">BUILD FAILED</span><br /><div>" + normalized + "</div><br /><br /></div>");

								}

							},
							dataType: "json"
						});



				}, 
				success: function (data) {
					console.log(data);


					

				},
				dataType: "json"
			});

		// }





}




$("#fileMenu").click(function() {
	console.log(currentFile);

	console.log($(this).attr("name"));



});


$("#ipaDLButton").click(function() { // download your code from the server
	location.href = (hostname + '/download-project/'+project_id);
});



function updateEditor() {
	for (var j = 0; j < files.length; j++) {
		if (files[j].name == currentFile) {
			editor.setValue(files[j].data, -1);
		}
	}

	editor.scrollToLine(0);
}

// Truncating strings, but Mac style
function start_and_end(str) {
  if (str.length > 36) {
    return str.substr(0, 13) + '...' + str.substr(str.length-7, str.length);
  }
  return str;
}






