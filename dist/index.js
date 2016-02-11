'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.transformContent = exports.updateFilename = exports.rawVariableValueRegExp = exports.rawVariableKeyRegExp = exports.updateGlobalVariables = exports.rawVariableRegExp = exports.initialPluginPromise = exports.initialStatePromise = undefined;
exports.run = run;
exports.addContentAndCode = addContentAndCode;
exports.runActionsOnState = runActionsOnState;
exports.generatePluginFunctions = generatePluginFunctions;
exports.pluginStream = pluginStream;
exports.catchErrors = catchErrors;
exports.splitCode = splitCode;
exports.splitContent = splitContent;
exports.getRawVariables = getRawVariables;
exports.convertRawVariableToObject = convertRawVariableToObject;
exports.getRawVariableKey = getRawVariableKey;
exports.getRawVariableValue = getRawVariableValue;
exports.getFilename = getFilename;
exports.transformRegExp = transformRegExp;
exports.transformMatchRegExp = transformMatchRegExp;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _immutable = require('immutable');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var writeFile = (0, _bluebird.promisify)(require('fs').writeFile);
var readFile = (0, _bluebird.promisify)(require('fs').readFile);
var initialState = (0, _immutable.Map)({ globalVariables: (0, _immutable.Map)() });
function run() {
	var file = arguments.length <= 0 || arguments[0] === undefined ? 'pagitter.js' : arguments[0];

	return readFile('.pagitter', 'utf8').then(function (json) {
		var pluginsList = (0, _immutable.List)(JSON.parse(json).plugins);
		var plugins = generatePluginFunctions(pluginsList);
		return readFile(file, 'utf8').then(function (file) {
			var actions = (0, _immutable.List)([updateGlobalVariables, updateFilename, transformContent, plugins]);
			var codes = splitCode(file);
			var contents = splitContent(file);
			return codes.reduce(function (promiseReturningState, code, index) {
				return promiseReturningState.then(function (state) {
					return runActionsOnState(actions, addContentAndCode(state, contents.get(index - 1), code));
				});
			}, initialStatePromise(initialState));
		});
	}).catch(function (error) {
		console.log('error', error);
	});
}
var initialStatePromise = exports.initialStatePromise = _bluebird2.default.method(function (state) {
	return state;
});

function addContentAndCode(state, content, code) {
	return state.merge({
		code: code,
		content: content
	});
}

function runActionsOnState(actions, state) {
	return actions.reduce(function (promiseReturningState, action) {
		return promiseReturningState.then(function (currentState) {
			return action(currentState);
		});
	}, initialStatePromise(state));
}

function generatePluginFunctions(plugins) {
	return catchErrors(pluginStream(plugins));
}

function pluginStream(plugins) {
	var pluginFunctions = plugins.unshift(initialPluginPromise).reduce(function (oldFunction, pluginName) {
		return function (state) {
			return oldFunction(state).then(function (oldFunctionState) {
				var generatePromise = require(pluginName).default;
				return generatePromise(oldFunctionState);
			});
		};
	});
	return pluginFunctions;
}

var initialPluginPromise = exports.initialPluginPromise = _bluebird2.default.method(function initialPluginPromise(state) {
	return state;
});

function catchErrors(pluginFunctions) {
	return function (state) {
		return pluginFunctions(state).catch(function (error) {
			console.log('error', error);
		});
	};
}

function splitCode(file) {
	return (0, _immutable.List)(file.match(/\/\*eTr.+?eTr\*\//g));
}

function splitContent(file) {
	var contents = (0, _immutable.List)(file.split(/\/\*eTr.+?eTr\*\//));
	return contents.shift();
}

function getRawVariables(code) {
	return (0, _immutable.List)(code.match(rawVariableRegExp));
}
var rawVariableRegExp = exports.rawVariableRegExp = /\<\!.+\!\>/ig;

var updateGlobalVariables = exports.updateGlobalVariables = _bluebird2.default.method(function (state) {
	var rawVariables = getRawVariables(state.get('code'));
	var reducerReadyRawVariables = rawVariables.unshift(state.get('globalVariables'));
	return state.set('globalVariables', reducerReadyRawVariables.reduce(function (updatingGlobalVariables, rawVariable) {
		return updatingGlobalVariables.merge(convertRawVariableToObject(rawVariable));
	}));
});

function convertRawVariableToObject(rawVariable) {
	var cleanRawVariable = rawVariable.slice(2, -2);
	var rawVariableKey = getRawVariableKey(cleanRawVariable);
	var rawVariableValue = getRawVariableValue(cleanRawVariable);
	return (0, _immutable.Map)().set(rawVariableKey, rawVariableValue);
}

function getRawVariableKey(rawVariable) {
	return rawVariable.match(rawVariableKeyRegExp)[0];
}
var rawVariableKeyRegExp = exports.rawVariableKeyRegExp = /^.+?(?=\=)/;
function getRawVariableValue(rawVariable) {
	return rawVariable.replace(rawVariableValueRegExp, '');
}
var rawVariableValueRegExp = exports.rawVariableValueRegExp = /^.+?\=/;

var updateFilename = exports.updateFilename = _bluebird2.default.method(function (state) {
	var filename = getFilename(state.get('code'));
	return state.set('filename', filename);
});

function getFilename(code) {
	return code.replace(allButFilenameRegExp, '');
}

var eTrStartRegExp = /\/\*eTr/;
var eTrEndRegExp = /eTr\*\//;
var allButFilenameRegExp = new RegExp(eTrStartRegExp.source + '|' + eTrEndRegExp.source + '|' + rawVariableRegExp.source + '|' + '\\s', 'g');

var transformContent = exports.transformContent = _bluebird2.default.method(function (state) {
	var newContent = state.get('content').replace(transformRegExp(state.get('globalVariables')), function (matched) {
		var globalVariable = matched.replace(removeTagsRegExp, '');
		return state.getIn(['globalVariables', globalVariable]);
	});
	return state.set('content', newContent);
});
var removeTagsRegExp = /^\<\!|\!\>$/g;

function transformRegExp(globalVariables) {
	var pattern = (0, _immutable.List)(globalVariables.keySeq().toArray()).unshift('').reduce(function (prev, current) {
		return prev + transformMatchRegExp(current) + '|';
	});
	return new RegExp(pattern.slice(0, -1), 'g');
}

function transformMatchRegExp(global) {
	return '\\<\\!' + global + '\\!\\>';
}
