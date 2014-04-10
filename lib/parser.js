/*
 * get the file handler
 */
var fs = require('fs');
var util = require('util');
var path = require('path');
var jsonPath = require("./jsonPath");
/*
 * define the possible values:
 * section: [section]
 * param: key=value
 * comment: ;this is a comment
 * comment: #this is a comment
 */
var regex = {
	section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
	param: /^\s*([\w\.\-\_]+)\s*=\s*(.*)\s*$/,
	comment: /\s*(#|;).*$/,
	
};

var objetConfig = function(){}

objetConfig.prototype.selector = function(rule){
	return jsonSelect.match(rule,this);
}
objetConfig.prototype.path = function(rule){
	return jsonPath(this,rule);
}

Object.defineProperties(objetConfig.prototype, {

	apply : {
		value: function(config, defaults) {
			if (defaults) {
				this.apply(defaults);
			};
			if (config && typeof config === 'object') {
				var i;
				for (i in config) {
				    this[i] = config[i];
				}
			};    
			return this;
		},
		writable: false,
		enumerable: false,
		configurable: false
	},
	applyIf : {
		value: function(config) {
			var property;
			for (property in config) {
				if (!this.hasOwnProperty(property)) {
				    this[property] = config[property];
				}
			}
			return this;
		},
		writable: false,
		enumerable: false,
		configurable: false
	}
});

Object.defineProperties(module.exports, {
	config : {
		set: function (x) {
			if(x)
	            regex = x;
        },
        get: function () {
           return {
				/*
				 * define the possible values:
				 * section: [section]
				 * param: key=value
				 * comment: ;this is a comment
				 */
				init : {
					section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
					param: /^\s*([\w\.\-\_]+)\s*=\s*(.*)\s*$/,
					comment: /\s*;.*$/
				},
				/*
				 * define the possible values:
				 * section: group=nom de la section
				 * param: key=value
				 * comment: #this is a comment
				 * include: include=chemin du fichier
				 * extions possible : *.conf, *.cnf (utilisé lors de l'inclusion de dossier)
				 */
				conf : {
					param: /^\s*([\w\.\-\_]+)\s*=\s*(.*)\s*$/,
					comment: /\s*#.*$/,
					include : /^include\s*=\s*([^\t\n\r\f\b]*)\s*$/i,
					ext : /\.(conf|cnf)/i
				}
			};
        },
        enumerable: true,
        configurable: true
		
	}
});


function getData(str){
	var tmp;
	if(str.toLowerCase() === "true")
		return true;
	if(str.toLowerCase() === "false")
		return false;
	if(tmp = str.match(/^\/([^\/]*)\/(i|g|m){0,3}$/))
		return new RegExp(tmp[1],tmp[2].replace(/(.)(?=.*\1)/g, ""));
	if(!isNaN(str))
		return Number(str);
	if(/['"]/.test(str[0]) && /['"]/.test(str[str.length-1]))
		return str.substr(1,str.length-2);
	return str;
}

/*
 * parses a config file
 * @param: {String} file, the location of the .ini file
 * @param: {Function} callback, the function that will be called when parsing is done
 * @return: none
 */
module.exports.parse = function(file, callback){
	if(!callback){
		return;
	}
	
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			callback(err);
		}else{
			callback(null, parse(data));
		}
	});
};

/*
 * parses a config file
 * @param: {String} file, the location of the .ini file
 * @return: config Object
 */

module.exports.parseSync = function(file){
	return parse(fs.readFileSync(file, 'utf8'));
};


function parse(data){
	var value = new objetConfig;
	var lines = data.split(/\r\n|\r|\n/);
	var section = null;
	var includeFile = {};
	var importFile = function( b ){
		if(!(b in includeFile)){
			includeFile[b] = true;
			return module.exports.parseSync(b);
		};
		return {};
	}
	lines.forEach(function(line){
		if("comment" in regex )
			line = line.replace(regex.comment,"");

		if("include" in regex && regex.include.test(line)){
			var match = line.match(regex.include);
			if(fs.existsSync(match[1])){;
				var a = fs.statSync(match[1]);
				if(a.isDirectory()){
					fs.readdirSync(match[1]).
						forEach(function(file){
							if(("ext" in regex && regex.ext.test(file)) || !"ext" in regex){
								try{
									value.apply(importFile(path.join(match[1],file)));
								}catch(e){};
							}
						})
				}else if(a.isFile()){
					try{
						value.apply(importFile(match[1]));
					}catch(e){};
				}
			}
		}else if("section" in regex && regex.section.test(line)){
			var match = line.match(regex.section);
			value[match[1]] = value[match[1]] ||  [];
			value[match[1]][value[match[1]].length] = [];
			section = [match[1],value[match[1]].length -1];
		}else if("param" in regex && regex.param.test(line)){
			var match = line.match(regex.param);
			match[2] = getData(match[2]);
			if(section){
				//console.log("value[",section[0],"][",section[1],"][",match[1],"] = ",match[2],";");
				value[section[0]][section[1]][match[1]] = match[2];
			}else{
				value[match[1]] = match[2];
			}
		};
	});
	return value;
}

/*
 * parses a config data
 * @param: {String} file, the location of the .ini file
 * @return: config Object
 */
 
module.exports.parseString = parse;
