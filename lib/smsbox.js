var MSG  = require("./MSG");
var status = require("./status");
var util = require("util");
var events = require("events");
var net = require("net");
var url = require("url");

var parser = require("./parser");

parser.config = {
	section: /^group\s*=\s*([^\t\n\r\f\b]*)\s*$/i,
	param: /^\s*([\w\.\-\_]+)\s*=\s*(.*)\s*$/,
	comment: /\s*#.*$/,
	include : /^include\s*=\s*([^\t\n\r\f\b]*)\s*$/i,
	ext : /\.(conf|cnf)/i
};


/*
	Fun Tools
*/

Buffer.prototype.toArray = function(){
	for(var ret=[];ret.length<this.length;ret.push(this[ret.length]));
	return ret;
};

/*
	End
*/


function smsbox(conf,cb){
	var err = null;
	this.heartBeat= null;
	this.connected= false;
	var def = {
		id : "",
		frequence : 5,
		tls : false,
		host : '127.0.0.1',
		port : 13001,
		silentError : true
	};

	if(typeof conf =="string"){
		try{
			conf = url.parse(conf, 1);
			var tmp2={},tmp = parser.parseSync(conf.pathname);
			for(var i in conf.query)
				try{
					tmp2[i] = tmp.path(conf.query[i])[0] || def[i] || undefined;
				}catch(e){
					tmp2[i] == undefined
				}
			conf = tmp2;
		}catch(e){
			return this.emit("error",e);
		}
	}else{
		conf = conf || {};
	}
	for (var property in def) 
		if (!conf.hasOwnProperty(property)) 
			conf[property] = def[property];

	this.conf = conf;
	Object.seal(this.conf);
	if( cb instanceof Function)
		cb.call(this,err,this.conf);
};

util.inherits(smsbox, events.EventEmitter);

smsbox.prototype.write = function(a,c){
	if(!this.connected){
		this.emit("error",new Error("Connection is close : "+this.heartBeat));
		return false;
	}
	if(typeof a == "string"){
		 try{
		 	a = new MSG(a,c);
		 }catch(e){
		 	this.emit("error",e);
		 	return;
		 }
	}
	if('buff' in a)
		a = a.buff;
	if(!(a instanceof Buffer)){
		this.emit("error",new Error("Error Data Type"));
		return false;
	}
	this.socket.write(a);
	return true;
};

smsbox.prototype.heart = function(time){
	if(this.heartBeat !== null) return;
	var a = new MSG("heartbeat",{
		load:0
	});
	var self = this;
	this.heartBeat = setInterval(function(buff){self.write(buff);}, time*1000,a.buff );
	return true;
};

smsbox.prototype.sendSMS = function(conf){
	var def = {
		id : true,
		time : Math.floor((new Date).getTime()/1000),
		sender : undefined,
		receiver : undefined,
		msgdata : undefined,
		coding : 0 // GSM charset
	};
	var defCharset = ["GSM","binary","UTF-16BE"];
	for (var property in def) 
		if (!conf.hasOwnProperty(property)) 
			conf[property] = def[property];
	 conf.coding = conf.coding >=0 && conf.coding <=3 ? parseInt(conf.coding) : 0; 
	 conf.charset = defCharset[conf.coding];
	// force GSM as default charset if is not correctly defined  
	if(defCharset.indexOf(conf.charset) == -1){
		conf.charset = defCharset[0];
		conf.coding = 0;
	}
	if(!conf.receiver || !(conf.msgdata || conf.msg || conf.text)) return null;
	
	this.write("sms",{
	  sender: conf.sender,
	  receiver: conf.receiver ,
	  msgdata: conf.msg || conf.text || conf.msgdata,
	  time: conf.time,
	  id : conf.id || true ,
	  sms_type: status.sms.mt_reply
	});
	return true;
};

smsbox.prototype.sendUCS2SMS = function(conf){
	conf.coding = 2;
	return this.sendSMS(conf);
};

smsbox.prototype.flashSMS = function(conf){
	conf.mclass = 1;
	return this.sendSMS(conf);
};

smsbox.prototype.flashUCS2SMS = function(conf){
	conf.coding = 2;
	return this.flashSMS(conf);
};

smsbox.prototype.identification = function(id){
	this.write("admin",{
		command:status.admin.identify,
		boxc_id : id || this.conf.id || ""
	});
};
smsbox.prototype.connect = function(){
	if(this.connected === true){
		this.emit("error","Socket already opened");
		return;
	}
	var err = null;
	var opt = this.conf;
	
	if(!opt.tls){
		this.socket = new net.Socket({
			allowHalfOpen : true
		});
		var self = this;
		if( opt.silentError && (!this._events.error ||
        (typeof this._events.error === 'object' &&
         !this._events.error.length)))
			this.on("error",function(){});
		
		this.socket.setNoDelay(true);
		this.socket.setKeepAlive(true, 50);
		this.buff = {data : null,length : 0,i:[]};
		this.socket.on('data',function(b){
			var pos = 0;
			while(pos<b.length){
				//var i= b.slice(pos,pos+=b.length);
				//console.log("Data ",pos+=b.length);
				//continue;
				//console.log(i++,"Position",pos,b.length);
				if(self.buff.data === null){
					/*lit la longeur*/
					//console.log("Hex",b.length,pos,pos+4,self.buff);
					if(pos+4<b.length){
						if(self.buff.i.length){
							self.buff.i = self.buff.i.concat(b.slice(pos,pos+=(4-self.buff.i.length)).toArray());
						}else{
							self.buff.i = b.slice(pos,pos+=4).toArray();
						}
					}else{
						self.buff.i=self.buff.i.concat(b.slice(pos).toArray());
						pos = b.length;
						continue;
					}
					self.buff.length = MSG.hexToInt(new Buffer(self.buff.i));
					if(self.buff.length>b.length) continue;
					//console.log("Position _ 111 : ",pos,b.length,self.buff.length,pos+self.buff.length);
					if(self.buff.length > 0 ){
						if(b.length>=(pos+self.buff.length)){
							/*Recuperation d'un message complet*/
							try{
								//console.log(self.buff.i);//.concat(b.slice(pos,pos+=self.buff.length).toArray())));
								//console.log("ii",pos-4,self.buff.length+4,b.length,b.slice(pos-4,pos+4));
								var a =  new MSG(new Buffer(self.buff.i.concat(b.slice(pos,pos+=self.buff.length).toArray())));
								self.buff.i=[];
							}catch(e){
								//pos = i;
								//console.log("Send Msg : ",pos,pos-4,pos+self.buff.length,b.slice(pos-4,pos+self.buff.length).length,self.buff.length,b.slice(pos-4,pos+self.buff.length));
								//throw e;
							}
							//console.log("Emit ",a.type);
							self.emit(a.type,a.data);
							if(a.action)
								self.emit(a.type+" "+a.action,a.data);

							//console.log("Reset Data:");
							self.buff = {data : null,length : 0,i:[]};
							a = '';
						}else{
							/*Message coupé en deux*/
							self.buff.data = self.buff.i.concat(b.slice(pos).toArray());
							self.buff.i=[];
							//console.log("Calcul de la longeur de la chaine restante :",pos,b.length,self.buff.length,self.buff.length-b.length+pos);
							self.buff.length -= b.length-pos;
							pos = b.length;
						}
					}
				}else{
					/*Recuperation du reste du message*/
					//console.log("Recuperation du reste du message",pos,b.length,self.buff.length);
					self.buff.data = self.buff.data.concat(b.slice(pos,pos+=self.buff.length).toArray());
					//console.log(i++,"longuer de la	a chaine",pos,b.length,self.buff.data.length,new Buffer(self.buff.data));
					var a =  new MSG(new Buffer(self.buff.data));
					self.emit(a.type,a.data);
					self.buff = {data : null,length : 0,i:[]};
					a = '';
				}
				/*ignore null charactère*/
				//if(pos<b.length && b.slice(pos,pos+1).toString() == "\0" ){
					//pos +=1;
				//}
				//console.log(i++,"O:Position",pos,b.length);
			}
			//process.exit();
		});
		this.socket.on('error',function(e){
			if(["EPIPE","ECONNREFUSED"].indexOf(e.code) > -1){
				self.socket.emit("closeForced");
			}
			self.emit('error',e);
		});
		this.socket.on('connect',function(){
		  	self.connected = true;
		  	//console.log("Connect : ",self.socket.address());
		  	self.identification(opt.id);
			self.heart(opt.frequence);
		  	self.emit('connect');
		});
		this.socket.on('closeForced',function(){
		  	clearInterval(self.heartBeat);
		  	self.connected = false;
		  	if(self.socket){
		  		self.socket.destroy();
		  		process.nextTick(function(){self.socket = null});
		  	}
		  	this.buff = {data : null,length : 0,i:[]};
		  });
		this.socket.on('close',function(){
			if(self.socket)
			  	self.socket.emit("closeForced");
		  	self.emit('close');
		  });
		this.socket.on('timeout',function(){
		  	this.socket.destroy();
		  });
		
		try{
			this.socket.connect(opt.port,opt.host);
		}catch(e){
			this.socket = null;
			self.emit("error",e);
		}
	}
};
smsbox.prototype.close = function(){
	if(this.connected === true)
		this.socket.emit("close");
}
/*
	End
*/

module.exports = smsbox;
