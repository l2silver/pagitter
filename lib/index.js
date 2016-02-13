import Promise, {promisify} from 'bluebird';
import {List, Map} from 'immutable';
const writeFile = promisify(require('fs').writeFile);
const readFile = promisify(require('fs').readFile);
const initialState = Map({
	globalVariables: Map()
});
export function run(file = 'pagitter.js', pluginsList = []){
					const plugins = generatePluginFunctions(pluginsList);
					return readFile(file, 'utf8')
					.then((file)=>{
						const actions = List([updateGlobalVariables, updateFilename, transformContent, plugins]);
						const codes = splitCode(file);
						const contents = splitContent(file);
						return codes.reduce((promiseReturningState, code, index)=>{
							return promiseReturningState
							.then((state)=>{
								return runActionsOnState(actions, 
									addContentAndCode(state, contents.get(index-1), code)
								);
							})
						},
						initialStatePromise(initialState)
						);
					})
					.catch((error)=>{
						console.log('error', error);
					});
				}
export const initialStatePromise = Promise.method((state)=>{
	return state
});

export function addContentAndCode(state, content, code){
	return state.merge({
						code,
						content
					});
}

export function runActionsOnState(actions, state){
	return actions.reduce(
		(promiseReturningState, action)=>{
			return promiseReturningState.then((currentState)=>{
				return action(currentState);
			});
		},
		initialStatePromise(state)
	);
}

export function generatePluginFunctions(plugins){
	return pluginStream(plugins);
}

export function pluginStream(plugins){
	const pluginFunctions = plugins.reduce((oldFunction, plugin)=>{
		return function(state){
			return oldFunction(state)
			.then((oldFunctionState)=>{
				return plugin(oldFunctionState);
			})
		}
	}, initialPluginPromise);
	return pluginFunctions
}


export const initialPluginPromise = Promise.method(function initialPluginPromise(state){
	return state;
});

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

export const updateGlobalVariables = Promise.method((state)=>{
	const rawVariables = getRawVariables(state.get('code'));
	return state.set('globalVariables', 
		rawVariables.reduce( (updatingGlobalVariables, rawVariable) => {
			return updatingGlobalVariables.merge(convertRawVariableToObject(rawVariable));
		}, state.get('globalVariables'))
	);
});

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

export const updateFilename = Promise.method((state)=>{
	const filename = getFilename(state.get('code'));
	return state.set('filename', filename)
});

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

export const transformContent = Promise.method((state)=>{
		const newContent = state.get('content').replace(transformRegExp(state.get('globalVariables')), (matched)=>{
			const globalVariable = matched.replace(removeTagsRegExp, '');
			return state.getIn(['globalVariables', globalVariable]);
		})
	return state.set('content', newContent);
});
const removeTagsRegExp = /^\<\!|\!\>$/g;

export function transformRegExp(globalVariables){
	const pattern = List(globalVariables.keySeq().toArray()).reduce((prev, current)=>{
		return prev + transformMatchRegExp(current)+'|';
	}, '')
	return new RegExp(pattern.slice(0, -1), 'g');
}

export function transformMatchRegExp(global){
	return '\\<\\!'+global+'\\!\\>';
}
