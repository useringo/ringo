//setup before functions
var typingTimer;                //timer identifier
var doneTypingInterval = 1000;  //time in ms, 5 second for example


var hostname = "http://localhost:3000"; // https://33983d9e.ngrok.com

var project_id = ""; //prompt("Type your Ringo Project ID");
var project_name = "";

var placeholderData = "// Welcome to Ringo \n\
// A portable Xcode-based IDE in your browser \n\
// Built by Gautam Mittal \n\n\
// Ringo lets you do a ton of cool things, such as: \n\
//	- Edit, modify, debug, and build iOS projects that you create or have already created \n\
//	- Write iOS apps that use both Swift/Objective-C code \n\
//	- Write and test Swift playgrounds in the browser \n\
//  - View iOS apps through an online, in-browser iOS simulator at 60 FPS \n\
//  - Harness the power of Xcode without the need for expensive hardware and software (you could use this on the Chromebook, and get nearly identical performance) \n\
\n\
\n\
// IF YOU HAVE QUESTIONS OR WANT TO LEARN MORE ABOUT RINGO, SEND AN EMAIL TO gautam@mittal.net \n\
\n\
\n\
// GET STARTED BY HITTING ONE OF THE BUTTONS IN THE TOP RIGHT CORNER TO EITHER CREATE, GIT CLONE, OR UPLOAD AN XCODE PROJECT. \n\
\n\
//                  %%\n\
//                 %%%\n\
//                %%%%\n\
//      %%%%%%*   %%%  *%%%%%%\n\
//    %%%%%%%%%%% %% *%%%%%%%%%%%\n\
//   !!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\
//  !!!!!!!!!!!!!!!!!!!!!!!!!!!\n\
//  {{{{{{{{{{{{{{{{{{{{{{{{{{\n\
//  {{{{{{{{{{{{{{{{{{{{{{{{{{\n\
//  &&&&&&&&&&&&&&&&&&&&&&&&&&&\n\
//  &&&&&&&&&&&&&&&&&&&&&&&&&&&&&\n\
// 	$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$\n\
//   $$$$$$$$$$$$$$$$$$$$$$$$$$$$$\n\
//    %%%%%%%%%%%%%%%%%%%%%%%%%%%\n\
//     %%%%%%%%%%%%%%%%%%%%%%%%%\n\
//      %%%%%%%%%*****%%%%%%%$\n\
//         %%%%*       *%%%%\n\
\
";


var files = [{"name": "INTRODUCTION", "data": placeholderData}];


var currentFile = "";

var currentData = editor.getValue();

var currentUploadedFileData = "";

var currentUploadAssetData = "";


loadFiles(); // load the file menu


// back up 
$("#fileMenu").append("<div name=\"INTRODUCTION\" onclick=\"javascript: currentFile = $(this).attr('name'); $('#fileMenu div').css({'background-color': 'transparent', \'font-weight\': \'normal\', \'color\': \'black\'}); $(this).css({'background-color': 'rgb(14, 101, 227)', 'font-weight':'bold', 'color':'white'}); updateEditor();\">Getting Started.swift</div>");
editor.setValue(files[0].data, -1);
editor.scrollToLine(0);



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

	    var withoutImages = [];

	    for (var j = 0; j < files.length; j++) {
	    	if (files[j].type != "xcasset") { // we don't want to resave the image files
	    		withoutImages.push(files[j]);
	    	}
	    }
	    //tests
	    // console.log("File list without imagesets: "+ JSON.stringify(withoutImages));

		$.ajax({
			type: 'POST',
			url: hostname+'/update-project-contents',
			data: {"id": project_id, "files": withoutImages},
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
	if (project_id.length > 0) {

		$("#fileMenu").html("");


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


				// get the .xcassets files
				$.ajax({
				    type: 'POST',
				    url: hostname+'/get-image-xcassets',
				    data: {"id": project_id},
				    error: function (err) {
				    	
				    	if (err) {
							// Do nothin'
							console.log(err);
				    	}

				    }, 
				    success: function (imageData) {
				        // console.log(data);

				        if (imageData) { // that means it worked...
				        	var images = imageData.files;
					        // images.shift();
					        images.splice(images.length - 1, 1);

					        // add a new property to the image
					        for (var l = 0; l < images.length; l++) {
					        	var tmp = images[l];
					        	tmp["type"] = "xcasset";
					        	images[l] = tmp;
					        }
					      
							files = files.concat(images);


							// console.log()
							console.log(files);


							for (var i = 0; i < files.length; i++) {

								console.log(files[i].name);

								if (files[i].type == "xcasset") { // this would indicate that the file that is being processed is an imageset, a non-removable file
									$("#fileMenu").append('<div name="'+ files[i].name +'" onclick=\"javascript: currentFile = $(this).attr(\'name\'); $(\'#fileMenu div\').css({\'background-color\': \'transparent\', \'font-weight\': \'normal\', \'color\': \'black\'}); $(this).css({\'background-color\': \'rgb(14, 101, 227)\', \'font-weight\':\'bold\', \'color\':\'white\'}); updateEditor();\">'+ start_and_end(files[i].name) + '</div>');
								} else {
									$("#fileMenu").append('<div name="'+ files[i].name +'" onclick=\"javascript: currentFile = $(this).attr(\'name\'); $(\'#fileMenu div\').css({\'background-color\': \'transparent\', \'font-weight\': \'normal\', \'color\': \'black\'}); $(this).css({\'background-color\': \'rgb(14, 101, 227)\', \'font-weight\':\'bold\', \'color\':\'white\'}); updateEditor();\">'+ start_and_end(files[i].name) + '</div><span class="deleteFileButton" name="'+ files[i].name +'" onclick="javascript: deleteFile($(this).attr(\'name\'));">-</span>');
								}

								$("#fileMenu div:nth-child(1)").css({'background-color': 'rgb(14, 101, 227)', 'font-weight':'bold', 'color':'white'});
								

							}

							editor.setValue(files[0].data, -1);
							editor.scrollToLine(0);
							currentFile = files[0].name;

							$.get(hostname+'/get-project-details/'+project_id, function (detailData) {
								console.log(detailData)

								project_name = detailData.project.name;

								console.log(detailData.project.name)


								$("#appName").text(start_and_end_title(project_name));
								$("#fileMenu").prepend("<div style=\"margin-top: 5px;\"><b><img height=\"20pt\" style=\"vertical-align:middle;margin-top: -5px;\" src=\"img/folder-icon.svg\" />&nbsp;"+ start_and_end(project_name) +"</b></div><span id=\"addFileButton\">+</span>");

								// add addFileButton click listener
								$("#addFileButton").click(function() { // add file to your project directory
									if (project_id.length > 0) {
										// console.log("Openi);
										location.href = "#addFileFork";	
									} 
									
								});


								// update the editor
								updateEditor();


							});



				        }

				    },
				    dataType: "json"
				});	// end ajax request






			},
			dataType: "json"
		});

	} // end if project_id.length > 0

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

// new project
listener.simple_combo("alt n", function() {
    // console.log("used keyboard shortcut to start buildProject()");

    location.href = "#createModal";
});

// upload project
listener.simple_combo("alt u", function() {
    // console.log("used keyboard shortcut to start buildProject()");

    location.href = "#openModal";
});

// clone git repo
listener.simple_combo("alt g", function() {
    // console.log("used keyboard shortcut to start buildProject()");

    location.href = "#gitModal";
});

// download code
listener.simple_combo("alt d", function() {
    // console.log("used keyboard shortcut to start buildProject()");

    if (project_id.length > 0) {
		console.log("Requesting a ZIP file with your code...");
		location.href = (hostname + '/download-project/'+project_id);	
	} 
});



function buildProject() {
	
	if (project_id.length > 0) {
	// save files, then build	
	    var code = editor.getValue();

	    // if (code != currentData) {

	    	$("#statusValue").html('<img src="img/loading.gif" />&nbsp;&nbsp;Building');
			$("#outputArea").html('<center><img src="img/Preloader_3.gif" /><br/><br />Building your application...<center>');

	    	// currentData = code;

		    for (var k = 0; k < files.length; k++) {
		    	var filedata = files[k];
		    	if (filedata.name == currentFile) {
		    		filedata.data = code;
		    	}
		    }

		    var withoutImages = [];

		    for (var j = 0; j < files.length; j++) {
		    	if (files[j].type != "xcasset") { // we don't want to resave the image files
		    		withoutImages.push(files[j]);
		    	}
		    }


			$.ajax({
				type: 'POST',
				url: hostname+'/update-project-contents',
				data: {"id": project_id, "files": withoutImages},
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


	} // end if project_id.length > 0


}




$("#fileMenu").click(function() {
	console.log(currentFile);

	console.log($(this).attr("name"));



});


$("#ipaDLButton").click(function() { // download your code from the server
	if (project_id.length > 0) {
		console.log("Requesting a ZIP file with your code...");
		location.href = (hostname + '/download-project/'+project_id);	
	} 
	
});



$("#ULButton").click(function() {
	location.href = "#openModal";
});

$("#GCButton").click(function() {
	location.href = "#gitModal";
});

$("#createProjectButton").click(function() {
	location.href = "#createModal";
});

function updateEditor() {
	for (var j = 0; j < files.length; j++) {
		if (files[j].name == currentFile) {
			editor.setValue(files[j].data, -1);

			var fileExt = currentFile;

			if (fileExt.includes(".plist")) {
				editor.session.setMode(modelist.getModeForPath(".xml").mode);
			} else if (fileExt.includes(".xib")) {
				editor.session.setMode(modelist.getModeForPath(".xml").mode);
			} else if (fileExt.includes(".storyboard")) {
				editor.session.setMode(modelist.getModeForPath(".xml").mode);
			} else if (fileExt.includes(".swift")) {
				editor.session.setMode(modelist.getModeForPath(".rs").mode);
			} else {
				editor.session.setMode(modelist.getModeForPath(fileExt).mode);
			}
			
		}
	}

	editor.scrollToLine(0);
}

// Truncating strings, but Mac style
function start_and_end(str) {
  if (str.length > 30) {
    return str.substr(0, 13) + '...' + str.substr(str.length-7, str.length);
  }
  return str;
}

function start_and_end_title(str) {
  if (str.length > 20) {
    return str.substr(0, 13) + '...' + str.substr(str.length-6, str.length);
  }
  return str;
}





// handle file upload requests


function handleFileSelect(evt) {
	var files = evt.target.files; // FileList object

	// FileReader.readAsDataURL(Blob|File)

	// files is a FileList of File objects. List some properties.
	var output = [];
	for (var i = 0, f; f = files[i]; i++) {
	  output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
	              f.size/1000000, ' MB, last modified: ',
	              f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
	              '</li>');
	}
	document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';


	// Read the ZIP file data
	  for (var i = 0, f; f = files[i]; i++) {

	      // Only process zip files.
	      if (!f.type.match('zip.*')) {
	        continue;
	      }

	      var reader = new FileReader();

	      // Closure to capture the file information.
	      reader.onload = (function(theFile) {
	        return function(e) {
	  

	          console.log(e.target.result);
	          currentUploadedFileData = e.target.result;



	            



	        };
	      })(f);

	      // Read in the image file as a data URL.
	      reader.readAsDataURL(f);


	    }

	} // end handleFileSelect function





	document.getElementById('files').addEventListener('change', handleFileSelect, false);




	function handleAssetSelect(evt) {
		var files = evt.target.files; // FileList object

		// FileReader.readAsDataURL(Blob|File)

		// files is a FileList of File objects. List some properties.
		var output = [];
		for (var i = 0, f; f = files[i]; i++) {
		  output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
		              f.size/1000000, ' MB, last modified: ',
		              f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
		              '</li>');
		}
		document.getElementById('assetList').innerHTML = '<ul>' + output.join('') + '</ul>';


		// Read the ZIP file data
		  for (var i = 0, f; f = files[i]; i++) {

		      // Only process zip files.
		      if (!f.type.match('image.*')) {
		        continue;
		      }

		      var reader = new FileReader();

		      // Closure to capture the file information.
		      reader.onload = (function(theFile) {
		        return function(e) {
		  

		          console.log(e.target.result);
		          currentUploadAssetData = e.target.result;



		            



		        };
		      })(f);

		      // Read in the image file as a data URL.
		      reader.readAsDataURL(f);


		    }

		} // end handleFileSelect function


		document.getElementById('assets').addEventListener('change', handleAssetSelect, false);




		function addXcasset() {
			

			if ($("#assetList").text().length > 0) {
				if ($("#addXcassetModal").children("div").children("center").children("#xcassetNameInput").val().length > 0) {
					console.log("Request to generate new xcasset approved.");

					$(".awesomeButton").prop("disabled", true);

			  		$.ajax({
					    type: 'POST',
					    url: hostname+'/add-image-xcasset',
					    data: {"file": currentUploadAssetData, "id": project_id, "assetName": $("#addXcassetModal").children("div").children("center").children("#xcassetNameInput").val()},
					    error: function (err) {
					        console.log(err);

					        $(".awesomeButton").prop("disabled", false);

					        $("#assetList").text("");
				        	$("#assetList").append('<br /><br /><span style="color:red;">An error occurred. Try again.</span>');
					        // if (err) {
					        // 	console.log("THERE WAS AN ERROR UPLOADING THE FILE");
					        // }

					    }, 
					    success: function (data) {
					        console.log(data);

					        

					        // if (data.Error) 
					        // {
					        // 	$("output").text("");
					        // 	$("output").append('<br /><br /><span style="color:red;">An error occurred. Try again.</span>');
					        // } else {
					        // 	location.href = "#";
						        
					        // }

					        if (data) {
					        	$("#addXcassetModal").children("div").children("center").children("#xcassetNameInput").val("Success!");

					    		setTimeout(function() {
					    			$("#addXcassetModal").children("div").children("center").children("#xcassetNameInput").val("");
					    			location.href = "#";

					    			loadFiles();

					    			$(".awesomeButton").prop("disabled", false);

					    		}, 3000);

					        }


			;


					        

					    },
					    dataType: "json"
					}); // end ajax request

				} // end if text field length
			} // end if assetList.length

		} // end addXcasset function





	  	function uploadFile() {
	  		$(".awesomeButton").prop("disabled", true);

	  		$.ajax({
			    type: 'POST',
			    url: hostname+'/upload-project-zip',
			    data: {"file": currentUploadedFileData},
			    error: function (err) {
			        console.log(err);

			        $(".awesomeButton").prop("disabled", false);

			        $("#list").text("");
		        	$("#list").append('<br /><br /><span style="color:red;">An error occurred. Try again.</span>');
			        // if (err) {
			        // 	console.log("THERE WAS AN ERROR UPLOADING THE FILE");
			        // }

			    }, 
			    success: function (data) {
			        console.log(data);

			        

			        if (data.Error) 
			        {
			        	$("#list").text("");
			        	$("#list").append('<br /><br /><span style="color:red;">An error occurred. Try again.</span>');
			        } else {
			        	location.href = "#";

				        initializeNewProject(data.id);
			        }

			        $(".awesomeButton").prop("disabled", false);


			        

			    },
			    dataType: "json"
			});
	  	}


	  	function gitClone() {
	  		if ($("#gitModal").children("div").children("center").children("#gitCloneURL").val().length > 0) {
	  			console.log("Request to clone to git approved.");

	  			$(".awesomeButton").prop("disabled", true);

	  			$.ajax({
				    type: 'POST',
				    url: hostname+'/clone-git-project',
				    data: {"url": $("#gitModal").children("div").children("center").children("#gitCloneURL").val()},
				    error: function (err) {
				    	

				    	if (err) {
				    		$("#gitModal").children("div").children("center").children("#gitCloneURL").val("There was an error. Try again.");

				    		setTimeout(function() {
				    			$("#gitModal").children("div").children("center").children("#gitCloneURL").val("");
				    			// location.href = "#";

				    			$(".awesomeButton").prop("disabled", false);
				    		}, 3000);
				    	}
				        // console.log(err);
				    }, 
				    success: function (data) {
				        console.log(data);
				        

				        if (data) {
				        	$("#gitModal").children("div").children("center").children("#gitCloneURL").val("Success!");

				    		setTimeout(function() {
				    			$("#gitModal").children("div").children("center").children("#gitCloneURL").val("");
				    			location.href = "#";

				    			initializeNewProject(data.uid);

				    			$(".awesomeButton").prop("disabled", false);

				    		}, 3000);

				        }


				    },
				    dataType: "json"
				});	
	  		}	
			
	  	}



	  	function createProject() {
	  		if ($("#createModal").children("div").children("center").children("#createName").val().length > 0) {
	  			console.log("Request to create project approved.");

	  			$(".awesomeButton").prop("disabled", true);

	  			var templateType = $("#createModal").children("div").children("center").children("#templateName").val();

	  			// console.log()

	  			$.ajax({
				    type: 'POST',
				    url: hostname+'/create-project',
				    data: {"projectName": $("#createModal").children("div").children("center").children("#createName").val(), "template": templateType},
				    error: function (err) {
				    	

				    	if (err) {
				    		$("#createModal").children("div").children("center").children("#createName").val("There was an error. Try again.");

				    		setTimeout(function() {
				    			$("#createModal").children("div").children("center").children("#createName").val("");
				    			$(".awesomeButton").prop("disabled", false);
				    		}, 3000);
				    	}
				        // console.log(err);
				    }, 
				    success: function (data) {
				        console.log(data);

				        

				        if (data) {
				        	$("#createModal").children("div").children("center").children("#createName").val("Success!");

				    		setTimeout(function() {
				    			$("#createModal").children("div").children("center").children("#createName").val("");
				    			location.href = "#";

				    			initializeNewProject(data.uid);

				    			$(".awesomeButton").prop("disabled", false);

				    		}, 3000);

				        }


				    },
				    dataType: "json"
				});	// end ajax request

	  		}
	  	}


	  	function addFileToProject() {
	  		if ($("#addFileModal").children("div").children("center").children("#newFileNameInput").val().length > 0) {
	  			console.log("Request to create file approved.");

	  			$(".awesomeButton").prop("disabled", true);


	  			$.ajax({
				    type: 'POST',
				    url: hostname+'/add-file',
				    data: {"fileName": $("#addFileModal").children("div").children("center").children("#newFileNameInput").val(), "id": project_id},
				    error: function (err) {
				    	

				    	if (err) {
				    		$("#addFileModal").children("div").children("center").children("#newFileNameInput").val("There was an error. Try again.");

				    		setTimeout(function() {
				    			$("#addFileModal").children("div").children("center").children("#newFileNameInput").val("");
				    			$(".awesomeButton").prop("disabled", false);
				    		}, 3000);
				    	}
				        // console.log(err);
				    }, 
				    success: function (data) {
				        console.log(data);

				        

				        if (data) {
				        	$("#addFileModal").children("div").children("center").children("#newFileNameInput").val("Success!");

				    		setTimeout(function() {
				    			$("#addFileModal").children("div").children("center").children("#newFileNameInput").val("");
				    			location.href = "#";

				    			// reload the files
				    			loadFiles();
				    			// initializeNewProject(data.uid);

				    			$(".awesomeButton").prop("disabled", false);

				    		}, 3000);

				        }


				    },
				    dataType: "json"
				});	// end ajax request

	  		}
	  	}


	  	function deleteFile(fileElement) {
	  		console.log(fileElement); // fileName to delete

	  		$.ajax({
			    type: 'POST',
			    url: hostname+'/delete-file',
			    data: {"fileName": fileElement, "id": project_id},
			    error: function (err) {
			    	

			    	if (err) {
						// Do nothin'
						console.log(err);
			    	}

			    }, 
			    success: function (data) {
			        console.log(data);

			        

			        if (data) {
			        	// that means it worked...
						loadFiles();

			        }


			    },
			    dataType: "json"
			});	// end ajax request


	  	}



	  	// not actually sure if this works, so far it doesn't seem to do so at all
	  	function initializeNewProject(id) {
	  		project_id = id;
	  		project_name = "";
			files = [];

			currentFile = "";

			currentData = editor.getValue();

			currentUploadedFileData = "";

			$("#fileMenu").html("");


			loadFiles(); // load the file menu with the new updated data
	  	}





