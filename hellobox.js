sys = require("util");
var kannel = require('./lib');
var app = new kannel.kannel("kannel/kannel.conf");
console.log(app);
var smsbox = app.conf.smsbox[app.conf.smsbox.length-1];
var core = app.conf.core[app.conf.core.length-1];

app.on("error",function(e){
	console.log("Error",e.stack || e);
});

app.on("admin",function(data){
	switch(data.command){
		case 0:
			/*Shutdown*/
			console.log("Receive shutdown command...bye");
			process.exit();
			break;
	};
})

app.on("sms",function(data){
	console.log("Recive SMS : ",data.msgdata);
	this.write("sms",{
	  sender: data.receiver,
	  receiver: data.sender,
	  msgdata: 'Hello...',
	  time: Math.floor((new Date).getTime()/1000),
	  id : true,
	  sms_type: 1
	});
	this.write("ack",{
		nack : 0,
		time : Math.floor((new Date).getTime()/1000),
		id   :  data.id
	});
	
});
app.on('connect',function(){
	console.log("hello box is connected to "+smsbox["bearerbox-host"]+":"+core['smsbox-port']);
	this.identification(smsbox['smsbox-id'] || "");
	this.heart(smsbox['frequence-time'] || 5);
});
app.connect({
	host : smsbox["bearerbox-host"],
	port : core['smsbox-port']
});
