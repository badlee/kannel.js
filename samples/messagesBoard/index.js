// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
var fs = require("fs");
var kannel = require('../../lib');
/*

* load config from kannel configuration file
* url
	path_to_file?config
	  path is relative or absolute path to kannel config file
	  config - is a url query format field=data&field2=data&... 
	  	host=jsonpath selector
	  	port=jsonpath selector
	  	id=jsonpath selector
	  	frequence=jsonpath selector

  For jsonPath sample look at http://goessner.net/articles/JsonPath/
*/
var app = new kannel.smsbox(__dirname+"/../../kannel/kannel.conf?host=$.smsbox[-1:].bearerbox-host&port=$.core[-1:].smsbox-port&id=$.smsbox[-1:].smsbox-id&frequence=$.smsbox[-1:].frequence-time&http_port=$.smsbox[-1:].sendsms-port");

webSocketsServerPort = app.conf.http_port || webSocketsServerPort;

/**
 * Global variables
 */
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
var clients = [ ];

var clientsSMS = {};

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' HTTP server. URL' + request.url + ' requested.');
	request.url = require("url").parse(request.url,1);
	
    if (request.url.pathname.match(/^\/(index(\.(html|php|do))?)?$/i)) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        var fileStream = fs.createReadStream(__dirname+"/public/index.html");
        fileStream.pipe(response);
    } else if (request.url.pathname.match(/^\/(frontend(\.js)?)?$/i)) {
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        var fileStream = fs.createReadStream(__dirname+"/public/frontend.js");
        fileStream.pipe(response);
    } else if (request.url.pathname.match(/^\/(conf(\.js)?)?$/i)) {
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end('conf = "ws://'+app.conf.host+":"+webSocketsServerPort+'";');
    } else if (request.url.pathname === '/status') {
        response.writeHead(200, {'Content-Type': 'application/json'});
        var responseObject = {
            currentClients: clients.length,
            totalHistory: history.length
        }
        response.end(JSON.stringify(responseObject));
    } else {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Sorry, unknown url');
    }
});
server.listen(webSocketsServerPort, function() {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            if (userName === false) { // first message sent by user is their name
                // remember user name
                userName = htmlEntities(message.utf8Data);
                // get random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
                console.log((new Date()) + ' User is known as: ' + userName
                            + ' with ' + userColor + ' color.');

            } else { // log and broadcast the message
                console.log((new Date()) + ' Received Message from '
                            + userName + ': ' + message.utf8Data);
                
                // we want to keep history of all sent messages
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor
                };
                history.push(obj);
                history = history.slice(-100);

                // broadcast message to all connected clients
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
                try{
                for(var i in clientsSMS )
                	if(clientsSMS[i])
				        app.write("sms",{
						  sender: obj.author,
						  receiver: i ,
						  msgdata: message.utf8Data,
						  time: Math.floor(obj.time/1000),
						  sms_type: kannel.status.sms.mt_reply
						});
				}catch(e){}
            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);app.on("admin",function(data){
	switch(data.command){
		case status.admin.shutdown:
			/*Shutdown*/
			console.log("Receive shutdown command...bye");
			process.exit();
			break;
	};
})
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });

});
app.on("admin",function(data){
	switch(data.command){
		case status.admin.shutdown:
			/*Shutdown*/
			console.log("Receive shutdown command...bye");
			process.exit();
			break;
	};
})

app.on("sms",function(data){
		console.log("Recive SMS : ",data.msgdata.toString("utf8"));
        app.write("ack",{
            nack : kannel.status.ack.success,
            time : Math.floor((new Date).getTime()/1000),
            id   : data.id
        });
		var sender = data.sender.toString();
		var obj = {
            time: (new Date()).getTime(),
            text: htmlEntities(data.msgdata.toString("utf8")),
            author: "[SMS]["+sender+"]",
            color: colors[0]
        };
        if(clientsSMS[sender])
        	clearTimeout(clientsSMS[sender]);
        clientsSMS[sender] = setTimeout((function(id){ clientsSMS[id] = null; delete clientsSMS[id]; }).bind(null, sender),30000)
        history.push(obj);
        history = history.slice(-100);
	// broadcast message to all connected clients
    var json = JSON.stringify({ type:'message', data:  obj });
    for (var i=0; i < clients.length; i++) {
        try{clients[i].sendUTF(json);}catch(e){}
    }
    try{
		for(var i in clientsSMS )
			if(clientsSMS[i] && i != sender)
			    app.write("sms",{
				  sender: obj.author,
				  receiver: i ,
				  msgdata: message.utf8Data,
				  time: Math.floor(obj.time/1000),
				  sms_type: kannel.status.sms.mt_reply
				});
	}catch(e){}
})

app.connect();
