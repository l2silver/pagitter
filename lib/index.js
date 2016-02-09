import Promise, {promisify} from 'bluebird';
import fs from 'fs';
import {List, Map} from 'immutable';
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

export function run(file = 'pagitter.js'){
				return readFile('.pagitter', 'utf8')
				.then((json)=>{
					const pluginsList = List(JSON.parse(json).plugins)
					const plugins = generatePluginFunctions(pluginsList);
					return readFile(file, 'utf8')
					.then((file)=>{
						const actions = List([updateGlobalVariables, updateFilename, transformContent, plugins]);
						const codes = splitCode(file);
						const contents = splitContent(file);
						const stateHistory = codes.unshift(List([Map({globalVariables: Map()})]))
						return stateHistory.reduce((states, code, index)=>{
							/*
							console.log('last', states.last().merge(
									{
										code, 
										content: contents.get(index-1)
									})
							);
							console.log('actions', actions);
							*/
							const reducerReadyActions = 
							actions.unshift(
								states.last().merge(
									{
										code, 
										content: contents.get(index-1)
									}
								)
							)
							//console.log('reducerReadyActions', reducerReadyActions);
							return reducerReadyActions
							.reduce((currentState, action)=>{
								//console.log('currentState', currentState);
								return action(currentState);
							});
						});
					});
				})
				.catch((error)=>{
					console.log('error', error);
				});
			}


export function generatePluginFunctions(plugins){
	return catchErrors(pluginStream(plugins));
}

export function pluginStream(plugins){
	const pluginFunctions = plugins.unshift(initialPluginPromise).reduce((oldFunction, pluginName)=>{
		return function(state){
			return oldFunction(state)
			.then((oldFunctionState)=>{
				const generatePromise = require(pluginName).default;
				return generatePromise(oldFunctionState);
			})
		}
	});
	return pluginFunctions
}


export const initialPluginPromise = Promise.method(function initialPluginPromise(state){
	return state;
});

export function catchErrors(pluginFunctions){
		return function(state){
			return pluginFunctions(state)
			.catch((error)=>{
					console.log('error', error);
				});
		}
}

export function splitCode(file){
	return List(file.match(/\/\*eTr.+?eTr\*\//g));
}

export function splitContent(file){
	const contents = List(file.split(/\/\*eTr.+?eTr\*\//));
	return contents.shift();
}

export function getRawVariables(code){
	return List(code.match(rawVariableRegExp));
}
export const rawVariableRegExp = /\<\!.+\!\>/ig

export function updateGlobalVariables(state){
	const rawVariables = getRawVariables(state.get('code'));
	const reducerReadyRawVariables = rawVariables.unshift(state.get('globalVariables'));
	return state.set('globalVariables', 
		reducerReadyRawVariables.reduce( (updatingGlobalVariables, rawVariable) => {
			return updatingGlobalVariables.merge(convertRawVariableToObject(rawVariable));
		})
	);
}

export function convertRawVariableToObject(rawVariable){
	const cleanRawVariable 	= rawVariable.slice(2, -2);
	const rawVariableKey 	= getRawVariableKey(cleanRawVariable);
	const rawVariableValue 	= getRawVariableValue(cleanRawVariable);
	return Map().set(rawVariableKey, rawVariableValue);
}

export function getRawVariableKey(rawVariable){
	return rawVariable.match(rawVariableKeyRegExp)[0];
}
export const rawVariableKeyRegExp = /^.+?(?=\=)/;
export function getRawVariableValue(rawVariable){
	return rawVariable.replace(rawVariableValueRegExp, '');
}
export const rawVariableValueRegExp = /^.+?\=/;

export function updateFilename(state){
	const filename = getFilename(state.get('code'));
	return state.set('filename', filename)
}	

export function getFilename(code){
	return code.replace(allButFilenameRegExp, '');
}

const eTrStartRegExp = /\/\*eTr/
const eTrEndRegExp = /eTr\*\//
const allButFilenameRegExp = new RegExp(
									eTrStartRegExp.source
									+'|'+eTrEndRegExp.source
									+'|'+rawVariableRegExp.source
									+'|'+'\\s'
									, 'g');

export function transformContent(state){
		const newContent = state.get('content').replace(transformRegExp(state.get('globalVariables')), (matched)=>{
			const globalVariable = matched.replace(removeTagsRegExp, '');
			return state.getIn(['globalVariables', globalVariable]);
		})
	return state.set('content', newContent);
}
const removeTagsRegExp = /^\<\!|\!\>$/g;

export function transformRegExp(globalVariables){
	const pattern = List(globalVariables.keySeq().toArray()).unshift('').reduce((prev, current)=>{
		return prev + transformMatchRegExp(current)+'|';
	})
	return new RegExp(pattern.slice(0, -1), 'g');
}

export function transformMatchRegExp(global){
	return '\\<\\!'+global+'\\!\\>';
}



/*




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
		return new RegExp(/\/\*eTr.+eTr\*\/(\\n)* /g);
	}


*/


