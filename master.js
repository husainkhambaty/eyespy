
var net = require('net');

var host = "127.0.0.1";
var port = 6969;

const uuid = require('uuid');

var monagents = [];

net.createServer(function(sock) {
	// We have a connection - a socket object is assigned to the connection automatically
	var id = uuid.v1();

	if (monagents[sock.remoteAddress] == null) {
		monagents[sock.remoteAddress] = id;
		console.log("Connecting to new agent : " + sock.remoteAddress + " : " + id)
	} else {
		console.log("Connecting to existing agent : " + sock.remoteAddress + " : " + id);
	}
    sock.write("RegistrationId:" + id);
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
    	console.log("Getting agent info : " + data);
    });
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
    	if (monagents[sock.remoteAddress] != null) {
    		delete monagents[sock.remoteAddress];
    	} else {
    		console.err("We lost the bugger");
    	}
        console.log('CLOSED: ' + sock.remoteAddress +' '+ id);
    });
}).listen(port, host);
console.log('Server listening on ' + host +':'+ port);



