# りんご (Ringo)
Wouldn't it be cool if we had the ability to build native mobile apps that normally require expensive hardware and advanced software, all in the browser?


### What is it?
Ringo is a mobile development environment, similar to Xcode, that (for now) allows you to build native iOS applications in Swift all from the comfort of your favorite browser.


### How does it work?
Ringo is actually very simple under the hood. Ringo compiles your project's code by sending it to a remote Mac server, compiling it with Xcode, and then sending the results back to your browser.


##### What's Going On During a Normal Project Build Cycle?
1. Ringo sends your project code to a remote Mac
2. The remote Mac then runs your code through Xcode using some simple build commands, which outputs an executable that would normally be run in the iOS Simulator
3. The simulator executable is zipped up and then uploaded to https://appetize.io/, a simple API which Ringo is using (temporarily) to handle displaying your compiled application in the browser
4. Appetize returns a URL and some HTML code which the Mac server then sends back to your browser which displays a streamed video of your app

##### How do the Swift Sandboxes Run? (this is much simpler than the explanation above)
1. Ringo sends your code to a remote Mac server
2. The Mac runs your code through a Swift REPL which is built-in to Xcode (this also handles debugging)
3. The Mac server then sends the output back which is displayed in your browser.


### Plans for the Future
Currently, I have a very basic version of Xcode working in the browser. It may not be as extensive as Xcode, but it still allows you to edit and run iOS apps in the browser. Some plans for the future include better debugging and logging in the browser. In addition, I plan on building a method of testing your iOS applications on your own iOS device via some OTA browser magic. I've also considered extending this project to the Android SDK, however, I've heard that it is possible to compile Swift applications into native Android applications, and am considering building a way to make Ringo generate APK files in addition to display an Android simulator.
