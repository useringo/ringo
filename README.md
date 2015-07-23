# りんご (Ringo)

<img alt="Hacking the Apple ecosystem" src="https://s-media-cache-ak0.pinimg.com/236x/2f/36/2a/2f362aa5457d9b373a261e20a358d7d6.jpg" height="250px" />
<img alt="Steve Jobs would not approve of this open source madness" src="https://c1.staticflickr.com/7/6050/7000020847_4bfda0d049_b.jpg" height="250px" />
<!--![Steve Jobs would not approve](https://c1.staticflickr.com/7/6050/7000020847_4bfda0d049_b.jpg)-->

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


### Installation
Firstly, you're going to need to have the latest GM release of Xcode (currently v6.3) installed on your Mac. Once you have that installed you're going to need the ever so essential Xcode command line tools, which allow Node.js to interface with Xcode easily. Type the following into your command line to install them:

```$ xcode-select --install```

Clone the repository and navigate to your local copy of the build server:

``` $ git clone https://www.github.com/gmittal/ringo.git && cd ringo/build-server ```

Install the various dependencies:

``` $ sudo npm install && gem install nomad-cli && brew install wget zip unzip ```

You're also going to need to populate your environment variables with some important information. For now, Ringo uses [Appetize](http://www.appetize.io) to run your iOS apps in an in-browser simulator. That does require an API key, but they are free and easy to get ahold of. You'll also need to provide the absolute path to a ```build-projects``` directory where the server will store local copies of the generated Xcode projects.

```
APPETIZE_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
BUILD_PROJECTS_PATH=/Users/username/path/to/ringo/build-server/build-projects
```

Once all of that is complete, it should be fairly easy to get the server running:

``` $ node app.js ```

The server should spit out an ngrok localhost tunnel which should allow you to access the server externally, allowing you to get up and running with hacking it.
