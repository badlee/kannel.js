# Javascript implementation of Kannel Box protocol

### Description
Kannel.js is a javascript implementation of Kannel Box protocol, it allow write some powerful SMS VAS applications or  sms gateways with kannel and node.js

[![NPM](https://nodei.co/npm/kannel.png?downloads=true&stars=true)](https://nodei.co/npm/kannel/) [![NPM](https://nodei.co/npm-dl/kannel.png?months=1)](https://nodei.co/npm/kannel/)

### Installation
```sh
npm install kannel
```

### Connect to bearerbox using object config
```js
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
```

### Connect to bearerbox using kannel config file information
```js
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
```

The parser use [JSONpath's syntax](http://goessner.net/articles/JsonPath/) for access to the json representation of the conf file.

### Receive / Send SMS
```js
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
		app.sendUCS2SMS({
		  sender: data.receiver,
		  receiver: data.sender,
		  msgdata: 'Bonjour, Hi, 你好, صباح الخير', // UCS2 text
		  id : data.id
		})
	});
	app.connect();
```


### Send a delivery ACK
```js
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
		try{
			if(6*Math.random()+1 > 5)
				throw new Error("I'm random error for test retry");
			if(/6/.test(data.receiver.toString()))
				data.success(); // successfull received 
			else if(/7/.test(data.receiver.toString())){
				data.buffered(); // received and buffered, need send success ACK after.
				setTimeout(function(){
					// send a success ack to the bearerbox
					app.write("ack",{ // write ack message and send it to the bearerbox
						nack : kannel.status.ack.success,
						//time :  Math.floor((new Date).getTime()/1000), // unix time default Math.floor(Date.now()/1000) 
						id   :  data.id
					});
				},5000);
			} else
				data.failed(); //receive sms failed do not try again
		}catch(e){
			// you can also use it, the bearerbox will resend the message after. 
			data.failed_tmp(); //receive sms failed retry later
		}
	});
	app.connect();
```


### Receive ADMIN command from bearerbox

```js
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
		console.log("Receive ADMIN CMD ",
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
```

### How test samples
Run bearebox

```sh
	$ cd path/to/kannel.js
	$ sudo bearerbox kannel/kannel.conf
```

#### Test echobox (echo server clusterized)
![alt tag](https://raw.githubusercontent.com/badlee/kannel.js/master/img/echo.png)

##### Usage
```sh
    $ node samples/echoBox [path to kannel.conf]
```

##### Example
```sh
    $ cd path/to/kannel.js
    $ node samples/echoBox
	echoBox worker #{1} is connected to 127.0.0.1:14001
	echoBox worker #{3} is connected to 127.0.0.1:14001
	echoBox worker #{2} is connected to 127.0.0.1:14001
	echoBox worker #{4} is connected to 127.0.0.1:14001
```

#### Test replbox (REPL sms)
![alt tag](https://raw.githubusercontent.com/badlee/kannel.js/master/img/repl.png)

##### Usage
```sh
    $ node samples/replbox [path to kannel.conf]
```

##### Example

```sh
    $ cd path/to/kannel.js
    $ node samples/replbox
    replbox is connected to 127.0.0.1:14001
    for send a message tip 
        SMS > FROM TO Your Message
        Exp:  070805 09505 hello SMS.
    SMS > 
```
Type your SMS in REPL console, the server send a echo responce for each recieved sms. 


#### Test messagesBoard (websocket and sms chat)
![alt tag](https://raw.githubusercontent.com/badlee/kannel.js/master/img/messageBoard.png)

##### Usage
```sh
    $ node samples/messagesBoard [path to kannel.conf]
```

##### Example

```sh
	$ cd path/to/kannel.js
	$ node samples/messagesBoard
	Fri Apr 11 2014 04:09:22 GMT+0100 (WAT) Server is listening on port 14014
```
Goto to http://127.0.0.1:14014,
Type your name, your message or send sms for chat, Enjoy your chat.


#### Test scripting (coffeeScript and javascript VAS applications)
![alt tag](https://raw.githubusercontent.com/badlee/kannel.js/master/img/scripting.png)

##### Usage
```sh
    $ node samples/scripting [path to kannel.conf]
```

##### Example

```sh
	$ cd path/to/kannel.js
	$ node samples/scripting
	scripting box is connected to 127.0.0.1:14001
	Fri Apr 11 2014 04:09:22 GMT+0100 (WAT) Server is listening on port 14014
```
Goto to http://127.0.0.1:14014, for show the dashboard.
Goto to samples/scripting/public/scripts for sms service.
The SMS services is identified by the name of script whitout extension. ( Ex : "FUTURE" represent futur.coffee, "COUNT" represent count.js )

You can also send SMS from http request
<pre>
/cgi-bin/sendsms
	send sms GET request

Paramametres
	from : default "****"
	to : receiver 
	text : SMS to send

Response
	Success : http code 200
	Fails	: http code 403

Example : http://127.0.0.1:14014/cgi-bin/sendsms?from=07086&to=05026&text=Test
</pre>

### [Tuto] Test Kannel.js

#### Prerequisite
Before start you must now It :

  - It's a kannel.js is a librarie who allow to create a smsbox remplacement for more efficient SMS VAS application.
  - The new infrastructure become : 

```
    +----------+----------+-------------+----------+-------------------------+----------+-------------------------+
    | Operator | Protocol | Application | Protocol |       Application       | Protocol |       Application       |
    +----------+----------+-------------+----------+-------------------------+----------+-------------------------+
    | SMSC     | <socket> | bearerbox   | <socket> | Your NodeJs Application |          |                         |
    +----------+----------+-------------+----------+-------------------------+----------+-------------------------+
    |                                             Instead of                                                      |
    +----------+----------+-------------+----------+-------------------------+----------+-------------------------+
    | SMSC     | <socket> | bearerbox   | <socket> | smsbox                  | <http>   | Your NodeJs Application |
    +----------+----------+-------------+----------+-------------------------+----------+-------------------------+
```

  - For test processing it you must have
    - [git](https://git-scm.com/) for clone this repository.
      For install go to [here](https://git-scm.com/)
    - [nodejs](https://nodejs.org) for run your application.
      For install go to [here](https://nodejs.org)
    - [kannel](http://kannel.org/) for connect to a wireless provider.
      For install : `sudo apt-get install kannel`
    - [kannel-extras](http://kannel.org/download.shtml#stable) for send sms to your application.
      For install : `sudo apt-get install kannel-extras`

#### How start a sample

Make your sure kannel is down, configured and work well (bearerbox and smsbox).

  - Clone kannel.js reposotory
    `$ git clone https://github.com/badlee/kannel.js.git`
  - Go to in mybox
    `$ cd kannel.js`
  - Run a bearerbox
    `$ bearerbox -v 0 /etc/kannel/kannel.conf 1>/tmp/bearerbox.log 2>&1 &`
  - Run sample
  	`$ node samples/scripting /etc/kannel/kannel.conf`
  - If you see `scripting box is connected to ` all is ok

#### Send SMS to your application
You can send directly to your shortnumber or to your connected modem. But if you want test localy you must run fakesmsc (part of kannel-extras).

`$ /usr/lib/kannel/test/fakesmsc "FROM TO text script"`

```sh
	$ ## Example of test
	$ /usr/lib/kannel/test/fakesmsc "0708 6061 text hello oshimin" # test hello.js service
	$ /usr/lib/kannel/test/fakesmsc "1120 8080 text futur" # Test futur services
	$ /usr/lib/kannel/test/fakesmsc "0708 8080 text count" # Test Count
	$ /usr/lib/kannel/test/fakesmsc "FROM TO text vote A" # Test de vote
	$ /usr/lib/kannel/test/fakesmsc "FROM TO text vote B" # Test de vote
	$ /usr/lib/kannel/test/fakesmsc "FROM TO text vote C" # Test de vote
	$ /usr/lib/kannel/test/fakesmsc "FROM TO text vote D" # Test de vote
```

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