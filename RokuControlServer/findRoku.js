var Client = require('node-ssdp').Client;

//null will cause the server to discover the Roku on startup, hard coding a value will allow for faster startups
var rokuAddress = null;
var ssdp = new Client();

//handle the ssdp response when the roku is found
ssdp.on('response', function (headers, statusCode, rinfo) {
    rokuAddress = headers.LOCATION;
    console.log(headers);
    console.log("Found Roku: ",rokuAddress);
});

//this is called periodically and will only look for the roku if we don't already have an address
function searchForRoku() {
	if (rokuAddress == null) {
		ssdp.search('roku:ecp');
	}
}

setInterval(searchForRoku,1000);
searchForRoku();