var parseNaetorp = require('./parseNaetorp');
var naetorpGlobals = require('./naetorpGlobals');
var naetorpWrite = require('./naetorpWrite');
var rootLocation = naetorpWrite.rootLocation;
var location = naetorpWrite.location;
var Promise = require('bluebird');
var promisify = Promise.promisify
var writeFile = promisify(require("fs").writeFile);
var readFile = promisify(require("fs").readFile);





/* Parse Data Into Code */
/* Plugin Transformations */
/* Write Transformation */

exports.run = function(file){

				if(!file){
					var file = 'neatorp.js';
				}
				return readFile(file, 'utf8')
				.then(function(contents){
					splitFiles(contents)
						getCode(content);
						transformPlugins();
						transformContent(content);
						preWritePlugins()
						writeContent()
						postWritePlugins()
				});
			} 
}

exports.splitFile = function(file){
	
			var naetorpCodes = contents.match(/\/\*eTr.+eTr\*\//g);
}

exports.splitCode = function(file){
	var contents = file.split(/\/\*eTr.+eTr\*\//);
	contents.shift();
	return contents;
}

exports.splitContent = function(){

}
















var naetorp = {
	historicalGlobals: [],
	process: function(file){
		if(!file){
			var file = 'naetorp.js';
		}
		return readFile(file, 'utf8').then(function(contents) {
		    var naetorpNodes = contents.split(/\/\*eTr.+eTr\*\//);
		    naetorpNodes.shift();
			var naetorpCodes = contents.match(/\/\*eTr.+eTr\*\//g);
		    return naetorp.writePromises(naetorpNodes, naetorpCodes);
		}).catch(SyntaxError, function(e) {
		    console.log("File had syntax error", e);
		//Catch any other error
		}).catch(function(e) {
		    console.log("Error reading file", e);
		});
	},
	writePromises: function(nodes, codes){
		var tasks = codes.map(function(code, index){
			naetorpGlobals.update(code);
			naetorpGlobals.setFilename(code);
			if(!naetorpGlobals.get.fileName){
				return false;
			}
			var transformedNode = naetorpGlobals.transform(nodes[index]);
			var cleanTransformedNode = naetorpGlobals.removeETrCode(transformedNode);
			var cloneGlobals = Object.assign({}, naetorpGlobals.get);
			naetorp.historicalGlobals.push(cloneGlobals);
		    return function(){
		    	var currentGlobal = naetorp.historicalGlobals.shift();
		    	return location(currentGlobal, rootLocation)
		    	.then(function(fullLocation){
		    		return writeFile(fullLocation, cleanTransformedNode, 'utf8');
		    	})
		    	
		    }
		});
		var p = tasks[0]();
		for(var i = 1; i < tasks.length; i++){
			p = p.then(tasks[i]);
		}
		return p;
	}
}

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
	var promisify = require('bluebird').promisify;
	var mkdirp = promisify(require('mkdirp'));
	var naetorpWrites = {
		rootLocation: process.cwd(),
		location: function(globalVariables, rootLocation){
			var fileName = globalVariables.fileName
			if(globalVariables.base){
				fileName = globalVariables.base +'/'+fileName
			}
			return naetorpWrites.generateFolders(fileName).then(function(){
				return rootLocation+'/'+fileName;	
			});
			

		},
		generateFolders: function(filename){
			var folders = filename.split('/');
			folders.pop();
			var foldersConc = folders.join('/');
			return mkdirp(naetorpWrites.rootLocation+'/'+foldersConc);
		}
	}


	globals: function(commandLine){
		var result = commandLine.match(/[a-z]+\=[^ ]+(?= )/ig);
		if(result){
			return result;
		}
		return false
	}
	, fileName: function(commandLine){
		var result = commandLine.match(/ (([^ \=])+)(?= )/);
		if(result){
			return result[1];
		}
		return false
	}
	, transformMatch: function(global){
		return '\\$eTr\\{'+global+'\\}'
	}
	, stripETrTags: function(){
		return '(?!(\\$eTr\\{))[a-z]+(?=\\})'
	}
	, eTrCode: function(){
		return new RegExp(/\/\*eTr.+eTr\*\/(\\n)*/g);
	}


module.exports = naetorp;

