var util = require("util");
var events = require("events");
var parser = require("./parser");
var MSG  = require("./MSG");
var UUID  = require("./UUID");
var net = require("net");

parser.config = parser.config.conf;
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

var status = {
	admin : {
		shutdown : 0,
		suspend : 1,
		resume : 2,
		identify : 3,
		restart : 4
	},
	ack : {
		success : 0,
		failed : 1,     /* do not try again (e.g. no route) */
		failed_tmp : 2, /* temporary failed, try again (e.g. queue full) */
		buffered : 3
	},
	sms : {
		mo : 0,
		mt_reply : 1,
		mt_push : 2,
		report_mo : 3,
		report_mt : 4
	}
	
}


function kannel(conf,cb){
	var err = null;
	this.heartBeat= null;
	this.connected= false;
	try{this.conf = parser.parseSync(conf,true);}catch(e){err = e;}
	if( cb instanceof Function){
		cb.call(this,err,this.conf);
	};
};
util.inherits(kannel, events.EventEmitter);
kannel.prototype.write = function(a,c){
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
kannel.prototype.heart = function(time){
	var a = new MSG("heartbeat",{
		load:0
	});
	var self = this;
	this.heartBeat = setInterval(function(buff){self.write(buff);}, time*1000,a.buff);
	return 
};
kannel.prototype.identification = function(id){
	this.write("admin",{
		command:3,
		boxc_id : id || ""
	});
};
kannel.prototype.connect = function(opt){
	if(this.connected === true){
		this.emit("error","Socket already opened");
		return;
	}
	var err = null;
	opt = opt||{};
	opt.applyIf({
		tls : false,
		host : '127.0.0.1',
		port : 14001
	});
	if(!opt.tls){
		this.socket = new net.Socket({
			allowHalfOpen : true
		});
		var self = this;
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
					console.log("Hex",b.length,pos,pos+4,self.buff);
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
								console.log(self.buff.i);//.concat(b.slice(pos,pos+=self.buff.length).toArray())));
								//console.log("ii",pos-4,self.buff.length+4,b.length,b.slice(pos-4,pos+4));
								var a =  new MSG(new Buffer(self.buff.i.concat(b.slice(pos,pos+=self.buff.length).toArray())));
								self.buff.i=[];
							}catch(e){
								//pos = i;
								//console.log("Send Msg : ",pos,pos-4,pos+self.buff.length,b.slice(pos-4,pos+self.buff.length).length,self.buff.length,b.slice(pos-4,pos+self.buff.length));
								//throw e;
							}
							//console.log(i++,"Position",pos,b.length);
							self.emit(a.type,a.data);
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
		  	self.emit('error',e);
		  });
		this.socket.on('connect',function(){
		  	self.connected = true;
		  	console.log("Connect : ",self.socket.address());
		  	self.emit('connect');
		  });
		this.socket.on('close',function(){
		  	clearInterval(self.heartBeat);
		  	self.connected = false;
		  	this.socket = null;
		  	this.buff = {data : null,length : 0,i:[]};
		  	console.log("Close : ");
		  	self.emit('close');
		  });
		this.socket.on('timeout',function(){
		  	this.socket.close();
		  	console.log("Timeout : ");
		  });
		/*
		this.socket.on('drain',function(data){
			console.log("DRAIN",arguments);
		});
		this.socket.on('data',function(data){
		  	//Call Event : Admin, SMS, Ack...
		  	try{
		  		var a = new MSG(data);
		  		console.log("receive Data : ",a.type, a.data.id);
			  	self.emit(a.type,a.data);
			 }catch(e){
			 	self.emit("error",e);
			 }
		  });*/
		
		try{
			this.socket.connect(opt.port,opt.host);
		}catch(e){
			this.socket = null;
			self.emit("error",e);
		}
	}
};
/*
	End
*/

exports.MSG = MSG;
exports.UUID = UUID;
exports.status = status;
exports.kannel = kannel;
exports.parser = parser;
