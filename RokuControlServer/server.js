var http = require('http');
var https = require('https');
var fs = require('fs');
var urllib = require("url");
var Client = require('node-ssdp').Client;
var dgram = require('dgram');

//null will cause the server to discover the Roku on startup, hard coding a value will allow for faster startups
// When manually setting this, include the protocol, port, and trailing slash eg:
// var rokuAddress = "http://192.168.1.100:8060/";
var rokuAddress = null;
var PORT = null;

var ssdp = new Client();

//handle the ssdp response when the roku is found
ssdp.on('response', function (headers, statusCode, rinfo) {
    rokuAddress = headers.LOCATION;
    console.log("Found Roku: ",rokuAddress);
});

//this is called periodically and will only look for the roku if we don't already have an address
function searchForRoku() {
    if (rokuAddress == null) {
        ssdp.search('roku:ecp');
    }
}

//a simple wrapper to post to a url with no payload (to send roku commands)
function post(url,callback) {
    var info = urllib.parse(url);
    console.log("Posting: ",url);
    var opt = {
        host:info.hostname,
        port:info.port,
        path: info.path,
        method: 'POST',
    };

    var req = http.request(opt, callback);

    req.end();
}

//Performing an operation on the roku normally takes a handful of button presses
//This function will perform the list of commands in order and if a numerical value is included in the sequence it will be inserted as a delay
function postSequence(sequence,callback) {
    function handler() {
        if (sequence.length == 0) {
            if (callback) callback();
            return;
        }
        var next = sequence.shift();
        if (typeof next === "number") {
            setTimeout(handler,next);
        } else if (typeof next === "string") {
            post(next,function(res) {
                res.on("data",function() {}); //required for the request to go through without error
                handler();
            });
        }
    }
    handler();
}

//In order to send keyboard input to the roku, we use the keyress/Lit_* endpoint which can be any alphanumeric character
//This function turns a string into a series of these commands with delays of 100ms built in
//NOTE: this currently ignores anything that isn't lowercase alpha
function createTypeSequence(text) {
    var sequence = [];
    for (i=0; i<text.length; i++) {
        var c = text.charCodeAt(i); 
        if (c == 32) {
            sequence.push(rokuAddress+"keypress/Lit_%20");
        } else if (c >= 97 && c <=122) {
            sequence.push(rokuAddress+"keypress/Lit_"+text.charAt(i));
        }
        sequence.push(keyDelay);    
    }
    return sequence;
}

//simple helper function to pull the data out of a post request. This could be avoided by using a more capable library such
function getRequestData(request,callback) {
    var body = "";
    request.on("data",function(data) {
        body += String(data);
    });
    request.on("end",function() {
        callback(body);
    });
}

//depending on the URL endpoint accessed, we use a different handler.
//This is almost certainly not the optimal way to build a TCP server, but for our simple example, it is more than sufficient
var handlers = {
    "/roku/keypress" : function (request, response) {
        getRequestData(request,function(data) {
            var key = data.replace(/^\s+|\s+$/g,'').toLowerCase();

            post(rokuAddress + "keypress/" + key);
            response.end("OK");
        });
    },
    "/roku/keyPressTimes":function(request, response) {
        getRequestData(request,function(data) {
            var parsedJson = JSON.parse(data);
            var sequence = [];
            
            for (var i = 0; i < parsedJson.times; i++)
                sequence.push(rokuAddress + "keypress/" + parsedJson.direction);
            
            postSequence(sequence,function() { });
            response.end("OK");    
        });
    },
    //This endpoint doenst perform any operations, but it allows an easy way for you to dictate typed text without having to use the on screen keyboard
    "/roku/type":function(request,response) {
        getRequestData(request,function(data) {
            var text = data.replace(/^\s+|\s+$/g,'').toLowerCase(); //trim whitespace and lowercase
            var sequence = createTypeSequence(text);
            postSequence(sequence,function() {

            });
            response.end("OK");    
        });
    },
    //Takes the POST data and uses it to search for a show and then immediate plays that show
    "/roku/searchplay":function(request,response) {
        getRequestData(request,function(data) {
            var text = data.replace(/^\s+|\s+$/g,'').toLowerCase(); //trim whitespace and lowercase
            var sequence = [].concat([
                rokuAddress+"keypress/home", 
                rokuAddress+"keypress/home",
                3000,
                rokuAddress+"launch/12",
                7000,
                rokuAddress+"keypress/back",
                1000,
                rokuAddress+"keypress/Select",
                2000,
            ],createTypeSequence(text),[
                1000,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right",
                500,
                rokuAddress+"keypress/Select",
                3000,
                rokuAddress+"keypress/Select"
            ]);
            postSequence(sequence);
            response.end("OK");     //respond with OK before the operation finishes
        });
    },
    "/roku/searchroku":function(request,response) {
        getRequestData(request,function(data) {
            var text = data.replace(/^\s+|\s+$/g,'').toLowerCase();
            var sequence = [].concat([
                rokuAddress+"keypress/home", 
                rokuAddress+"keypress/home",
                500,
                rokuAddress+"keypress/down",
                100,
                rokuAddress+"keypress/down",
                100,
                rokuAddress+"keypress/down",
                100,
                rokuAddress+"keypress/down",
                100,
                rokuAddress+"keypress/down",
                500,
                rokuAddress+"keypress/right",
                100
            ],createTypeSequence(text),[
                1500,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right",
                100,
                rokuAddress+"keypress/right"
            ]);
            postSequence(sequence);
            response.end("OK");     //respond with OK before the operation finishes
        });
    },
    "/roku/netflix":function(request,response) {
        post(rokuAddress + "launch/12");
        response.end("OK");
    },
    "/roku/amazon":function(request,response) {
        post(rokuAddress + "launch/13");
        response.end("OK");
    },
    "/roku/plex":function(request,response) {
        post(rokuAddress + "launch/13535");
        response.end("OK");
    },
    "/roku/pandora":function(request,response) {
        post(rokuAddress + "launch/28");
        response.end("OK");
    },
    "/roku/hulu":function(request,response) {
        post(rokuAddress + "launch/2285");
        response.end("OK");
    },
    "/roku/rewind":function(request,response) {
        post(rokuAddress + "keypress/rev");
        response.end("OK");    
    },
    "/roku/fastforward":function(request,response) {
        post(rokuAddress + "keypress/fwd");
        response.end("OK");    
    },
}

//handles and incoming request by calling the appropriate handler based on the URL
function handleRequest(request, response){
    if (handlers[request.url]) {
        handlers[request.url](request,response);
    } else {
        console.log("Unknown request URL: ",request.url);
        response.end();
    }
}

//start the MSEARCH background task to try every second (run it immediately too)
setInterval(searchForRoku, 1000);
searchForRoku();

if (args[1] == 'http') {
    http.createServer(handleRequest).listen(PORT, function() {
        console.log("Server listening on: http://:%s", PORT);
    });
}
else {
    const options = {
        key: fs.readFileSync('privatekey.pem'),
        cert: fs.readFileSync('public.pem')  
    };

    https.createServer(options, handleRequest).listen(PORT, function() {
        console.log("Server listening on: https://:%s", PORT);
    });
}
