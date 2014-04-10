# KANNEL Box Protocol for Nodejs

### Connect to bearerbox using object config
<pre>
	var kannel = require('kannel'),
	    app = new kannel.smsbox({
			host : '192.168.10.3', // bearerbox host - default '127.0.0.1'
			port : 14001, //smsc connection port - default 13001
			id   : "helloBox", // smsc id - defaut ""
			frequence : 1 // hearbeat - default 5s
		});
	app.on('connect',function(){
		console.log("hello box is connected to "+app.conf["host"]+":"+app.conf['port']);
	});
	app.connect();
</pre>

### Connect to bearerbox using kannel config file information
<pre>
	var kannel = require('kannel'),
	    app = new kannel.smsbox("kannel/kannel.conf?"+
	    	"host=$..bearerbox-host&"+
	    	"port=$..smsbox-port&"+
	    	"id=$.smsbox[-1:].smsbox-id&"+
	    	"frequence=$.smsbox[-1:].frequence-time"
	    );
	app.on('connect',function(){
		console.log("hello box is connected to "+app.conf["host"]+":"+app.conf['port']);
	});
	app.connect();
</pre>

The parser use [JSONpath](http://goessner.net/articles/JsonPath/) for access to the json representation of the conf file.

### Receive / Send SMS
<pre>
	var kannel = require('kannel'),
	    app = new kannel.smsbox("kannel/kannel.conf?"+
	    	"host=$..bearerbox-host&"+
	    	"port=$..smsbox-port&"+
	    	"id=$.smsbox[-1:].smsbox-id&"+
	    	"frequence=$.smsbox[-1:].frequence-time"
	    );
	app.on('connect',function(){
		console.log("hello box is connected to "+app.conf["host"]+":"+app.conf['port']);
	});
	app.on("sms",function(data){
		console.log("Recive SMS ",
			" [FROM:",data.sender.toString(),
			"][TO:",data.receiver.toString(),
			"][MSG :",data.msgdata.toString(),
		"]");
		app.sendSMS({
		  sender: data.receiver,
		  receiver: data.sender,
		  msgdata: 'Hello', // string or buffer
		  id : data.id
		});	
	});
	app.connect();
</pre>


### Send a delivery to SMS
<pre>
	var kannel = require('kannel'),
	    app = new kannel.smsbox("kannel/kannel.conf?"+
	    	"host=$..bearerbox-host&"+
	    	"port=$..smsbox-port&"+
	    	"id=$.smsbox[-1:].smsbox-id&"+
	    	"frequence=$.smsbox[-1:].frequence-time"
	    );
	app.on('connect',function(){
		console.log("hello box is connected to "+app.conf["host"]+":"+app.conf['port']);
	});
	app.on("sms",function(data){
		console.log("Recive SMS ",
			" [FROM:",data.sender.toString(),
			"][TO:",data.receiver.toString(),
			"][MSG :",data.msgdata.toString(),
		"]");
		app.write("ack",{
			nack : kannel.status.ack.success,
			time :  Math.floor((new Date).getTime()/1000),
			id   :  data.id
		});
	});
	app.connect();
</pre>


### Receive ADMIN command from bearerbox
<pre>
	var kannel = require('kannel'),
	    app = new kannel.smsbox("kannel/kannel.conf?"+
	    	"host=$..bearerbox-host&"+
	    	"port=$..smsbox-port&"+
	    	"id=$.smsbox[-1:].smsbox-id&"+
	    	"frequence=$.smsbox[-1:].frequence-time"
	    );
	app.on('connect',function(){
		console.log("hello box is connected to "+app.conf["host"]+":"+app.conf['port']);
	});
	app.on("admin",function(data){
		console.log("Recive ADMIN CMD ",
			" [CODE:",data.command,
			"][FROM BOX:",data.boxc_id.toString(),
		"]");
		switch(data.command){
			case kannel.status.admin.shutdown:
				/*Shutdown*/
				console.log("Receive shutdown command...bye");
				process.exit();
				break;
		};
	});
	app.connect();
</pre>


### Installation
npm:

`npm install kannel`

### License

(The MIT License)

Copyright (c) 2007-2009 Ulrich Badinga &lt;badinga.ulrich@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
