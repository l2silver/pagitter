var parseNaetorp = require('./parseNaetorp');
var globals = parseNaetorp.globals;
var fileName = parseNaetorp.fileName;
var stripETrTags = parseNaetorp.stripETrTags;
var transformMatch = parseNaetorp.transformMatch;
var eTrCode = parseNaetorp.eTrCode;
var naetorpGlobals = {
	get: {},
	update: function(node){
		var newGlobals = globals(node);
		newGlobals.map(function(newGlobal){
			var components = newGlobal.split('=');
			naetorpGlobals.get[components[0]] = components[1];
		});
		delete naetorpGlobals.get['filename']; 
	},
	setFilename: function(node){
		var filename = fileName(node);
		if(filename){
			naetorpGlobals.get['fileName'] = filename;
		}
	},
	transform: function(node){
		return node.replace(naetorpGlobals.transformRegex(
			naetorpGlobals.transformPattern()), 
			function(matched){
  				var pattern = stripETrTags();
  				var cleanMatch = naetorpGlobals.cleanMatch(pattern, matched);
  				return naetorpGlobals.get[cleanMatch];
		});
		
	},
	cleanMatch: function(pattern, matched){
		var cleaned = matched.match(pattern);
		return cleaned[0];

	},
	transformPattern: function(){
		var pattern = '';
		var keys = Object.keys(naetorpGlobals.get);
		var firstKey = keys.shift();
		var result = transformMatch(firstKey)
		pattern += result;
		keys.map(function(global){
			var result = transformMatch(global)
			pattern += '|'+result;
		});
		return pattern;
	},
	transformRegex: function(pattern){
		return new RegExp(pattern, 'g')
	},
	removeETrCode: function(node){
		var cleanCode = node.replace(eTrCode(), '');
		return cleanCode;
	}
}
module.exports = naetorpGlobals;