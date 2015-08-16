// This is the Ringo local frontend config file
// Edit the various variables to fit your needs.

// load balancer ping URL
var BALANCER_URL = 'http://localhost:3001';

// data shown in the project editor on startup
var PROJECT_PLACEHOLDER_DATA = "// Welcome to Ringo \n\
// A portable Xcode-based IDE in your browser \n\
// Built by Gautam Mittal \n\n\
// Ringo lets you do a ton of cool things, such as: \n\
//	- Edit, modify, debug, and build iOS projects that you create or have already created \n\
//	- Write iOS apps that use both Swift/Objective-C code \n\
//	- Write and test Swift playgrounds in the browser \n\
//  - View iOS apps through an online, in-browser iOS simulator \n\
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

// data shown in the sandbox editor on startup
var SANDBOX_PLACEHOLDER_DATA = '// Sandbox (noun): a virtual space in which new or untested software can be run \n\
// Swift reference: http://apple.co/1M0bjSG\n\
\n\
\n\
println("Hello, world");\n\
// This is where you write code\n\
// Just start coding, and Ringo will automatically build your and test your code\n\
// The output will be displayed in the right pane';
