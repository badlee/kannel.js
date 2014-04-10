/*
	XXXX-XXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
	length Message - Type de message - Message
	UUID: XXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
	OCSTR : XXXX-XXXXXXXXXXXXXXXXXX
	INT : XXXX
*/
var UUID  = require("./UUID");
/*
	Private Msg Classe
*/

String.prototype.charsCode = function(){

	for(var i=[],j=0; i.length<this.length;i.push(this.charCodeAt(j++)));
	return i;
};
Buffer.prototype.toArray = function(){
	for(var ret=[];ret.length<this.length;ret.push(this[ret.length]));
	return ret;
};

var write = {
	"unknow" : function(data){
		return data;
	},
	"heartbeat" : function(data, i){
		data = data.concat(this.INTEGER(typeof i.load == 'undefined' ? -1 : i.load));
		return data;
	},
	"admin" : function(data, i){
		//console.log("Admin 0 : ",data);
		data = data.concat(a = this.INTEGER(typeof i.command == 'undefined' ? -1 : i.command));
		//console.log("Admin 1 : ",data,a);
		data = data.concat(a = this.OCTSTR(typeof i.boxc_id == 'undefined' ? null : i.boxc_id));
		//console.log("Admin 2 : ",data,a);
		return data;
	},
	"sms" : function(data, i){
		data = data.concat(this.OCTSTR(typeof i.sender == 'undefined' ? null : i.sender));
		data = data.concat(this.OCTSTR(typeof i.receiver == 'undefined' ? null : i.receiver));
		data = data.concat(this.OCTSTR(typeof i.udhdata == 'undefined' ? null : i.udhdata));
		data = data.concat(this.OCTSTR(typeof i.msgdata == 'undefined' ? null : i.msgdata,(i.charset && i.coding) ? "ucs2" : false));
		data = data.concat(this.INTEGER(typeof i.time == 'undefined' ? -1 : i.time));
		data = data.concat(this.OCTSTR(typeof i.smsc_id == 'undefined' ? null : i.smsc_id));
		data = data.concat(this.OCTSTR(typeof i.smsc_number == 'undefined' ? null : i.smsc_number));
		data = data.concat(this.OCTSTR(typeof i.foreign_id == 'undefined' ? null : i.foreign_id));
		data = data.concat(this.OCTSTR(typeof i.service == 'undefined' ? null : i.service));
		data = data.concat(this.OCTSTR(typeof i.account == 'undefined' ? null : i.account));
		data = data.concat(this.UUID(typeof i.id == 'undefined' ? true : i.id));
		data = data.concat(this.INTEGER(typeof i.sms_type == 'undefined' ? -1 : i.sms_type));
		data = data.concat(this.INTEGER(typeof i.mclass == 'undefined' ? -1 : i.mclass));
		data = data.concat(this.INTEGER(typeof i.mwi == 'undefined' ? -1 : i.mwi));
		data = data.concat(this.INTEGER(typeof i.coding == 'undefined' ? -1 : i.coding));
		data = data.concat(this.INTEGER(typeof i.compress == 'undefined' ? -1 : i.compress));
		data = data.concat(this.INTEGER(typeof i.validity == 'undefined' ? -1 : i.validity));
		data = data.concat(this.INTEGER(typeof i.deferred == 'undefined' ? -1 : i.deferred));
		data = data.concat(this.INTEGER(typeof i.dlr_mask == 'undefined' ? -1 : i.dlr_mask));
		data = data.concat(this.OCTSTR(typeof i.dlr_url == 'undefined' ? null : i.dlr_url));
		data = data.concat(this.INTEGER(typeof i.pid == 'undefined' ? -1 : i.pid));
		data = data.concat(this.INTEGER(typeof i.alt_dcs == 'undefined' ? -1 : i.alt_dcs));
		data = data.concat(this.INTEGER(typeof i.rpi == 'undefined' ? -1 : i.rpi));
		data = data.concat(this.OCTSTR(typeof i.charset == 'undefined' ? null : i.charset));
		data = data.concat(this.OCTSTR(typeof i.boxc_id == 'undefined' ? null : i.boxc_id));
		data = data.concat(this.OCTSTR(typeof i.binfo == 'undefined' ? null : i.binfo));
		data = data.concat(this.INTEGER(typeof i.msg_left == 'undefined' ? -1 : i.msg_left));
		data = data.concat(this.VOID(typeof i.split_parts == 'undefined' ? 'VOID' : i.split_parts));
		data = data.concat(this.INTEGER(typeof i.priority == 'undefined' ? -1 : i.priority));
		data = data.concat(this.INTEGER(typeof i.resend_try == 'undefined' ? -1 : i.resend_try));
		data = data.concat(this.INTEGER(typeof i.resend_time == 'undefined' ? -1 : i.resend_time));
		data = data.concat(this.OCTSTR(typeof i.meta_data == 'undefined' ? null : i.meta_data));
		return data;
	},
	"ack" : function(data, i){
		data = data.concat(this.INTEGER(typeof i.nack == 'undefined' ? -1 : i.nack));
		data = data.concat(this.INTEGER(typeof i.time == 'undefined' ? -1 : i.time));
		data = data.concat(this.UUID(typeof i.id == 'undefined' ? null : i.id));
		return data;
	},
	"wdp_datagram" : function(){
		data = data.concat(this.OCTSTR(typeof i.source_address == 'undefined' ? null : i.source_address));
		data = data.concat(this.INTEGER(typeof i.source_port == 'undefined' ? -1 : i.source_port));
		data = data.concat(this.OCTSTR(typeof i.destination_address == 'undefined' ? null : i.destination_address));
		data = data.concat(this.INTEGER(typeof i.destination_port == 'undefined' ? -1 : i.destination_port));
		data = data.concat(this.OCTSTR(typeof i.user_data == 'undefined' ? null : i.user_data));
		return data;
	},
};


MSG = function(buff, opt){
	if(typeof buff == "string"){
		if(typeof this._format_[buff] == 'undefined')throw "Error type not found";
		if(!opt)throw "Error data not found";
		var dt = this.INTEGER(this._format_[buff]);
		//console.log("Type : ",dt);
		dt=write[buff].call(this,dt,opt);
		//console.log("Msg : ",dt);
		buff = new Buffer(this.INTEGER(dt.length).concat(dt));
		//console.log("All : ",buff);
	}
	if(!buff instanceof Buffer)
		throw "Error data type";
	//console.log("Construct : ",buff);
	/*Lecture du flux*/
	this.buff = buff.slice(0);
	this.pos = 0;
	this.data = {};
  	/**
  	*  Obtention du nombre de charactères du message
  	*/
  	var retry,i=0;
	do{
		retry = 0;
	  	this.length = this.hexToInt(this.readBytes(4));
	  	if (this.length < 0) {
			//console.log("WARNING : conn_read_withlen: got negative length, skipping");
			retry = 1;
		}else if(this.length < 8 || this.length > buff.length){
			this.buff = new Buffer(this.INTEGER(4).concat(this.INTEGER(5)));
			this.unknow = buff;
		}
		if(i++>2) retry =0;
	}while(retry);
	if (this.buff.length - this.pos < this.length)
		throw "Error : Can't determine length";
	/*Obtebtion du type*/
	this.type = this.hexToInt(this.readBytes(4));
	if(typeof this._format[this.type] == 'undefined')
		throw "Error : Can't found type : "+this.type;
	this.type = this._format[this.type];
	this["type "+this.type]();
};
MSG.hexToInt = function(data){
	return (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
};
MSG.prototype = {
	length : undefined,
	type : undefined,
	readBytes : function(i){
		this.pos+=i;
		//try{
			return this.buff.slice(this.pos-i,this.pos);
		//}catch(e){
		//	return new Buffer([0,0,0,0]);
		//}
	},
	hexToInt : function(data){
		return (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
	},
	INTEGER : function(i){
		if(i!==undefined){
			i = Number(i);
			/*
			i = (i < 0 ? (0xFFFFFFFF + i + 1) : i).toString(16).lpad(8,'0');
			var h,j= [];
			for(h=0;h<i.length;h+=2){
				j.push('0x'+i.substr(h,2));
			}
			return j;*/
			var bytes = new Array(4)
			bytes[0] = i >> 24;
			bytes[1] = i >> 16;
			bytes[2] = i >> 8;
			bytes[3] = i;
			return bytes;
		}else if(this.buff){
			var data = this.readBytes(4);
			return this.hexToInt(data);
		}
		throw "Error";
	},
	OCTSTR : function(str){
		if(str !== undefined && str instanceof Buffer){
			var b = [];
			b = b.concat(this.INTEGER(str.length));
			b = b.concat(str.toArray());
			return b;
		}else if(str !== undefined){
			if(str === null) str = "";
			if(!(str instanceof String)){
				str = str.toString();
			}
			if(!str)return this.INTEGER(-1);
			var b = [];
			b = b.concat(a=this.INTEGER(str.length));
			b = b.concat(c = str.charsCode());
			return b;
		}else if(this.buff){
			var len = this.hexToInt(this.readBytes(4));
			if(len == -1)
				return null;
			return this.readBytes(len);
		}
	},
	UUID : function(str){
		if(str !== undefined && str instanceof Buffer){
			var b = [];
			b = b.concat(this.INTEGER(str.length));
			b = b.concat(str.toArray());
			return b;
		}else if(str  !== undefined){
			if(str === true)str = UUID.generate();
			if(!str)return this.INTEGER(-1);
			if(!str instanceof String)str = str.toString();
			var b = [];
			b = b.concat(this.INTEGER(str.length));
			b = b.concat(str.charsCode());
			return b;
		}else if(this.buff){
			var len = this.hexToInt(this.readBytes(4));
			if(len == -1)
				return null;
			return 	this.readBytes(len).toString();
		}
	},
	VOID : function(str){
		if(str)
			return [];
	},
	"type unknow" : function(){
		this.data = this.unknow;
	},
	"type heartbeat" : function(){
		this.data['load']=this.INTEGER();
	},
	"type admin" : function(){
		this.data['command']=this.INTEGER();
        this.data['boxc_id']=this.OCTSTR();
	},
	"type sms" : function(){
        this.data['sender']=this.OCTSTR();
        this.data['receiver']=this.OCTSTR();
        this.data['udhdata']=this.OCTSTR();
        this.data['msgdata']=this.OCTSTR();
        this.data['time']=this.INTEGER();
        this.data['smsc_id']=this.OCTSTR();
        this.data['smsc_number']=this.OCTSTR();
        this.data['foreign_id']=this.OCTSTR();
        this.data['service']=this.OCTSTR();
        this.data['account']=this.OCTSTR();
        this.data['id']=this.UUID();
        this.data['sms_type']=this.INTEGER();
        this.data['mclass']=this.INTEGER();
        this.data['mwi']=this.INTEGER();
        this.data['coding']=this.INTEGER();
        this.data['compress']=this.INTEGER();
        this.data['validity']=this.INTEGER();
        this.data['deferred']=this.INTEGER();
        this.data['dlr_mask']=this.INTEGER();
        this.data['dlr_url']=this.OCTSTR();
        this.data['pid']=this.INTEGER();
        this.data['alt_dcs']=this.INTEGER();
        this.data['rpi']=this.INTEGER();
        this.data['charset']=this.OCTSTR();
        this.data['boxc_id']=this.OCTSTR();
        this.data['binfo']=this.OCTSTR();
        this.data['msg_left']=this.INTEGER();
        this.data['split_parts']=this.VOID();
        this.data['priority']=this.INTEGER();
        this.data['resend_try']=this.INTEGER();
        this.data['resend_time']=this.INTEGER();
        this.data['meta_data']=this.OCTSTR();
	},
	"type ack" : function(){
        this.data['nack']=this.INTEGER();
        this.data['time']=this.INTEGER();
        this.data['id']=this.UUID();
	},
	"type wdp_datagram" : function(){
        this.data['source_address']=this.OCTSTR();
        this.data['source_port']=this.INTEGER();
        this.data['destination_address']=this.OCTSTR();
        this.data['destination_port']=this.INTEGER();
        this.data['user_data']=this.OCTSTR();
	},
	_format : ["heartbeat","admin","sms","ack","wdp_datagram","unknow"],
	_format_ : {"heartbeat" : 0,"admin":1,"sms":2,"ack":3,"wdp_datagram":4,"unknow":5}
};

module.exports = MSG;
