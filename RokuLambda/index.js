var APP_ID = null; //replace this with your app ID to make use of APP_ID verification

var AlexaSkill = require("./AlexaSkill");
var serverinfo = require("./serverinfo");
var https = require("https");

if (serverinfo.host == "127.0.0.1") {
    throw "Default hostname found, edit your serverinfo.js file to include your server's external IP address";
}

var AlexaRoku = function () {
    AlexaSkill.call(this, APP_ID);
};

AlexaRoku.prototype = Object.create(AlexaSkill.prototype);
AlexaRoku.prototype.constructor = AlexaRoku;

function sendCommand(path,body,callback) {
    var opt = {
        host:serverinfo.host,
        port:serverinfo.port,
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
            response.tellWithCard("Going Home");
        });
    },
    Netflix: function (intent, session, response) {
        sendCommand("/roku/netflix",null,function() {
            response.tellWithCard("Launching Netflix");
        });
    },
    Amazon: function (intent, session, response) {
        sendCommand("/roku/amazon",null,function() {
            response.tellWithCard("Launching Amazon");
        });
    },
    Pandora: function (intent, session, response) {
        sendCommand("/roku/pandora",null,function() {
            response.tellWithCard("Launching Pandora");
        });
    },
    Hulu: function (intent, session, response) {
        sendCommand("/roku/hulu",null,function() {
            response.tellWithCard("Launching Hulu");
        });
    },
    Plex: function (intent, session, response) {
        sendCommand("/roku/plex",null,function() {
            response.tellWithCard("Launching Plex");
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
    Type: function (intent, session, response) {
        sendCommand("/roku/type",intent.slots.Text.value,function() {
            response.tellWithCard("Typing text: "+intent.slots.Text.value,"Roku","Typing text: "+intent.slots.Text.value);
        });
    },
    PlayPause: function (intent, session, response) {
        sendCommand("/roku/keypress",'play',function() {
            response.tell("OK.");
        });
    },
    SearchPlayNetflix: function (intent, session, response) {
        sendCommand("/roku/searchplay",intent.slots.Text.value,function() {
            response.tellWithCard("Playing from Netflix: "+intent.slots.Text.value,"Roku","Playing from Netflix: "+intent.slots.Text.value);
        });
    },
    SearchRoku: function (intent, session, response) {
        sendCommand("/roku/searchroku",intent.slots.Text.value,function() {
            response.tellWithCard("Searching through Roku: "+intent.slots.Text.value,"Roku","Searching through Roku: "+intent.slots.Text.value);
        });
    },
    Rewind: function (intent, session, response) {
        sendCommand("/roku/rewind",null,function() {
            response.tellWithCard("Rewinding");
        });
    },
    Fastforward: function (intent, session, response) {
        sendCommand("/roku/fastforward",null,function() {
            response.tellWithCard("Fast-forwarding");
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
