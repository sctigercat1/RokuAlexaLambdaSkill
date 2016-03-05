var APP_ID = null; //replace this with your app ID to make use of APP_ID verification

var AlexaSkill = require("./AlexaSkill");
var https = require("https");
var nconf = require('nconf');

nconf.argv()
   .env()
   .file({ file: 'config.json' });
   
var host = nconf.get('host');
var port = nconf.get('port');
   
if (host == "127.0.0.1") {
    throw "Default hostname found, edit your config.json file to include your server's external IP address";
}

var AlexaRoku = function () {
    AlexaSkill.call(this, APP_ID);
};

AlexaRoku.prototype = Object.create(AlexaSkill.prototype);
AlexaRoku.prototype.constructor = AlexaRoku;

function sendCommand(path,body,callback) {
    var opt = {
        host: host,
		port: port,
        path: path,
        method: 'POST',
        rejectUnauthorized: false
    };

    var req = https.request(opt, function(res) {
		callback();
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

	if (body) req.write(body);
    req.end();
}

AlexaRoku.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("AlexaRoku onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Alexa Roku skill.";
    response.tell(speechOutput);
};

AlexaRoku.prototype.intentHandlers = {
    Home: function (intent, session, response) {
		sendCommand("/roku/keypress",'home',function() {
			response.tell("OK.");
		});
    },
    Up: function (intent, session, response) {
		sendCommand("/roku/keypress",'up',function() {
			response.tell("OK.");
		});
    },
    Down: function (intent, session, response) {
		sendCommand("/roku/keypress",'down',function() {
			response.tell("OK.");
		});
    },
    Left: function (intent, session, response) {
		sendCommand("/roku/keypress",'left',function() {
			response.tell("OK.");
		});
    },
    Right: function (intent, session, response) {
		sendCommand("/roku/keypress",'right',function() {
			response.tell("OK.");
		});
    },
    Select: function (intent, session, response) {
		sendCommand("/roku/keypress",'select',function() {
			response.tell("OK.");
		});
    },
    Back: function (intent, session, response) {
		sendCommand("/roku/keypress",'back',function() {
			response.tell("OK.");
		});
    },
    LaunchNetflix: function (intent, session, response) {
		sendCommand("/roku/netflix",null,function() {
			response.tell("Launching Netflix");
		});
    },
    LaunchAmazon: function (intent, session, response) {
		sendCommand("/roku/amazon",null,function() {
			response.tell("Launching Amazon");
		});
    },
    LaunchPlex: function (intent, session, response) {
		sendCommand("/roku/plex",null,function() {
			response.tell("Launching Plex");
		});
    },
    KeyPressTimes: function (intent, session, response) {        
        var data = { direction: intent.slots.Direction.value, times: intent.slots.Times.value };
        
		sendCommand("/roku/keyPressTimes", JSON.stringify(data),function() {
			response.tell("OK.");
		});
    },
    PlayLast: function (intent, session, response) {
		sendCommand("/roku/playlast",null,function() {
			response.tellWithCard("Playing the last Netflix show you searched");
		});
    },
	NextEpisode: function (intent, session, response) {
		sendCommand("/roku/nextepisode",null,function() {
			response.tellWithCard("Playing next episode");
		});
    },
	LastEpisode: function (intent, session, response) {
		sendCommand("/roku/lastepisode",null,function() {
			response.tellWithCard("Playing previous episode");
		});
    },
	ToggleTV: function (intent, session, response) {
		sendCommand("/toggletv",null,function() {
			response.tell("OK.");
		});	
	},
    Type: function (intent, session, response) {
		sendCommand("/roku/type",intent.slots.Text.value,function() {
			response.tellWithCard("Typing text: "+intent.slots.Text.value,"Roku","Typing text: "+intent.slots.Text.value);
		});
    },
	PlayPause: function (intent, session, response) {
		sendCommand("/roku/playpause",null,function() {
			response.tell("OK.");
		});
    },
	SearchPlay: function (intent, session, response) {
		sendCommand("/roku/searchplay",intent.slots.Text.value,function() {
			response.tellWithCard("Playing: "+intent.slots.Text.value,"Roku","Playing: "+intent.slots.Text.value);
		});
    },
    HelpIntent: function (intent, session, response) {
        response.tell("No help available at this time.");
    }
};

exports.handler = function (event, context) {
    var roku = new AlexaRoku();
    roku.execute(event, context);
};
