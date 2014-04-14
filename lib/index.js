var parser = require("./parser");

parser.config = {
	section: /^group\s*=\s*([^\t\n\r\f\b]*)\s*$/i,
	param: /^\s*([\w\.\-\_]+)\s*=\s*(.*)\s*$/,
	comment: /\s*#.*$/,
	include : /^include\s*=\s*([^\t\n\r\f\b]*)\s*$/i,
	ext : /\.(conf|cnf)/i
};




exports.VERSION = "0.0.5";
exports.MSG = require("./MSG");
exports.UUID = require("./UUID");
exports.status = require("./status");
exports.smsbox = require("./smsbox");
exports.parser = parser;

