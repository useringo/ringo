```         _                 
   _____(_)___  ____ _____ 
  / ___/ / __ \/ __ `/ __ \
 / /  / / / / / /_/ / /_/ /
/_/  /_/_/ /_/\__, /\____/ 
             /____/        
```
# Ringo

Harness the power of Xcode using a simple, extensible, hackable API.

### What is it?
Ringo is a simple web server written in [Node.js](https://nodejs.org) that can allow you to harness the power of Xcode by using a set of simple API endpoints. You can run the core build server on your own Mac hardware, and from there start writing applications that take advantage of Xcode. I built Ringo for the purpose of having the ability to build and run iOS applications from any web browser (or any platform that has an internet connection for that matter). 

Currently, the Ringo core build server requires Mac hardware in order to run. However, Swift is said to go open-source later this year, and this hopefully will open some opportunities to get rid of the necessity of a Mac.

### Installation
Firstly, you're going to need to have Xcode installed on your Mac. Once you have that installed you're going to need the Xcode command line tools, which allow Ringo to interface with Xcode easily. Type the following into your command line to install them:

```$ xcode-select --install```

Clone the repository and navigate to your local copy of the build server:

``` $ git clone https://www.github.com/gmittal/ringo.git && cd ringo ```

Install the various dependencies:

``` $ npm install && brew install wget && gem install nomad-cli```

You're also going to need to populate your environment variables (stored in a .env file) with some important information. For now, Ringo uses [Appetize](http://www.appetize.io) to run your iOS apps in an in-browser simulator. That does require an API key, but they are free and easy to get ahold of. 
```
APPETIZE_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Once all of that is complete, it should be fairly easy to get the server running:

``` $ node app.js ```

The server should spit out an ngrok localhost tunnel which should allow you to access the server externally, allowing you to get up and running with hacking it.


#### Ready to start hacking with Ringo? Read the [docs](https://www.github.com/gmittal/ringo/wiki/Documentation).





### License

##### [TL;DR](https://tldrlegal.com/license/mit-license)

The MIT License (MIT)

Copyright (c) 2015 Gautam Mittal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
