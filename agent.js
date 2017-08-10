/* Monitor Agent */
/* This agent will help monitor and log all the server stats as required */

var appName = "eyespy";

//var prompt = require('prompt');

var net = require('net');
var monitor = require("os-monitor");
var config = require('config');
var bunyan = require('bunyan');
var bformat = require('bunyan-format'), formatOut = bformat({outputMode: 'json'}); // short|long|simple|json|bunyan

// Read configurations
var delayVal = config.get('config.delay');
var loggerLevel = (config.has('config.logger.level')) ? config.get('config.logger.level') : 'info';

var os = monitor.os;




// // more advanced usage with configs. 
// monitor.start({ delay: delayVal // interval in ms between monitor cycles 
//               // , freemem: 1000000000 // freemem under which event 'freemem' is triggered 
//               // , uptime: 1000000 // number of secs over which event 'uptime' is triggered 
//               // , critical1: 0.7 // loadavg1 over which event 'loadavg1' is triggered 
//               // , critical5: 0.7 // loadavg5 over which event 'loadavg5' is triggered 
//               // , critical15: 0.7 // loadavg15 over which event 'loadavg15' is triggered 
//               // , silent: false // set true to mute event 'monitor' 
//               // , stream: false // set true to enable the monitor as a Readable Stream 
//               // , immediate: false // set true to execute a monitor cycle at start() 
// 		});

// logger.info("Logging at level : " + loggerLevel);

// monitor.on('monitor', function(event) {
//   //console.log(event.type, ' This event always happens on each monitor cycle!');
//   logger.info({"cpu" : monitor.os.loadavg(), "memory" : monitor.os.freemem()});
// });



/*
// define handler for a too high 1-minute load average 
monitor.on('loadavg1', function(event) {
  console.log(event.type, ' Load average is exceptionally high!');
});
 
// define handler for a too low free memory 
monitor.on('freemem', function(event) {
  console.log(event.type, 'Free memory is very low!');
});
 

// define a throttled handler, using Underscore.js's throttle function (http://underscorejs.org/#throttle) 
monitor.throttle('loadavg5', function(event) {
 
  // whatever is done here will not happen 
  // more than once every 5 minutes(300000 ms) 
 
}, monitor.minutes(5));
 
 /*
// change config while monitor is running 
monitor.config({
  freemem: 0.3 // alarm when 30% or less free memory available 
});
 

// check whether monitor is running or not 
monitor.isRunning(); // -> true / false 

 
// use as readable stream 
monitor.start({stream: true}).pipe(process.stdout);
*/

// stop monitor
//if (monitor.isRunning()) {
	//monitor.stop();
//}

/* Agent socket code */



var masterHost = 'localhost';
var masterPort = 6969;

var client = new net.Socket();
var registrationId = null;
var logger = null;

client.connect(masterPort, masterHost, function() {
    console.log('CONNECTED TO: ' + masterHost + ':' + masterPort);
});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {
    if (data.toString().startsWith("RegistrationId:")) { // TODO: Bad logic. Need to improve (not performance friendly)
      registrationId = data.toString().split(":")[1];

      // Create a logger (TODO: Enhance to log in configuration location = stdout|file|db)
      logger = bunyan.createLogger({ name: registrationId, stream: formatOut, level: loggerLevel });
      
      startMonitor();

      console.log('Registration Id: ' + registrationId);
      var sysinfo = { "arch" : os.arch(), "platform" : os.platform(), "release" : os.release(), "type" : os.type(), "uptime" : os.uptime() };

      // Send the system specs to the master
      client.write(JSON.stringify(sysinfo));
      //client.destroy();
    }
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
});



/* Capture EXIT process */
process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (monitor.isRunning()) { monitor.stop(); console.log("monitor stopped") } // Stop the monitor
    if (options.cleanup) console.log('clean'); // Clean anything.
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{ cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

// Function to start the monitor
function startMonitor() {
  monitor.start({ delay: delayVal });
  monitor.on('monitor', function() {
    logger.info({"cpu" : monitor.os.loadavg(), "memory" : monitor.os.freemem()});
  });
}
