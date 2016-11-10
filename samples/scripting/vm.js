var path = require('path'),
	vm = require("vm"),
	fs = require("fs"),
	logger = require("console").Console,
	util = require("util"),
	events = require("events"),
	head = "if(!Array.prototype.rnd){"+
			"	Object.defineProperty(Array.prototype,'rnd',{"+
			"		get:function (){"+
			"			var randscript = -1, max = this.length-1;"+
			"			while (randscript < 0 || randscript > max || isNaN(randscript))"+
			"				randscript = parseInt(Math.random()*(max+1));"+
			"			return this[randscript];"+
			"		}"+
			"	});"+
			"};\n\n";

	function VMStream(filename,id) {
		//this.data = [];
		this.filename = filename;
		this.id = id;
	}

	VMStream.prototype.write = function(data) {
	    //this.data.push(data);
	    process.stdout
	    	.write( this.filename + " "+ this.id +" > "+ util.format.apply(this, arguments) + '\n');
	}

	var sessions = {};
	var localStorage = {};

var lang = false;
	if(process.argv[2] !=="js")
		lang = require(process.argv[2]);
var script = {};
process.title = 'scripting > '+(process.argv[2]);
process.on("message",function(m){
 	if (m.type === 'sms'){
 		//console.log("new SMS in VM",process.argv[2],m.id, m.keywords[0]);
		  var sandbox = {
		  	Buffer : Buffer,
		  	_stdout : new VMStream(m.file, m.id),
		  	_stderr : new VMStream(m.file, m.id),
		  	sms : m,
		  	MSG : function MSG(conf){
		  		conf = conf || {};
		  		for (var property in m) 
					if (!conf.hasOwnProperty(property)) 
						conf[property] = m[property];
				if(this instanceof arguments.callee){
					for (var property in conf)
						this[property] = conf[property];
					
					var tmp = this.receiver;
					this.receiver = this.sender;
					this.sender = tmp;
					
					delete this.type;
					Object.defineProperties(this, {
						sendFlash : {
							value: function(){
								this.flash();
						  	},
							writable: false,
							enumerable: false,
							configurable: false
						},
						flash : {
							value: function(){
								this.type = "flash";
						  		process.send(this);
						  	},
							writable: false,
							enumerable: false,
							configurable: false
						},
						sendSMS : {
							value: function(){
						  		this.send();
						  	},
							writable: false,
							enumerable: false,
							configurable: false
						},
						send : {
							value: function(){
						  		process.send(this);
						  	},
							writable: false,
							enumerable: false,
							configurable: false
						},
						type : {
							value: "sms",
							writable: false,
							enumerable: true,
							configurable: false
						}
					});
				}else
					return new arguments.callee(conf);
		  	}
		}
		var sendError = function(err,send){	
		  	var tmp = m.receiver;
			m.receiver = m.sender;
			m.sender = tmp;
		  	console.log("Exec Error", process.argv[2],m.file, err.stack || err);
		  	m.msgdata = "EXEC ERROR";
		  	if(send)
			  	process.send(m);
		};
 		if(!script[m.file]){
			try{data = fs.readFileSync(m.file);}catch(e){return sendError(e);}
				
			/* Compilation to JS */
			if(lang){
				try{
					data = lang.compile(data.toString(),{filename:path.basename(m.file)});					
				}catch(e){
					console.log("Error on compile");
				  	return sendError(e);
				}
			}
			/* END */
			try{
				script[m.file] = vm.createScript(head+data, m.file); 
				/* rebuild script if content change*/
				fs.watchFile(m.file, (function(m,curr, prev) {
					if(curr != prev){
						var data;
						try{
							data = fs.readFileSync(m.file);
							if(lang)
								data = lang.compile(data.toString(),{filename:path.basename(m.file)});
							script[m.file] = vm.createScript(head+data, m.file); 
						}catch(e){return;}
					}
				}).bind(null,m));
			}catch(e){
				return sendError(e);
			}
		}
		/* definition de la session et du storage */
			var _id = new Buffer(m.sender).toString();
			/* Session*/
		sessions[_id] = sessions[_id] || {} ;
		// remove obsolete data
		if(sessions[_id].lastAccess && sessions[_id].lastAccess + 360000 < Date.now() )
			sessions[_id].data = {};
		else
			sessions[_id].data = sessions[_id].data || {};	
		sessions[_id].lastAccess = Date.now();
		sandbox.session = sessions[_id].data;
		sandbox.logger = new logger(sandbox._stdout,sandbox._stderr);
		/* Storage share memory */
		localStorage[" shared memory "] = localStorage[" shared memory "] || {};
		sandbox.sharedStorage = localStorage[" shared memory "];
		/* Storage local memory */
		localStorage[m.keywords[0]] = localStorage[m.keywords[0]] || {};
		sandbox.localStorage = localStorage[m.keywords[0]];
		/* end */
		try{ script[m.file].runInNewContext(sandbox); }catch(e){return sendError(e);}
		sessions[_id].data = sandbox.session;
		localStorage[m.keywords[0]] = sandbox.localStorage;
		//console.log("[",process.argv[2],"]","OUT : " , sandbox._stdout.data);	  
		//console.log("[",process.argv[2],"]","ERR : " , sandbox._stderr.data);
		//console.log("[",process.argv[2],"]","Session : " , sessions[_id]);
		delete sandbox;
	}
 });
