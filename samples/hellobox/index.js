// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'hellobox';

sys = require("util");
var kannel = require('../../lib');
var status = kannel.status;
var iconv = require("iconv-lite");

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
var app = new kannel.smsbox(
	__dirname+"/../../kannel/kannel.conf?"+
	"host=$.smsbox[-1:].bearerbox-host&"+
	"port=$.core[-1:].smsbox-port&"+
	"id=$.smsbox[-1:].smsbox-id&"+
	"frequence=$.smsbox[-1:].frequence-time");

/*
//manual config
var app = new kannel.smsbox({
	id   : "helloBox", // smsc id
	frequence : 1 // hearbeat
});
*/

//var smsbox = app.conf.smsbox[app.conf.smsbox.length-1];
//var core = app.conf.core[app.conf.core.length-1];

app.on("admin shutdown",function(data){
	/*Shutdown*/
	console.log("Receive shutdown command...bye");
	app.close();
	process.exit();
});

app.on('connect',function(){
	console.log("hellobox is connected to "+app.conf["host"]+":"+app.conf['port']);
	console.log("for send a message tip \n\tSMS > FROM TO Your Message\n\tExp:  070805 09505 hello SMS.");
	var readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout);
	rl.setPrompt('SMS > ');
	rl.prompt();
	app.on("sms",function(data){
		console.log("Recive SMS : ",data.id,data.msgdata.toString("utf8"));
		rl.prompt();
		app.write("ack",{
            nack : kannel.status.ack.success,
            time : Math.floor((new Date).getTime()/1000),
            id   : data.id
        });
		app.sendSMS({
		  sender: data.receiver,
		  receiver: data.sender,
		  msgdata: 'hello '+data.sender,
		  sms_type: status.sms.mt_reply
		});	
	});
	app.on("error",function(e){
		console.log("Error",e.stack || e);
		rl.prompt();
	});
	
	rl.on('line', function(line) {
	  var keyword = line.trim().match(/^(\w+)[ ]+(\w+)[ ]+(.*)$/);
	  if(keyword){
		  switch(keyword[1]) {
			default:
				app.write("sms",{
				  sender: keyword[1],
				  receiver: keyword[2] ,
				  msgdata: iconv.encode(keyword[3],"ucs2"),
				  time: Math.floor((new Date).getTime()/1000),
				  coding : 2,
				  charset : 'UTF-16BE', // ucs2
				  sms_type: status.sms.mo
				});
			  break;
		  }
	  }
	  rl.prompt();
	}).on('close', function() {
	  console.log('\nHave a great day!');
	  process.exit(0);
	});
});
app.connect();

