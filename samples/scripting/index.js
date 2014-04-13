sys = require("util");
var kannel = require('../../lib');
var status = kannel.status;

var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    app = {};

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
};
    
var stats = {
	received : 0,
	sent : 0,
	byNum : {}
}
var languageTypes = {
    ".js": "js",
    ".coffee": "coffee-script"
};
var VMs = {};
Object.defineProperties(languageTypes, {
	initVM : {
		value: function() {
				for(var i in this){
					VMs[this[i]] = require('child_process').fork(path.join(__dirname,'vm.js'),[this[i]]);
					VMs[this[i]].on('message', function(m) {
						if (m.type === 'sms'){
							stats.sent++;
							var id = new Buffer(m.receiver).toString();
							stats.byNum[id] = stats.byNum[id] || {sent : 0, received:0};
							stats.byNum[id].sent++;
							app.sendSMS(m);	
						}
					});
				}
		},
		writable: false,
		enumerable: false,
		configurable: false
	},
	execScript : {
		value: function(file,sms,keyword) {
		var tmp = (path.extname(file) in this) ? this[path.extname(file)] : false;
				if(tmp){
					sms.type = "sms";
					sms.file = file;
					sms.keywords = keyword;
					VMs[tmp].send(sms);
				}
		},
		writable: false,
		enumerable: false,
		configurable: false
	}
});


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
app = new kannel.smsbox(__dirname+"/../../kannel/kannel.conf?"+
	"host=$.smsbox[-1:].bearerbox-host&"+
	"port=$.core[-1:].smsbox-port&"+
	"id=$.smsbox[-1:].smsbox-id&"+
	"frequence=$.smsbox[-1:].frequence-time&"+
	"http_port=$.smsbox[-1:].sendsms-port&"+
	"admin_port=$.core[-1:].admin-port&"+
	"admin_pwd=$.core[-1:].admin-password&"
);

/*
//manual config
var app = new kannel.smsbox({
	id   : "helloBox", // smsc id
	frequence : 1 // hearbeat
});
*/

//var smsbox = app.conf.smsbox[app.conf.smsbox.length-1];
//var core = app.conf.core[app.conf.core.length-1];

app.on("admin",function(data){
	switch(data.command){
		case status.admin.shutdown:
			/*Shutdown*/
			console.log("Receive shutdown command...bye");
			process.exit();
			break;
	};
});

app.on("sms",function(data){
	/*Stats*/
	var id = data.sender.toString();
	stats.byNum[id] = stats.byNum[id] || {sent : 0, received:0};
	stats.byNum[id].received++;
	stats.received++;
	/*end stats*/
	var keyword = data.msgdata.toString().split(" ");
	var dir = path.join(__dirname,"public","scripts");
	filename = fs.readdirSync(dir).filter(function(file){
		return (new RegExp(keyword[0])).test(path.basename(file,path.extname(file)));
	})[0];
	
	if(!filename){
			console.log("FAILS SMS ", data.id.toString());
		app.write("ack",{
			nack : status.ack.failed,
			id   : data.id
		});	
	}else{
		console.log("RUN SMS ", data.id.toString());
		app.write("ack",{
			nack : status.ack.success,
			time : Math.floor((new Date).getTime()/1000),
			id   : data.id
		});
		data.id = true;
		languageTypes.execScript(path.join(dir,filename),data,keyword);
	}
});

var readFile = function(filename,res,uri){
	var fileStream = fs.createReadStream(filename);
    fileStream.on('error', function (error) {
    	//try to load index.html
    	if(error.code == "EISDIR" && /\/$/.test(filename))
    		return readFile(path.join(filename,"index.html"),res);
    	else if(error.code == "EISDIR"){
    		res.writeHead(302, { "Location": uri+"/" });
        	return res.end();
    	}
        res.writeHead(404, { "Content-Type": "text/plain"});
        res.end(error.stack);
    });
    fileStream.on('end', function() {
        console.log('sent file ' + filename);
        res.end();
    });
    fileStream.pipe(res);
}
var server =  http.createServer(function(req, res) {
    var uri = url.parse(req.url).pathname;
    var filename = path.join(__dirname,"public", uri);
	if((/^\/info\.json$/i).test(uri)){
		res.writeHead(200, {'Content-Type': 'application/json'});
		return res.end(JSON.stringify({
			uptime : process.uptime(),
			now : Date.now(),
			memoryUsage : process.memoryUsage(),
			memoryOs : {
				total : require("os").totalmem(),
				free : require("os").freemem(),
			},
			platform : process.platform,
			arch : process.arch,
			nodeVersion : process.version
		}));
	}else if((/^\/stats\.json$/i).test(uri)){
		res.writeHead(200, {'Content-Type': 'application/json'});
		return res.end(JSON.stringify({
			sent : stats.sent,
			received : stats.received
		}));
	} else if((/^\/numStats(\/)?$/i).test(uri)){
		res.writeHead(200, {'Content-Type': 'application/json'});
		return res.end(JSON.stringify(stats.byNum));
	}else if((/^\/numStats\/(.*)\.json$/i).test(uri)){
		var m = uri.match(/^\/numStats\/(.*)\.json$/i);
		if(m[1] && m[1] in stats.byNum){
			res.writeHead(200, {'Content-Type': 'application/json'});
			return res.end(JSON.stringify(stats.byNum[m[1]]));
		}
	}else if((/^\/cgi-bin\/sendsms$/i).test(uri)){
		var query = url.parse(req.url,1).query;
		var sms = {
			msgdata : query.text,
			sender  : query.from || "****",
			receiver :query.to || false 
		};
		
		if(!sms.msgdata){
			res.writeHead(403, {'Content-Type': 'text/plain'});
			return res.end("Missing text");
		}
		
		if(!sms.receiver){
			res.writeHead(403, {'Content-Type': 'text/plain'});
			return res.end("Missing receiver");
		}
		stats.sent++;
		stats.byNum["KANEL"] = stats.byNum["KANEL"] || {sent : 0, received:0};
		stats.byNum["KANEL"].sent++;
		app.sendSMS(sms);	
		res.writeHead(200, {'Content-Type': 'text/plain'});
		return res.end("Message sent");
	}
    if ((/^\/(index\.html)?$/i).test(uri)) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        filename = path.join(__dirname,"public","index.html");
    }
        console.log((new Date()) + ' HTTP server. URL' + req.url + ' requested ');
        readFile(filename,res,uri);
});


app.on('connect',function(){
	console.log("scripting box is connected to "+app.conf["host"]+":"+app.conf['port']);
	server.listen(app.conf.http_port || 1337);
	languageTypes.initVM();
});
app.connect();
